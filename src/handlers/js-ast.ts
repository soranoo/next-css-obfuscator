import * as parser from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import generator from "@babel/generator";

import { obfuscateKeys } from "../utils";
import { type SelectorConversion } from "../types";

/**
 * Obfuscate the JavaScript code using AST(Abstract Syntax Tree)
 * @param code - the JavaScript code to be obfuscated
 * @param selectorConversion - the selector conversion dictionary
 * @param startingKeys - the keys to start obfuscating from, if empty, obfuscate all keys in the selectorConversion
 * @param stripUnnecessarySpace - whether to strip unnecessary space in the className, e.g. "  a  b  c  " => "a b c"
 * @returns - the obfuscated code and the used keys
 */
function obfuscateJsWithAst(
  code: string,
  selectorConversion: SelectorConversion | undefined,
  startingKeys: string[] = [],
  stripUnnecessarySpace: boolean = true
) {
  const ast = parser.parse(code, { sourceType: "module", plugins: ["jsx"] });
  const usedKeys: Set<string> = new Set();

  // traverse AST to find key-value pairs
  traverse(ast, {
    ObjectProperty(path) {
      // handle className
      if (t.isIdentifier(path.node.key) && path.node.key.name === "className") {
        searchStringLiterals(path.get("value"), (str) => {
          if (startingKeys.length > 0 && !startingKeys.includes(str)) {
            return str;
          }

          if (!selectorConversion) {
            return "{{obfuscated}}";
          }

          // strip unnecessary space, e.g. "  a  b  c  " => "a b c"
          str = stripUnnecessarySpace ? str.replace(/\s+/g, " ").trim() : str;

          const { obfuscatedContent, usedKeys: obfuscateUsedKeys } = obfuscateKeys(selectorConversion, str);
          if (obfuscatedContent !== str) {
            obfuscateUsedKeys.forEach(key => usedKeys.add(key));
            return obfuscatedContent;
          }
        });
      }
    },
  });

  const options = {
    compact: true,
    concise: true,
    retainLines: false,
    comments: false,
    minified: true,
  };
  const obfuscatedCode = generator(ast, options, code);
  return {
    obfuscatedCode: obfuscatedCode.code,
    usedKeys: usedKeys
  };
}


/**
 * Search for string literals in the AST and replace them with the result of the callback function
 * @param path - the starting AST node
 * @param callback - the function to be called with the string literal as an argument, if the callback returns a string, the string literal will be replaced with the return value
 * @param scannedNodes - (for recursion) keep track of scanned nodes to avoid infinite loop
 * @returns - the modified AST node
 */
function searchStringLiterals(path: NodePath<t.Node>,
  callback: (str: string) => void | string,

  //? keep track of scanned nodes to avoid infinite loop
  scannedNodes: Set<t.Node> = new Set()
) {
  /* Skip this node if it has already been scanned */
  if (path.node && scannedNodes.has(path.node)) {
    return;
  }
  scannedNodes.add(path.node);

  /* content inside a function */
  if (t.isBlockStatement(path.node)) {
    const body = path.get("body");
    if (Array.isArray(body)) {
      body.forEach(nodePath => {
        switch (nodePath.node.type) {
          //? only care about statements that return statements maybe inside
          //? to avoid scanning all string literals in that block
          case "ReturnStatement":
          case "IfStatement":
          case "SwitchStatement":
          case "ExpressionStatement":
          case "ForStatement":
          case "WhileStatement":
          case "TryStatement":
            searchStringLiterals(nodePath, callback, scannedNodes);
            break;
        }
      });
    } else {
      searchStringLiterals(body, callback, scannedNodes);
    }
  }
  /* function return statement */
  else if (t.isReturnStatement(path.node)) {
    const argument = path.get("argument");
    if (argument) {
      if (!Array.isArray(argument)) {
        searchStringLiterals(argument, callback, scannedNodes);
      } else {
        argument.forEach(arg => {
          searchStringLiterals(arg, callback, scannedNodes);
        });
      }
    } 
  }
  /* binary expression (e.g. const a = "hello" + "world") */
  else if (t.isBinaryExpression(path.node)) {
    const left = path.get("left");
    const right = path.get("right");
    if (left && !Array.isArray(left)) {
      searchStringLiterals(left, callback, scannedNodes);
    }
    if (right && !Array.isArray(right)) {
      searchStringLiterals(right, callback, scannedNodes);
    }
  }
  /* string literal (e.g. "hello"), the string within the quotes */
  else if (t.isStringLiteral(path.node)) {
    const replacement = callback(path.node.value);
    if (replacement) {
      path.replaceWith(t.stringLiteral(replacement));
    }
  }
  else if (t.isIdentifier(path.node)) {
    const variableName = path.node.name;
    const binding = path.scope.getBinding(variableName);
    if (binding && t.isVariableDeclarator(binding.path.node)) {
      const init = binding.path.get("init");
      if (init && !Array.isArray(init)) {
        searchStringLiterals(init, callback, scannedNodes);
      }
    } else if (binding && t.isFunctionDeclaration(binding.path.node)) {
      const body = binding.path.get("body");
      if (body && !Array.isArray(body)) {
        searchStringLiterals(body, callback, scannedNodes);
      }
    }
  }
  /* call expression (e.g. const a = call()) */
  else if (t.isCallExpression(path.node)) {
    const callee = path.get("callee");
    if (callee && !Array.isArray(callee)) {
      searchStringLiterals(callee, callback, scannedNodes);
    }
    const args = path.get("arguments");
    if (Array.isArray(args)) {
      args.forEach(arg => {
        if (t.isStringLiteral(arg.node)) {
          const replacement = callback(arg.node.value);
          if (replacement) {
            arg.replaceWith(t.stringLiteral(replacement));
          }
        } else {
          searchStringLiterals(arg, callback, scannedNodes);
        }
      });
    }
  }
  /* conditional expression (e.g. const a = true ? "hello" : "world") */
  else if (t.isConditionalExpression(path.node)) {
    const test = path.get("test");
    const consequent = path.get("consequent");
    const alternate = path.get("alternate");
    if (test && !Array.isArray(test)) {
      searchStringLiterals(test, callback, scannedNodes);
    }
    if (consequent && !Array.isArray(consequent)) {
      searchStringLiterals(consequent, callback, scannedNodes);
    }
    if (alternate && !Array.isArray(alternate)) {
      searchStringLiterals(alternate, callback, scannedNodes);
    }
  }
  /* if statement (e.g. if (true) { "hello" } else { "world" }) */
  else if (t.isIfStatement(path.node)) {
    const test = path.get("test");
    const consequent = path.get("consequent");
    const alternate = path.get("alternate");
    if (test && !Array.isArray(test)) {
      searchStringLiterals(test, callback, scannedNodes);
    }
    if (consequent && !Array.isArray(consequent)) {
      searchStringLiterals(consequent, callback, scannedNodes);
    }
    if (alternate && !Array.isArray(alternate)) {
      searchStringLiterals(alternate, callback, scannedNodes);
    }
  }
  /* object expression (e.g. const a = { key: "value" }) */
  else if (t.isObjectExpression(path.node)) {
    const properties = path.get("properties");
    if (Array.isArray(properties)) {
      properties.forEach(prop => {
        searchStringLiterals(prop, callback, scannedNodes);
      });
    }
  }
  /* object property (key and value of an object expression) */
  else if (t.isObjectProperty(path.node)) {
    const value = path.get("value");
    if (value && !Array.isArray(value)) {
      searchStringLiterals(value, callback, scannedNodes);
    }
  }
  /* array expression (e.g. const a = ["element_1", "element_2"]) */
  else if (t.isArrayExpression(path.node)) {
    const elements = path.get("elements");
    if (Array.isArray(elements)) {
      elements.forEach(element => {
        searchStringLiterals(element, callback, scannedNodes);
      });
    }
  }
  /* switch statement (e.g. switch (value) { case "1": return "one"; case "2": return "two"; default: return "default"; }) */
  else if (t.isSwitchStatement(path.node)) {
    const cases = path.get("cases");
    if (Array.isArray(cases)) {
      cases.forEach(c => {
        searchStringLiterals(c, callback, scannedNodes);
      });
    }
  }
  /* switch case (e.g. case "1": return "one") */
  else if (t.isSwitchCase(path.node)) {
    const consequent = path.get("consequent");
    if (Array.isArray(consequent)) {
      consequent.forEach(c => {
        if (t.isReturnStatement(c.node)) { // only care about return statements, if any variable declarations are present, they will be handled in the next iteration
          searchStringLiterals(c, callback, scannedNodes);
        }
      });
    }
  } else if (t.isFunctionDeclaration(path.node)) {
    const body = path.get("body");
    if (body && !Array.isArray(body)) {
      searchStringLiterals(body, callback, scannedNodes);
    }
  } else if (t.isForStatement(path.node)) {
    const body = path.get("body");
    if (body && !Array.isArray(body)) {
      searchStringLiterals(body, callback, scannedNodes);
    }
  } else if (t.isExpressionStatement(path.node)) {
    const expression = path.get("expression");
    if (expression && !Array.isArray(expression)) {
      searchStringLiterals(expression, callback, scannedNodes);
    }
  } else if (t.isAssignmentExpression(path.node)) {
    const right = path.get("right");
    if (right && !Array.isArray(right)) {
      searchStringLiterals(right, callback, scannedNodes);
    }
  } else if (t.isWhileStatement(path.node)) {
    const body = path.get("body");
    if (body && !Array.isArray(body)) {
      searchStringLiterals(body, callback, scannedNodes);
    }
  } else if (t.isSpreadElement(path.node)) {
    const argument = path.get("argument");
    if (argument && !Array.isArray(argument)) {
      searchStringLiterals(argument, callback, scannedNodes);
    }
  } else if (t.isArrowFunctionExpression(path.node)) {
    const body = path.get("body");
    if (body && !Array.isArray(body)) {
      searchStringLiterals(body, callback, scannedNodes);
    }
  } else if (t.isTryStatement(path.node)) {
    const block = path.get("block");
    const handler = path.get("handler");
    if (block && !Array.isArray(block)) {
      searchStringLiterals(block, callback, scannedNodes);
    }
    if (handler && !Array.isArray(handler)) {
      const handlerBody = handler.get("body");
      if (handlerBody && !Array.isArray(handlerBody)) {
        searchStringLiterals(handlerBody, callback, scannedNodes);
      }
    }
  } 
  /* member expression (e.g. "scroll-top".replace("-", "_")); "scroll-top ".concat("visible"); */
  else if (t.isMemberExpression(path.node)) {
    const object = path.get("object");
    const property = path.get("property");
    const argument = path.get("argument");
    if (object && !Array.isArray(object)) {
      searchStringLiterals(object, callback, scannedNodes);
    }
    if (property && !Array.isArray(property)) {
      searchStringLiterals(property, callback, scannedNodes);
    }
    if (argument && !Array.isArray(argument)) {
      searchStringLiterals(argument, callback, scannedNodes);
    } else if (Array.isArray(argument)) {
      argument.forEach(arg => {
        searchStringLiterals(arg, callback, scannedNodes);
      });
    }
  } else {
    path.traverse({
      Identifier(innerPath) {
        searchStringLiterals(innerPath, callback, scannedNodes);

        // Additional logic can be added here if needed
      },
      // Add other node types as needed for more comprehensive analysis
    });
  }
  return path;
}

export {
  searchStringLiterals,
  obfuscateJsWithAst,
}