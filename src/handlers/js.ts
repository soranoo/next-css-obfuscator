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

function obfuscateJs(content: string, key: string, classCoversion: SelectorConversion
    , filePath: string, contentIgnoreRegexes: RegExp[] = [], enableForwardComponentObfuscation = false) {
    const truncatedContents = findContentBetweenMarker(content, key, "{", "}");
    truncatedContents.forEach((truncatedContent) => {

        if (enableForwardComponentObfuscation) {
            //! this is a experimental feature, it may not work properly
            const componentObfuscatedcomponentCodePairs = obfuscateForwardComponentJs(truncatedContent, content, classCoversion);
            componentObfuscatedcomponentCodePairs.map((pair) => {
                const { componentCode, componentObfuscatedCode } = pair;
                if (componentCode !== componentObfuscatedCode) {
                    content = replaceFirstMatch(content, componentCode, componentObfuscatedCode);
                    log("debug", `Obscured keys in component:`, `${normalizePath(filePath)}`);
                }
            });
        }

        const { obfuscatedContent, usedKeys } = obfuscateKeys(classCoversion, truncatedContent, contentIgnoreRegexes);
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