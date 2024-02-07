import {
  log,
  findContentBetweenMarker,
  replaceFirstMatch,
  normalizePath,
  obfuscateKeys,
  addKeysToRegistery,
  findClosestSymbolPosition
} from "../utils";

import { SelectorConversion } from "../types";
import { obfuscateJsWithAst } from "./js-ast";


function searchForwardComponent(content: string) {
  const componentSearchRegex = /(?<=\.jsx\()[^,|"|']+/g;
  //eg. o.jsx(yt,{data:yc,index:"date
  //    then return yt
  //eg. o.jsx("h1",{data:yc,index:"date
  //    then nothing should be returned

  const match = content.match(componentSearchRegex);
  if (match) {
    return match;
  }
  return [];
}

function searchComponent(content: string, componentName: string) {
  const componentSearchRegex = new RegExp(`\\b(?:const|let|var)\\s+(${componentName})\\s*=\\s*.*?(\\{)`, "g");
  // eg, let yt=l().forwardRef((e,t)=>{let
  const match = content.match(componentSearchRegex);
  let openSymbolPos = -1;
  if (match) {
    openSymbolPos = content.indexOf(match[0]) + match[0].length;
  }

  const closeMarkerPos = findClosestSymbolPosition(content, "{", "}", openSymbolPos, "forward");
  const componentContent = content.slice(openSymbolPos, closeMarkerPos);

  return componentContent;
}

function obfuscateForwardComponentJs(searchContent: string, wholeContent: string, selectorConversion: SelectorConversion) {
  const componentNames = searchForwardComponent(searchContent).filter((componentName) => {
    return !componentName.includes(".");
  });

  const componentsCode = componentNames.map(componentName => {
    const componentContent = searchComponent(wholeContent, componentName);
    return {
      name: componentName,
      code: componentContent
    }
  });
  const componentsObfuscatedCode = componentsCode.map((componentContent) => {
    const classNameBlocks = findContentBetweenMarker(componentContent.code, "className:", "{", "}");
    const obfuscatedClassNameBlocks = classNameBlocks.map(block => {
      const { obfuscatedContent, usedKeys } = obfuscateKeys(selectorConversion, block);
      addKeysToRegistery(usedKeys);
      return obfuscatedContent;
    });

    if (classNameBlocks.length !== obfuscatedClassNameBlocks.length) {
      log("error", `Component obfuscation:`, `classNameBlocks.length !== obfuscatedClassNameBlocks.length`);
      return componentContent;
    }
    let obscuredCode = componentContent.code;
    for (let i = 0; i < classNameBlocks.length; i++) {
      obscuredCode = replaceFirstMatch(obscuredCode, classNameBlocks[i], obfuscatedClassNameBlocks[i]);
    }
    log("debug", `Obscured keys in component:`, componentContent.name);
    return {
      name: componentContent.name,
      code: obscuredCode
    }
  });

  const componentObfuscatedcomponentCodePairs: { name: string, componentCode: string, componentObfuscatedCode: string }[] = [];
  for (let i = 0; i < componentsCode.length; i++) {
    if (componentsCode[i] !== componentsObfuscatedCode[i]) {
      componentObfuscatedcomponentCodePairs.push({
        name: componentsCode[i].name,
        componentCode: componentsCode[i].code,
        componentObfuscatedCode: componentsObfuscatedCode[i].code
      });
    }
  }

  for (let i = 0; i < componentsCode.length; i++) {
    const childComponentObfuscatedcomponentCodePairs = obfuscateForwardComponentJs(componentsCode[i].code, wholeContent, selectorConversion);
    componentObfuscatedcomponentCodePairs.push(...childComponentObfuscatedcomponentCodePairs);
  }

  return componentObfuscatedcomponentCodePairs;
}

function obfuscateJs(content: string, key: string, selectorCoversion: SelectorConversion
  , filePath: string, contentIgnoreRegexes: RegExp[] = [], useAst: boolean = false) {

  if (useAst) {
    try {
      const { obfuscatedCode, usedKeys } = obfuscateJsWithAst(content, selectorCoversion, key ? [key] : [], true);
      addKeysToRegistery(usedKeys);
      if (content !== obfuscatedCode) {
        log("debug", `Obscured keys with AST and marker "${key}":`, `${normalizePath(filePath)}`);
      }
      return obfuscatedCode;
    } catch (error) {
      if (error instanceof SyntaxError) {
        log("warn", "Syntax error ignored:", error);
        log("warn", "Obfuscation with AST failed:", "Falling back to regex obfuscation");
      } else {
        throw error; // re-throw non-syntax errors
      }
    }
  }

  const truncatedContents = findContentBetweenMarker(content, key, "{", "}");
  truncatedContents.forEach((truncatedContent) => {
    const { obfuscatedContent, usedKeys } = obfuscateKeys(selectorCoversion, truncatedContent, contentIgnoreRegexes);
    addKeysToRegistery(usedKeys);
    if (truncatedContent !== obfuscatedContent) {
      content = content.replace(truncatedContent, obfuscatedContent);
      log("debug", `Obscured keys with marker "${key}":`, `${normalizePath(filePath)}`);
    }
  });
  return content;
}

export {
  obfuscateForwardComponentJs,
  obfuscateJs,
  searchForwardComponent,
}