import generator from "@babel/generator";
import * as parser from "@babel/parser";
import traverse, { type NodePath } from "@babel/traverse";
import type * as t from "@babel/types";
import { describe, expect, it } from "vitest";
import { obfuscateJsWithAst, searchStringLiterals } from "../handlers/js-ast";

const stripCode = (code: string) => {
  return code.replace(/\s/g, "");
};

//! ================================
//! searchStringLiterals
//! ================================

describe("searchStringLiterals", () => {
  const findStartPointNode = (ast: t.File) => {
    let startPointNode: NodePath<t.Node> | undefined;
    traverse(ast, {
      FunctionDeclaration(path) {
        if (path.node.id?.name === "startPoint") {
          startPointNode = path.get("body");
        }
      },
    });
    return startPointNode;
  };

  //? *******************************
  //? Basic
  //? *******************************

  it("should handle string literals correctly", () => {
    const code = `
    const a = "test";

    function startPoint() {
      return "function";
    }
    `;
    const expectedCode = `
    const a = "test";

    function startPoint() {
      return "{{found}}";
    }
    `;

    const ast = parser.parse(code);
    const result: string[] = [];
    searchStringLiterals(findStartPointNode(ast)!, (str) => {
      result.push(str);
      return "{{found}}";
    });

    const expected = ["function"];

    expect(result).toEqual(expected);
    expect(stripCode(generator(ast, {}, code).code)).toEqual(
      stripCode(expectedCode),
    );
  });

  it("should not handle string literals in comments", () => {
    const code = `
    // const a = "test";

    function startPoint() {
      return "function";
    }
    `;
    const expectedCode = `
    // const a = "test";

    function startPoint() {
      return "{{found}}";
    }
    `;

    const ast = parser.parse(code);
    const result: string[] = [];
    searchStringLiterals(findStartPointNode(ast)!, (str) => {
      result.push(str);
      return "{{found}}";
    });
    const expected = ["function"];

    expect(result).toEqual(expected);
    expect(stripCode(generator(ast, {}, code).code)).toEqual(
      stripCode(expectedCode),
    );
  });

  //? *******************************
  //? Declare Variables
  //? *******************************

  it("should handle variable declarations correctly", () => {
    const code = `
    const a = "test";
    let b = "test2";
    var c = "test3";
    
    function startPoint() {
      const d = "test4";
      let e = "test5";
      var f = "test6";
      return a + b + c + d + e + f;
    }
    `;
    const expectedCode = `
    const a = "{{found}}";
    let b = "{{found}}";
    var c = "{{found}}";
    
    function startPoint() {
      const d = "{{found}}";
      let e = "{{found}}";
      var f = "{{found}}";
      return a + b + c + d + e + f;
    }
    `;

    const ast = parser.parse(code);
    const result: string[] = [];
    searchStringLiterals(findStartPointNode(ast)!, (str) => {
      result.push(str);
      return "{{found}}";
    });
    const expected = ["test", "test2", "test3", "test4", "test5", "test6"];

    expect(result).toEqual(expected);
    expect(stripCode(generator(ast, {}, code).code)).toEqual(
      stripCode(expectedCode),
    );
  });

  it("should handle variable declarations with multiple variables correctly", () => {
    const code = `
    const a = "test", b = "test2";

    function startPoint() {
      return a + b;
    }
    `;
    const expectedCode = `
    const a = "{{found}}", b = "{{found}}";

    function startPoint() {
      return a + b;
    }
    `;

    const ast = parser.parse(code);
    const result: string[] = [];
    searchStringLiterals(findStartPointNode(ast)!, (str) => {
      result.push(str);
      return "{{found}}";
    });
    const expected = ["test", "test2"];

    expect(result).toEqual(expected);
    expect(stripCode(generator(ast, {}, code).code)).toEqual(
      stripCode(expectedCode),
    );
  });

  //? *******************************
  //? Scopes
  //? *******************************

  it("should handle local variables correctly", () => {
    const code = `
    const globalVar = "out";
    
    function startPoint() {
      const localVar = "world";
      return "hello" + localVar;
    }
    `;
    const expectedCode = `
    const globalVar = "out";
    
    function startPoint() {
      const localVar = "{{found}}";
      return "{{found}}" + localVar;
    }
    `;

    const ast = parser.parse(code);
    const result: string[] = [];
    searchStringLiterals(findStartPointNode(ast)!, (str) => {
      result.push(str);
      return "{{found}}";
    });

    const expected = ["hello", "world"];

    expect(result).toEqual(expected);
    expect(stripCode(generator(ast, {}, code).code)).toEqual(
      stripCode(expectedCode),
    );
  });

  it("should handle global variables correctly", () => {
    const code = `
    const globalVar = "world";
    
    function startPoint() {
      const localVar = "local";
      return "hello" + globalVar;
    }
    `;
    const expectedCode = `
    const globalVar = "{{found}}";
    
    function startPoint() {
      const localVar = "local";
      return "{{found}}" + globalVar;
    }
    `;

    const ast = parser.parse(code);
    const result: string[] = [];
    searchStringLiterals(findStartPointNode(ast)!, (str) => {
      result.push(str);
      return "{{found}}";
    });

    const expected = ["hello", "world"];

    expect(result).toEqual(expected);
    expect(stripCode(generator(ast, {}, code).code)).toEqual(
      stripCode(expectedCode),
    );
  });

  //? *******************************
  //? Branching
  //? *******************************

  it("should handle boolean expressions correctly", () => {
    const code = `
    const globalVar = "world";
    
    function startPoint() {
      const localBool = true;
      const localVar = "again";
      return "hello" + (localBool ? globalVar : localVar);
    }
    `;
    const expectedCode = `
    const globalVar = "{{found}}";
    
    function startPoint() {
      const localBool = true;
      const localVar = "{{found}}";
      return "{{found}}" + (localBool ? globalVar : localVar);
    }
    `;

    const ast = parser.parse(code);
    const result: string[] = [];
    searchStringLiterals(findStartPointNode(ast)!, (str) => {
      result.push(str);
      return "{{found}}";
    });

    const expected = ["hello", "world", "again"];

    expect(result).toEqual(expected);
    expect(stripCode(generator(ast, {}, code).code)).toEqual(
      stripCode(expectedCode),
    );
  });

  it("should handle if statements correctly", () => {
    const code = `
    const globalVar = "world";
    
    function startPoint() {
      const localBool = true;
      const localVar = "again";
      if (localBool) {
        return "hello" + globalVar;
      }
      return "hello" + localVar;
    }
    `;
    const expectedCode = `
    const globalVar = "{{found}}";
    
    function startPoint() {
      const localBool = true;
      const localVar = "{{found}}";
      if (localBool) {
        return "{{found}}" + globalVar;
      }
      return "{{found}}" + localVar;
    }
    `;

    const ast = parser.parse(code);
    const result: string[] = [];
    searchStringLiterals(findStartPointNode(ast)!, (str) => {
      result.push(str);
      return "{{found}}";
    });

    const expected = ["hello", "world", "hello", "again"];

    expect(result).toEqual(expected);
    expect(stripCode(generator(ast, {}, code).code)).toEqual(
      stripCode(expectedCode),
    );
  });

  //? *******************************
  //? Function Calls
  //? *******************************

  it("should handle function calls correctly", () => {
    const code = `
    const globalVar = "global";
    
    function call() {
      return "world";
    }

    function startPoint() {
      return "hello" + globalVar + call();
    }
    `;
    const expectedCode = `
    const globalVar = "{{found}}";
    
    function call() {
      return "{{found}}";
    }

    function startPoint() {
      return "{{found}}" + globalVar + call();
    }
    `;

    const ast = parser.parse(code);
    const result: string[] = [];
    searchStringLiterals(findStartPointNode(ast)!, (str) => {
      result.push(str);
      return "{{found}}";
    });

    const expected = ["hello", "global", "world"];

    expect(result).toEqual(expected);
    expect(stripCode(generator(ast, {}, code).code)).toEqual(
      stripCode(expectedCode),
    );
  });

  it("should handle function calls with arguments correctly", () => {
    const code = `
    const globalVar = "global";

    function call(arg) {
      return arg;
    }

    function startPoint() {
      return "hello" + globalVar + call("world");
    }
    `;
    const expectedCode = `
    const globalVar = "{{found}}";

    function call(arg) {
      return arg;
    }

    function startPoint() {
      return "{{found}}" + globalVar + call("{{found}}");
    }
    `;

    const ast = parser.parse(code);
    const result: string[] = [];
    searchStringLiterals(findStartPointNode(ast)!, (str) => {
      result.push(str);
      return "{{found}}";
    });

    const expected = ["hello", "global", "world"];

    expect(result).toEqual(expected);
    expect(stripCode(generator(ast, {}, code).code)).toEqual(
      stripCode(expectedCode),
    );
  });

  it("should handle function calls with multiple arguments correctly", () => {
    const code = `
    const globalVar = "global";

    function call(arg, arg2) {
      return arg + arg2;
    }

    function startPoint() {
      return "hello" + globalVar + call("world", "again");
    }
    `;
    const expectedCode = `
    const globalVar = "{{found}}";

    function call(arg, arg2) {
      return arg + arg2;
    }

    function startPoint() {
      return "{{found}}" + globalVar + call("{{found}}", "{{found}}");
    }
    `;

    const ast = parser.parse(code);
    const result: string[] = [];
    searchStringLiterals(findStartPointNode(ast)!, (str) => {
      result.push(str);
      return "{{found}}";
    });

    const expected = ["hello", "global", "world", "again"];

    expect(result).toEqual(expected);
    expect(stripCode(generator(ast, {}, code).code)).toEqual(
      stripCode(expectedCode),
    );
  });

  it("should handle function calls with nested function calls correctly", () => {
    const code = `
    const globalVar = "global";

    function call(arg, arg2) {
      return arg + arg2;
    }

    function call2(arg) {
      return arg;
    }

    function startPoint() {
      return "hello" + globalVar + call(call2("world"), "again");
    }
    `;
    const expectedCode = `
    const globalVar = "{{found}}";

    function call(arg, arg2) {
      return arg + arg2;
    }

    function call2(arg) {
      return arg;
    }

    function startPoint() {
      return "{{found}}" + globalVar + call(call2("{{found}}"), "{{found}}");
    }
    `;

    const ast = parser.parse(code);
    const result: string[] = [];
    searchStringLiterals(findStartPointNode(ast)!, (str) => {
      result.push(str);
      return "{{found}}";
    });

    const expected = ["hello", "global", "world", "again"];

    expect(result).toEqual(expected);
    expect(stripCode(generator(ast, {}, code).code)).toEqual(
      stripCode(expectedCode),
    );
  });

  it("should handle function calls with boolean expressions correctly", () => {
    const code = `
    const globalVar = "global";

    function call(arg, arg2) {
      return arg + arg2;
    }

    function call2(arg) {
      return arg;
    }

    function startPoint() {
      const bool = true;
      return "hello" + globalVar + call(bool ? "world1" : call2("world2"), "again");
    }
    `;
    const expectedCode = `
    const globalVar = "{{found}}";

    function call(arg, arg2) {
      return arg + arg2;
    }

    function call2(arg) {
      return arg;
    }

    function startPoint() {
      const bool = true;
      return "{{found}}" + globalVar + call(bool ? "{{found}}" : call2("{{found}}"), "{{found}}");
    }
    `;

    const ast = parser.parse(code);
    const result: string[] = [];
    searchStringLiterals(findStartPointNode(ast)!, (str) => {
      result.push(str);
      return "{{found}}";
    });

    const expected = ["hello", "global", "world1", "world2", "again"];

    expect(result).toEqual(expected);
    expect(stripCode(generator(ast, {}, code).code)).toEqual(
      stripCode(expectedCode),
    );
  });

  it("should handle arrow function calls correctly", () => {
    const code = `
    const globalVar = "global";

    const call = (arg, arg2) => {
      return arg + arg2;
    };

    function startPoint() {
      return "hello" + globalVar + call("world", "again");
    }
    `;
    const expectedCode = `
    const globalVar = "{{found}}";

    const call = (arg, arg2) => {
        return arg + arg2;
    };

    function startPoint() {
        return "{{found}}" + globalVar + call("{{found}}", "{{found}}");
    }
    `;

    const ast = parser.parse(code);
    const result: string[] = [];
    searchStringLiterals(findStartPointNode(ast)!, (str) => {
      result.push(str);
      return "{{found}}";
    });

    const expected = ["hello", "global", "world", "again"];

    expect(result).toEqual(expected);
    expect(stripCode(generator(ast, {}, code).code)).toEqual(
      stripCode(expectedCode),
    );
  });

  //? *******************************
  //? Basic Browser API
  //? *******************************

  it("should handle document.{method} correctly", () => {
    const code = `
    function startPoint() {
      return document.getElementById("element");
    }
    `;
    const expectedCode = `
    function startPoint() {
      return document.getElementById("{{found}}");
    }
    `;

    const ast = parser.parse(code);
    const result: string[] = [];
    searchStringLiterals(findStartPointNode(ast)!, (str) => {
      result.push(str);
      return "{{found}}";
    });

    const expected = ["element"];

    expect(result).toEqual(expected);
    expect(stripCode(generator(ast, {}, code).code)).toEqual(
      stripCode(expectedCode),
    );
  });

  it("should handle document.{method} with variables correctly", () => {
    const code = `
    function startPoint() {
      const id = "element";
      return document.getElementById(id);
    }
    `;
    const expectedCode = `
    function startPoint() {
      const id = "{{found}}";
      return document.getElementById(id);
    }
    `;

    const ast = parser.parse(code);
    const result: string[] = [];
    searchStringLiterals(findStartPointNode(ast)!, (str) => {
      result.push(str);
      return "{{found}}";
    });

    const expected = ["element"];

    expect(result).toEqual(expected);
    expect(stripCode(generator(ast, {}, code).code)).toEqual(
      stripCode(expectedCode),
    );
  });

  //? *******************************
  //? Object (aka. Dictionary)
  //? *******************************

  it("should handle object expressions correctly", () => {
    const code = `
    function startPoint() {
      const obj = {
        key: "value"
      };
      return obj.key;
    }
    `;
    const expectedCode = `
    function startPoint() {
      const obj = {
        key: "{{found}}"
      };
      return obj.key;
    }
    `;

    const ast = parser.parse(code);
    const result: string[] = [];
    searchStringLiterals(findStartPointNode(ast)!, (str) => {
      result.push(str);
      return "{{found}}";
    });

    const expected = ["value"];

    expect(result).toEqual(expected);
    expect(stripCode(generator(ast, {}, code).code)).toEqual(
      stripCode(expectedCode),
    );
  });

  it("should handle object expressions' operations correctly", () => {
    const code = `
    function startPoint() {
      const obj = {
        key: "value"
      };
      obj.key = "another";
      obj["key2"] = "another2";
      return obj.key;
    }
    `;
    const expectedCode = `
    function startPoint() {
      const obj = {
        key: "{{found}}"
      };
      obj.key = "{{found}}";
      obj["key2"] = "{{found}}";
      return obj.key;
    }
    `;

    const ast = parser.parse(code);
    const result: string[] = [];
    searchStringLiterals(findStartPointNode(ast)!, (str) => {
      result.push(str);
      return "{{found}}";
    });

    const expected = ["another", "another2", "value"];

    expect(result).toEqual(expected);
    expect(stripCode(generator(ast, {}, code).code)).toEqual(
      stripCode(expectedCode),
    );
  });

  it("should handle object expressions with variables correctly", () => {
    const code = `
    function startPoint() {
      const value = "value";
      const obj = {
        key: value
      };
      return obj.key;
    }
    `;
    const expectedCode = `
    function startPoint() {
      const value = "{{found}}";
      const obj = {
        key: value
      };
      return obj.key;
    }
    `;

    const ast = parser.parse(code);
    const result: string[] = [];
    searchStringLiterals(findStartPointNode(ast)!, (str) => {
      result.push(str);
      return "{{found}}";
    });

    const expected = ["value"];

    expect(result).toEqual(expected);
    expect(stripCode(generator(ast, {}, code).code)).toEqual(
      stripCode(expectedCode),
    );
  });

  it("should handle object expressions with function calls correctly", () => {
    const code = `
    function call() {
      return "call";
    }

    function startPoint() {
      const obj = {
        key: call()
      };
      return obj.key;
    }
    `;
    const expectedCode = `
    function call() {
      return "{{found}}";
    }

    function startPoint() {
      const obj = {
        key: call()
      };
      return obj.key;
    }
    `;

    const ast = parser.parse(code);
    const result: string[] = [];
    searchStringLiterals(findStartPointNode(ast)!, (str) => {
      result.push(str);
      return "{{found}}";
    });

    const expected = ["call"];

    expect(result).toEqual(expected);
    expect(stripCode(generator(ast, {}, code).code)).toEqual(
      stripCode(expectedCode),
    );
  });

  it("should handle object expressions with function calls with arguments correctly", () => {
    const code = `
    function call(arg) {
      return arg;
    }

    function startPoint() {
      const obj = {
        key: call("call")
      };
      return obj.key;
    }
    `;
    const expectedCode = `
    function call(arg) {
      return arg;
    }

    function startPoint() {
      const obj = {
        key: call("{{found}}")
      };
      return obj.key;
    }
    `;

    const ast = parser.parse(code);
    const result: string[] = [];
    searchStringLiterals(findStartPointNode(ast)!, (str) => {
      result.push(str);
      return "{{found}}";
    });

    const expected = ["call"];

    expect(result).toEqual(expected);
    expect(stripCode(generator(ast, {}, code).code)).toEqual(
      stripCode(expectedCode),
    );
  });

  it("should handle object expressions with function calls with boolean expressions correctly", () => {
    const code = `
    function call(arg) {
      return arg;
    }

    function startPoint() {
      const value = "value";
      const bool = true;
      const obj = {
        key: call(bool ? value : "another")
      };
      return obj.key;
    }
    `;
    const expectedCode = `
    function call(arg) {
      return arg;
    }

    function startPoint() {
      const value = "{{found}}";
      const bool = true;
      const obj = {
        key: call(bool ? value : "{{found}}")
      };
      return obj.key;
    }
    `;

    const ast = parser.parse(code);
    const result: string[] = [];
    searchStringLiterals(findStartPointNode(ast)!, (str) => {
      result.push(str);
      return "{{found}}";
    });

    const expected = ["value", "another"];

    expect(result).toEqual(expected);
    expect(stripCode(generator(ast, {}, code).code)).toEqual(
      stripCode(expectedCode),
    );
  });

  it("should handle object expressions with a variable key correctly", () => {
    const code = `
    function call(arg) {
      return arg;
    }

    function startPoint() {
      const key = "value";
      const bool = true;
      const obj = {
        key: call(bool ? key : "another")
      };
      return obj.key;
    }
    `;
    const expectedCode = `
    function call(arg) {
      return arg;
    }

    function startPoint() {
      const key = "{{found}}";
      const bool = true;
      const obj = {
        key: call(bool ? key : "{{found}}")
      };
      return obj.key;
    }
    `;

    const ast = parser.parse(code);
    const result: string[] = [];
    searchStringLiterals(findStartPointNode(ast)!, (str) => {
      result.push(str);
      return "{{found}}";
    });

    const expected = ["value", "another", "{{found}}"];

    expect(result).toEqual(expected);
    expect(stripCode(generator(ast, {}, code).code)).toEqual(
      stripCode(expectedCode),
    );
  });

  //? *******************************
  //? Array
  //? *******************************

  it("should handle array expressions correctly", () => {
    const code = `
    function startPoint() {
      const arr = ["element_1", "element_2"];
      return arr[0];
    }
    `;
    const expectedCode = `
    function startPoint() {
      const arr = ["{{found}}", "{{found}}"];
      return arr[0];
    }
    `;

    const ast = parser.parse(code);
    const result: string[] = [];
    searchStringLiterals(findStartPointNode(ast)!, (str) => {
      result.push(str);
      return "{{found}}";
    });

    const expected = ["element_1", "element_2"];

    expect(result).toEqual(expected);
    expect(stripCode(generator(ast, {}, code).code)).toEqual(
      stripCode(expectedCode),
    );
  });

  it("should handle array concatenation correctly and no duplicates node should be scaned", () => {
    const code = `
    function startPoint() {
      const arr = ["element_1"];
      const arr2 = ["element_2"];
      const arr3 = arr.concat(arr2);
      const arr4 = [...arr, ...arr3];
      return arr4;
    }
    `;
    const expectedCode = `
    function startPoint() {
      const arr = ["{{found}}"];
      const arr2 = ["{{found}}"];
      const arr3 = arr.concat(arr2);
      const arr4 = [...arr, ...arr3];
      return arr4;
    }
    `;

    const ast = parser.parse(code);
    const result: string[] = [];
    searchStringLiterals(findStartPointNode(ast)!, (str) => {
      result.push(str);
      return "{{found}}";
    });

    const expected = ["element_1", "element_2"];

    expect(result).toEqual(expected);
    expect(stripCode(generator(ast, {}, code).code)).toEqual(
      stripCode(expectedCode),
    );
  });

  it("should handle array expressions with variables correctly", () => {
    const code = `
    function startPoint() {
      const element1 = "element_1";
      const element2 = "element_2";
      const arr = [element1, element2];
      return arr[0];
    }
    `;
    const expectedCode = `
    function startPoint() {
      const element1 = "{{found}}";
      const element2 = "{{found}}";
      const arr = [element1, element2];
      return arr[0];
    }
    `;

    const ast = parser.parse(code);
    const result: string[] = [];
    searchStringLiterals(findStartPointNode(ast)!, (str) => {
      result.push(str);
      return "{{found}}";
    });

    const expected = ["element_1", "element_2"];

    expect(result).toEqual(expected);
    expect(stripCode(generator(ast, {}, code).code)).toEqual(
      stripCode(expectedCode),
    );
  });

  it("should handle array expressions with function calls correctly", () => {
    const code = `
    function call() {
      return "element_1";
    }

    function startPoint() {
      const arr = [call(), "element_2"];
      return arr[0];
    }
    `;
    const expectedCode = `
    function call() {
      return "{{found}}";
    }

    function startPoint() {
      const arr = [call(), "{{found}}"];
      return arr[0];
    }
    `;

    const ast = parser.parse(code);
    const result: string[] = [];
    searchStringLiterals(findStartPointNode(ast)!, (str) => {
      result.push(str);
      return "{{found}}";
    });

    const expected = ["element_1", "element_2"];

    expect(result).toEqual(expected);
    expect(stripCode(generator(ast, {}, code).code)).toEqual(
      stripCode(expectedCode),
    );
  });

  it("should handle array expressions with function calls with arguments correctly", () => {
    const code = `
    function call(arg) {
      return arg;
    }

    function startPoint() {
      const arr = [call("element_1"), "element_2"];
      return arr[0];
    }
    `;
    const expectedCode = `
    function call(arg) {
      return arg;
    }

    function startPoint() {
      const arr = [call("{{found}}"), "{{found}}"];
      return arr[0];
    }
    `;

    const ast = parser.parse(code);
    const result: string[] = [];
    searchStringLiterals(findStartPointNode(ast)!, (str) => {
      result.push(str);
      return "{{found}}";
    });

    const expected = ["element_1", "element_2"];

    expect(result).toEqual(expected);
    expect(stripCode(generator(ast, {}, code).code)).toEqual(
      stripCode(expectedCode),
    );
  });

  it("should handle array expressions with function calls with boolean expressions correctly", () => {
    const code = `
    function call(arg) {
      return arg;
    }

    function startPoint() {
      const key = "value";
      const bool = true;
      const arr = [call(bool ? key : "another"), "element_2"];
      return arr[0];
    }
    `;
    const expectedCode = `
    function call(arg) {
      return arg;
    }

    function startPoint() {
      const key = "{{found}}";
      const bool = true;
      const arr = [call(bool ? key : "{{found}}"), "{{found}}"];
      return arr[0];
    }
    `;

    const ast = parser.parse(code);
    const result: string[] = [];
    searchStringLiterals(findStartPointNode(ast)!, (str) => {
      result.push(str);
      return "{{found}}";
    });

    const expected = ["value", "another", "element_2"];

    expect(result).toEqual(expected);
    expect(stripCode(generator(ast, {}, code).code)).toEqual(
      stripCode(expectedCode),
    );
  });

  //? *******************************
  //? Switch
  //? *******************************

  it("should handle switch statements correctly", () => {
    const code = `
    function startPoint() {
      const key = "value";
      let result = "";
      switch (key) {
        case "value":
          const fakeVar = "fake";
          result = "value";
        case "another":
          const fakeVar2 = "fake2";
          return "another";
        default:
          const fakeVar3 = "fake3";
          return "default";
      }
    }
    `;
    const expectedCode = `
    function startPoint() {
      const key = "value";
      let result = "";
      switch (key) {
        case "value":
          const fakeVar = "fake";
          result = "value";
        case "another":
          const fakeVar2 = "fake2";
          return "{{found}}";
        default:
          const fakeVar3 = "fake3";
          return "{{found}}";
      }
    }
    `;

    const ast = parser.parse(code);
    const result: string[] = [];
    searchStringLiterals(findStartPointNode(ast)!, (str) => {
      result.push(str);
      return "{{found}}";
    });

    const expected = ["another", "default"];

    expect(result).toEqual(expected);
    expect(stripCode(generator(ast, {}, code).code)).toEqual(
      stripCode(expectedCode),
    );
  });

  //? *******************************
  //? Loops
  //? *******************************

  it("should handle for statements correctly", () => {
    const code = `
    function startPoint() {
      const arr = ["element_1", "element_2"];
      const fakeArr = ["element_3", "element_4"];
      let result = "result";
      for (let i = 0; i < arr.length; i++) {
        const fakeArr2 = ["element_5", "element_6"];
        result += arr[i];
      }
      return result;
    }
    `;
    const expectedCode = `
    function startPoint() {
      const arr = ["{{found}}", "{{found}}"];
      const fakeArr = ["element_3", "element_4"];
      let result = "{{found}}";
      for (let i = 0; i < arr.length; i++) {
        const fakeArr2 = ["element_5", "element_6"];
        result += arr[i];
      }
      return result;
    }
    `;

    const ast = parser.parse(code);
    const result: string[] = [];
    searchStringLiterals(findStartPointNode(ast)!, (str) => {
      result.push(str);
      return "{{found}}";
    });

    const expected = ["element_1", "element_2", "result"];

    expect(result).toEqual(expected);
    expect(stripCode(generator(ast, {}, code).code)).toEqual(
      stripCode(expectedCode),
    );
  });

  it("should handle foreach statements correctly", () => {
    const code = `
    function startPoint() {
      const arr = ["element_1", "element_2"];
      let result = "result";
      arr.forEach((element) => {
        const fakeVar = "fake";
        result += element;
      });
      return result;
    }
    `;
    const expectedCode = `
    function startPoint() {
      const arr = ["{{found}}", "{{found}}"];
      let result = "{{found}}";
      arr.forEach(element => {
        const fakeVar = "fake";
        result += element;
      });
      return result;
    }
    `;

    const ast = parser.parse(code);
    const result: string[] = [];
    searchStringLiterals(findStartPointNode(ast)!, (str) => {
      result.push(str);
      return "{{found}}";
    });

    const expected = ["element_1", "element_2", "result"];

    expect(result).toEqual(expected);
    expect(stripCode(generator(ast, {}, code).code)).toEqual(
      stripCode(expectedCode),
    );
  });

  it("should handle map statements correctly", () => {
    const code = `
    function startPoint() {
      const arr = ["element_1", "element_2"];
      const result = arr.map((element) => {
        const fakeVar = "fake";
        return element;
      });
      return result;
    }
    `;
    const expectedCode = `
    function startPoint() {
      const arr = ["{{found}}", "{{found}}"];
      const result = arr.map(element => {
        const fakeVar = "fake";
        return element;
      });
      return result;
    }
    `;

    const ast = parser.parse(code);
    const result: string[] = [];
    searchStringLiterals(findStartPointNode(ast)!, (str) => {
      result.push(str);
      return "{{found}}";
    });

    const expected = ["element_1", "element_2"];

    expect(result).toEqual(expected);
    expect(stripCode(generator(ast, {}, code).code)).toEqual(
      stripCode(expectedCode),
    );
  });

  it("should handle while statements correctly", () => {
    const code = `
    function startPoint() {
      const arr = ["element_1", "element_2"];
      const fakeArr = ["element_3", "element_4"];
      let result = "result";
      let i = 0;
      while (i < arr.length) {
        const fakeArr2 = ["element_5", "element_6"];
        result += arr[i];
        i++;
      }
      return result;
    }
    `;
    const expectedCode = `
    function startPoint() {
      const arr = ["{{found}}", "{{found}}"];
      const fakeArr = ["element_3", "element_4"];
      let result = "{{found}}";
      let i = 0;
      while (i < arr.length) {
        const fakeArr2 = ["element_5", "element_6"];
        result += arr[i];
        i++;
      }
      return result;
    }
    `;

    const ast = parser.parse(code);
    const result: string[] = [];
    searchStringLiterals(findStartPointNode(ast)!, (str) => {
      result.push(str);
      return "{{found}}";
    });

    const expected = ["element_1", "element_2", "result"];

    expect(result).toEqual(expected);
    expect(stripCode(generator(ast, {}, code).code)).toEqual(
      stripCode(expectedCode),
    );
  });

  //? *******************************
  //? Try Catch
  //? *******************************

  it("should handle try catch statements correctly", () => {
    const code = `
    function startPoint() {
      const arr = ["element_1", "element_2"];
      const arr2 = ["element_3", "element_4"];
      let result = "result";
      try {
        result = arr[0];
        throw new Error("error");
      } catch (e) {
        result = arr2[0];
        result = e.message;
      }
      return result;
    }
    `;
    const expectedCode = `
    function startPoint() {
      const arr = ["{{found}}", "{{found}}"];
      const arr2 = ["{{found}}", "{{found}}"];
      let result = "{{found}}";
      try {
        result = arr[0];
        throw new Error("error");
      } catch (e) {
        result = arr2[0];
        result = e.message;
      }
      return result;
    }
    `;

    const ast = parser.parse(code);
    const result: string[] = [];
    searchStringLiterals(findStartPointNode(ast)!, (str) => {
      result.push(str);
      return "{{found}}";
    });

    const expected = [
      "element_1",
      "element_2",
      "element_3",
      "element_4",
      "result",
    ];

    expect(result).toEqual(expected);
    expect(stripCode(generator(ast, {}, code).code)).toEqual(
      stripCode(expectedCode),
    );
  });

  //? *******************************
  //? Member Expressions
  //? *******************************

  it("should handle member expressions correctly", () => {
    const code = `
    function startPoint() {
      "className_A".replace("className_A", "className_B");
    }
    `;
    const expectedCode = `
    function startPoint() {
      "{{found}}".replace("{{found}}", "{{found}}");
    }
    `;

    const ast = parser.parse(code);
    const result: string[] = [];
    searchStringLiterals(findStartPointNode(ast)!, (str) => {
      result.push(str);
      return "{{found}}";
    });

    expect(result).toEqual(["className_A", "className_A", "className_B"]);
    expect(stripCode(generator(ast, {}, code).code)).toEqual(
      stripCode(expectedCode),
    );
  });

  //? *******************************
  //? Template Literals & Template Elements
  //? *******************************

  it("should handle template literals correctly", () => {
    const code = `
    function startPoint() {
      const value = "value";
      return \`hello \${value}\`;
    }
    `;
    const expectedCode = `
    function startPoint() {
      const value = "{{found}}";
      return \`{{found}} \${value}\`;
    }
    `;

    const ast = parser.parse(code);
    const result: string[] = [];
    searchStringLiterals(findStartPointNode(ast)!, (str) => {
      result.push(str);
      return "{{found}}";
    });

    expect(result).toEqual([
      "hello " /* Raw */,
      "hello " /* Cooked */,
      "value",
    ]);
    expect(stripCode(generator(ast, {}, code).code)).toEqual(
      stripCode(expectedCode),
    );
  });
});

//! ================================
//! obfuscateJsWithAst
//! ================================

describe("obfuscateJsWithAst", () => {
  //? *******************************
  //? Real World Example
  //? *******************************

  it("should handle basic real world example 1", () => {
    const code = `(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[185],{6773:function(e,t,n){Promise.resolve().then(n.bind(n,1845)),Promise.resolve().then(n.bind(n,7388)),Promise.resolve().then(n.bind(n,6016)),Promise.resolve().then(n.bind(n,1120)),Promise.resolve().then(n.bind(n,1255)),Promise.resolve().then(n.t.bind(n,5935,23)),Promise.resolve().then(n.t.bind(n,3710,23)),Promise.resolve().then(n.t.bind(n,3385,23)),Promise.resolve().then(n.bind(n,6212)),Promise.resolve().then(n.bind(n,1267)),Promise.resolve().then(n.bind(n,5322)),Promise.resolve().then(n.bind(n,9149))},6212:function(e,t,n){"use strict";n.r(t),n.d(t,{default:function(){return d}});var r=n(3827),i=n(703),l=n(8792),a={src:"/_next/static/media/some.svg",height:42,width:42,blurWidth:0,blurHeight:0},s=n(4090),o=n(7907);function d(){(0,o.usePathname)();let[e,t]=(0,s.useState)(!1),n=(0,s.useCallback)((e,t)=>{if(e.id===t)return!0;for(let r=0;r<e.children.length;r++)if(n(e.children[r],t))return!0;return!1},[]);return(0,s.useEffect)(()=>{t(n(document.body,"NotFoundPage"))},[n]),e?null:(0,r.jsx)(r.Fragment,{children:(0,r.jsx)("header",{className:"h-[4.4dvw] size-full bg-transparent px-[1.41dvw] flex items-center",children:(0,r.jsx)(l.default,{href:"/",className:"flex items-center flex-shrink-0",children:(0,r.jsx)(i.default,{className:"w-auto h-[1.88dvw]",src:a,alt:"Logo"})})})})}},1267:function(e,t,n){"use strict";n.r(t),n.d(t,{default:function(){return o}});var r=n(3827),i=n(8792),l=n(7907),a=n(4090),s=n(6314);function o(){let e=(0,l.usePathname)(),[t,n]=(0,a.useState)(!1),o=(0,a.useCallback)((e,t)=>{if(e.id===t)return!0;for(let n=0;n<e.children.length;n++)if(o(e.children[n],t))return!0;return!1},[]);(0,a.useEffect)(()=>{n(o(document.body,"NotFoundPage"))},[o]);let d=[{href:"/",label:"Home"},{href:"/tag1",label:"tag1"},{href:"/tag2",label:"tag2"},{href:"/tag3",label:"tag3"},{href:"/tag4",label:"tag4"},],[u,c]=(0,a.useState)(()=>{let t=d.find(t=>t.href===e);return t?t.label:"label"}),[h,f]=(0,a.useState)(()=>{if(e.startsWith("/tag1"))return"tag1";{let t=d.find(t=>t.href===e);return t?t.label:"label"}});return(0,a.useEffect)(()=>{e.startsWith("/tag1")&&f("tag1")},[e]),(0,a.useEffect)(()=>{e.startsWith("/tag1/")&&(f("tag1"),c("tag1"))},[e]),t?null:(0,r.jsx)(r.Fragment,{children:(0,r.jsx)("div",{className:"z-0 w-[11dvw] h-dvh [&_.side-box]:absolute [&_.side-box]:left-[0.94dvw] [&_.side-box]:top-0 [&_.side-box]:-z-10 [&_.side-box]:h-full [&_.side-box]:w-[calc(100%-0.94dvw)] [&_.side-box]:rounded-tl-[0.94dvw] [&_.side-box]:rounded-bl-[0.94dvw] [&_.side-box]:bg-gradient-to-r [&_.side-box]:from-[#2858ff] [&_.side-box]:to-85%",children:(0,r.jsx)("div",{className:"   flex flex-col items-start size-full   *:relative *:w-full *:font-bold   [&_a]:flex [&_a]:items-center [&_a]:w-full [&_a]:pe-[2.82dvw] [&_a]:h-[2.82dvw] [&_a]:transition-[padding_color] [&_a]:ease-bounce [&_a]:duration-300   [&_#side-box-line]:absolute [&_#side-box-line]:left-0 [&_#side-box-line]:top-0 [&_#side-box-line]:-z-10 [&_#side-box-line]:h-full [&_#side-box-line]:w-[0.235dvw] [&_#side-box-line]:transition-opacity [&_#side-box-line]:duration-0 [&_#side-box-line]:rounded-tr-full [&_#side-box-line]:rounded-br-full [&_#side-box-line]:bg-[#2858ff]   ",children:d.map(t=>(0,r.jsx)(s.E.div,{onHoverStart:()=>c(t.label),onHoverEnd:()=>c(h),onClick:()=>f(t.label),children:(0,r.jsxs)(i.default,{href:t.href,className:t.href===e||e.startsWith("/tag1")&&"/tag1"===t.href?"text-white ps-[2.115dvw]":"text-white/50 ps-[1.41dvw]",children:[t.href===e||e.startsWith("/tag1/")&&"/tag1"===t.href?(0,r.jsx)(s.E.div,{transition:{type:"spring",duration:.65,mass:.5},layoutId:"sideBox",className:"side-box"}):null,t.label,t.label===u||e.startsWith("/tag1/")&&"/tag1/"===t.href?(0,r.jsx)(s.E.div,{transition:{type:"spring",duration:.8},layoutId:"sideBoxLine",id:"side-box-line"}):null,]})},t.href))})})})}},9149:function(e,t,n){"use strict";n.r(t);var r=n(4404),i=n(4090),l=n(7717);let a=e=>{let{color:t,height:n,crawl:r,crawlSpeed:a,initialPosition:s,easing:o,speed:d,shadow:u,template:c,zIndex:h=99999999,delay:f}=e,$=null!=t?t:"#29d";return(u||void 0===u)&&(u||"box-shadow:0 0 10px ".concat($,",0 0 5px ").concat($)),i.useEffect(()=>{let e;function t(){clearTimeout(e),e=setTimeout(l.start,null!=f?f:200)}function n(){clearTimeout(e),l.done()}l.configure({trickle:null==r||r,trickleSpeed:null!=a?a:200,minimum:null!=s?s:.55+.2*Math.random(),easing:null!=o?o:"ease-out",speed:null!=d?d:180,template:null!=c?c:'<div class="bar" role="bar"><div class="peg"></div></div>'});var i=document.querySelectorAll("html");function u(e){try{let r=e.target,l=function(e){for(;e&&"a"!==e.tagName.toLowerCase();)e=e.parentElement;return e}(r),a=null==l?void 0:l.href;if(a){var s;let o=window.location.href,d="_blank"===l.target,u=a.startsWith("blob:"),c=function(e,t){let n=new URL(e),r=new URL(t);if(n.hostname===r.hostname&&n.pathname===r.pathname&&n.search===r.search){let i=n.hash,l=r.hash;return i!==l&&n.href.replace(i,"")===r.href.replace(l,"")}return!1}(o,a),h;a===o||c||d||u||e.ctrlKey?(t(),n(),[].forEach.call(i,function(e){e.classList.remove("nprogress-busy")})):(t(),h=(s=window.history).pushState,s.pushState=function(){return n(),[].forEach.call(i,function(e){e.classList.remove("nprogress-busy")}),h.apply(s,arguments)})}}catch(f){t(),n()}}return document.addEventListener("click",u),()=>{document.removeEventListener("click",u)}},[r,a,f,o,s,d,c]),null};t.default=a,a.propTypes={color:r.string,height:r.number,crawl:r.bool,crawlSpeed:r.number,initialPosition:r.number,easing:r.string,speed:r.number,delay:r.number,template:r.string,shadow:r.oneOfType([r.string,r.bool]),zIndex:r.number}},5322:function(e,t,n){"use strict";n.r(t);var r=n(3827),i=n(4090);t.default=()=>{let e=(0,i.useRef)(null);return(0,i.useEffect)(()=>{let t=e.current,n=null==t?void 0:t.getContext("2d"),r={x:.5*window.innerWidth,y:.5*window.innerHeight},i={pointsNumber:8,widthFactor:4,spring:.35,friction:.48},l=Array(i.pointsNumber);for(let a=0;a<i.pointsNumber;a++)l[a]={x:r.x,y:r.y,dx:0,dy:0};let s=(e,t)=>{r.x=e,r.y=t},o=()=>{e.current&&(e.current.width=window.innerWidth,e.current.height=window.innerHeight)},d=e=>{if(n&&(n.strokeStyle="#e2ecfc"),t&&(null==n||n.clearRect(0,0,t.width,t.height)),l.forEach((e,t)=>{let n=0===t?r:l[t-1],a=0===t?.4*i.spring:i.spring;e.dx+=(n.x-e.x)*a,e.dy+=(n.y-e.y)*a,e.dx*=i.friction,e.dy*=i.friction,e.x+=e.dx,e.y+=e.dy}),n){n.lineCap="round",n.beginPath(),n.moveTo(l[0].x,l[0].y);for(let a=1;a<l.length-1;a++){let s=.5*(l[a].x+l[a+1].x),o=.5*(l[a].y+l[a+1].y);n.quadraticCurveTo(l[a].x,l[a].y,s,o),n.lineWidth=i.widthFactor*(i.pointsNumber-a),n.stroke()}n.lineTo(l[l.length-1].x,l[l.length-1].y),n.stroke()}window.requestAnimationFrame(d)},u=()=>{o()},c=e=>{s(e.pageX,e.pageY)},h=e=>{s(e.pageX,e.pageY)},f=e=>{s(e.targetTouches[0].pageX,e.targetTouches[0].pageY)};return window.addEventListener("click",c),window.addEventListener("mousemove",h),window.addEventListener("touchmove",f),window.addEventListener("resize",u),o(),d(0),()=>{window.removeEventListener("click",c),window.removeEventListener("mousemove",h),window.removeEventListener("touchmove",f),window.removeEventListener("resize",u)}},[]),(0,r.jsx)("canvas",{ref:e})}},3385:function(){}},function(e){e.O(0,[314,250,134,336,971,69,744],function(){return e(e.s=6773)}),_N_E=e.O()},]);`;
    const expectedCode = `(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[185],{6773:function(e,t,n){Promise.resolve().then(n.bind(n,1845)),Promise.resolve().then(n.bind(n,7388)),Promise.resolve().then(n.bind(n,6016)),Promise.resolve().then(n.bind(n,1120)),Promise.resolve().then(n.bind(n,1255)),Promise.resolve().then(n.t.bind(n,5935,23)),Promise.resolve().then(n.t.bind(n,3710,23)),Promise.resolve().then(n.t.bind(n,3385,23)),Promise.resolve().then(n.bind(n,6212)),Promise.resolve().then(n.bind(n,1267)),Promise.resolve().then(n.bind(n,5322)),Promise.resolve().then(n.bind(n,9149))},6212:function(e,t,n){\"usestrict\";n.r(t),n.d(t,{default:function(){returnd}});varr=n(3827),i=n(703),l=n(8792),a={src:\"/_next/static/media/some.svg\",height:42,width:42,blurWidth:0,blurHeight:0},s=n(4090),o=n(7907);functiond(){(0,o.usePathname)();let[e,t]=(0,s.useState)(!1),n=(0,s.useCallback)((e,t)=>{if(e.id===t)return!0;for(letr=0;r<e.children.length;r++)if(n(e.children[r],t))return!0;return!1},[]);return(0,s.useEffect)(()=>{t(n(document.body,\"NotFoundPage\"))},[n]),e?null:(0,r.jsx)(r.Fragment,{children:(0,r.jsx)(\"header\",{className:\"{{obfuscated}}\",children:(0,r.jsx)(l.default,{href:\"/\",className:\"{{obfuscated}}\",children:(0,r.jsx)(i.default,{className:\"{{obfuscated}}\",src:a,alt:\"Logo\"})})})})}},1267:function(e,t,n){\"usestrict\";n.r(t),n.d(t,{default:function(){returno}});varr=n(3827),i=n(8792),l=n(7907),a=n(4090),s=n(6314);functiono(){lete=(0,l.usePathname)(),[t,n]=(0,a.useState)(!1),o=(0,a.useCallback)((e,t)=>{if(e.id===t)return!0;for(letn=0;n<e.children.length;n++)if(o(e.children[n],t))return!0;return!1},[]);(0,a.useEffect)(()=>{n(o(document.body,\"NotFoundPage\"))},[o]);letd=[{href:\"/\",label:\"Home\"},{href:\"/tag1\",label:\"tag1\"},{href:\"/tag2\",label:\"tag2\"},{href:\"/tag3\",label:\"tag3\"},{href:\"/tag4\",label:\"tag4\"}],[u,c]=(0,a.useState)(()=>{lett=d.find(t=>t.href===e);returnt?t.label:\"label\"}),[h,f]=(0,a.useState)(()=>{if(e.startsWith(\"/tag1\"))return\"tag1\";{lett=d.find(t=>t.href===e);returnt?t.label:\"label\"}});return(0,a.useEffect)(()=>{e.startsWith(\"/tag1\")&&f(\"tag1\")},[e]),(0,a.useEffect)(()=>{e.startsWith(\"/tag1/\")&&(f(\"tag1\"),c(\"tag1\"))},[e]),t?null:(0,r.jsx)(r.Fragment,{children:(0,r.jsx)(\"div\",{className:\"{{obfuscated}}\",children:(0,r.jsx)(\"div\",{className:\"{{obfuscated}}\",children:d.map(t=>(0,r.jsx)(s.E.div,{onHoverStart:()=>c(t.label),onHoverEnd:()=>c(h),onClick:()=>f(t.label),children:(0,r.jsxs)(i.default,{href:t.href,className:t.href===e||e.startsWith(\"/tag1\")&&\"/tag1\"===t.href?\"{{obfuscated}}\":\"{{obfuscated}}\",children:[t.href===e||e.startsWith(\"/tag1/\")&&\"/tag1\"===t.href?(0,r.jsx)(s.E.div,{transition:{type:\"spring\",duration:.65,mass:.5},layoutId:\"sideBox\",className:\"{{obfuscated}}\"}):null,t.label,t.label===u||e.startsWith(\"/tag1/\")&&\"/tag1/\"===t.href?(0,r.jsx)(s.E.div,{transition:{type:\"spring\",duration:.8},layoutId:\"sideBoxLine\",id:\"side-box-line\"}):null]})},t.href))})})})}},9149:function(e,t,n){\"usestrict\";n.r(t);varr=n(4404),i=n(4090),l=n(7717);leta=e=>{let{color:t,height:n,crawl:r,crawlSpeed:a,initialPosition:s,easing:o,speed:d,shadow:u,template:c,zIndex:h=99999999,delay:f}=e,$=null!=t?t:\"#29d\";return(u||void0===u)&&(u||\"box-shadow:0010px\".concat($,\",005px\").concat($)),i.useEffect(()=>{lete;functiont(){clearTimeout(e),e=setTimeout(l.start,null!=f?f:200)}functionn(){clearTimeout(e),l.done()}l.configure({trickle:null==r||r,trickleSpeed:null!=a?a:200,minimum:null!=s?s:.55+.2*Math.random(),easing:null!=o?o:\"ease-out\",speed:null!=d?d:180,template:null!=c?c:\"<divclass=\\\"bar\\\"role=\\\"bar\\\"><divclass=\\\"peg\\\"></div></div>\"});vari=document.querySelectorAll(\"html\");functionu(e){try{letr=e.target,l=function(e){for(;e&&\"a\"!==e.tagName.toLowerCase();)e=e.parentElement;returne}(r),a=null==l?void0:l.href;if(a){vars;leto=window.location.href,d=\"_blank\"===l.target,u=a.startsWith(\"blob:\"),c=function(e,t){letn=newURL(e),r=newURL(t);if(n.hostname===r.hostname&&n.pathname===r.pathname&&n.search===r.search){leti=n.hash,l=r.hash;returni!==l&&n.href.replace(i,\"\")===r.href.replace(l,\"\")}return!1}(o,a),h;a===o||c||d||u||e.ctrlKey?(t(),n(),[].forEach.call(i,function(e){e.classList.remove(\"nprogress-busy\")})):(t(),h=(s=window.history).pushState,s.pushState=function(){returnn(),[].forEach.call(i,function(e){e.classList.remove(\"nprogress-busy\")}),h.apply(s,arguments)})}}catch(f){t(),n()}}returndocument.addEventListener(\"click\",u),()=>{document.removeEventListener(\"click\",u)}},[r,a,f,o,s,d,c]),null};t.default=a,a.propTypes={color:r.string,height:r.number,crawl:r.bool,crawlSpeed:r.number,initialPosition:r.number,easing:r.string,speed:r.number,delay:r.number,template:r.string,shadow:r.oneOfType([r.string,r.bool]),zIndex:r.number}},5322:function(e,t,n){\"usestrict\";n.r(t);varr=n(3827),i=n(4090);t.default=()=>{lete=(0,i.useRef)(null);return(0,i.useEffect)(()=>{lett=e.current,n=null==t?void0:t.getContext(\"2d\"),r={x:.5*window.innerWidth,y:.5*window.innerHeight},i={pointsNumber:8,widthFactor:4,spring:.35,friction:.48},l=Array(i.pointsNumber);for(leta=0;a<i.pointsNumber;a++)l[a]={x:r.x,y:r.y,dx:0,dy:0};lets=(e,t)=>{r.x=e,r.y=t},o=()=>{e.current&&(e.current.width=window.innerWidth,e.current.height=window.innerHeight)},d=e=>{if(n&&(n.strokeStyle=\"#e2ecfc\"),t&&(null==n||n.clearRect(0,0,t.width,t.height)),l.forEach((e,t)=>{letn=0===t?r:l[t-1],a=0===t?.4*i.spring:i.spring;e.dx+=(n.x-e.x)*a,e.dy+=(n.y-e.y)*a,e.dx*=i.friction,e.dy*=i.friction,e.x+=e.dx,e.y+=e.dy}),n){n.lineCap=\"round\",n.beginPath(),n.moveTo(l[0].x,l[0].y);for(leta=1;a<l.length-1;a++){lets=.5*(l[a].x+l[a+1].x),o=.5*(l[a].y+l[a+1].y);n.quadraticCurveTo(l[a].x,l[a].y,s,o),n.lineWidth=i.widthFactor*(i.pointsNumber-a),n.stroke()}n.lineTo(l[l.length-1].x,l[l.length-1].y),n.stroke()}window.requestAnimationFrame(d)},u=()=>{o()},c=e=>{s(e.pageX,e.pageY)},h=e=>{s(e.pageX,e.pageY)},f=e=>{s(e.targetTouches[0].pageX,e.targetTouches[0].pageY)};returnwindow.addEventListener(\"click\",c),window.addEventListener(\"mousemove\",h),window.addEventListener(\"touchmove\",f),window.addEventListener(\"resize\",u),o(),d(0),()=>{window.removeEventListener(\"click\",c),window.removeEventListener(\"mousemove\",h),window.removeEventListener(\"touchmove\",f),window.removeEventListener(\"resize\",u)}},[]),(0,r.jsx)(\"canvas\",{ref:e})}},3385:function(){}},function(e){e.O(0,[314,250,134,336,971,69,744],function(){returne(e.s=6773)}),_N_E=e.O()}]);`;
    const { obfuscatedCode } = obfuscateJsWithAst(code, undefined);

    expect(stripCode(obfuscatedCode)).toEqual(stripCode(expectedCode));
  });
});
