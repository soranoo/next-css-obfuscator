import fs from "fs";
import path from "path";
// @ts-ignore
import css from 'css';
import { LogLevel, obfuscateMode, ClassConversion } from "./type";

//! ====================
//! Log
//! ====================

const issuer = "[next-css-obfuscator]";
let logLevel: LogLevel = "info";
const levels: LogLevel[] = ["debug", "info", "warn", "error", "success"];

function log(type: LogLevel, task: string, data: any) {
  //ref: https://github.com/n4j1Br4ch1D/postcss-obfuscator/blob/main/utils.js
  if (levels.indexOf(type) < levels.indexOf(logLevel)) {
    return;
  }

  const mainColor = "\x1b[38;2;99;102;241m%s\x1b[0m";

  switch (type) {
    case "debug":
      console.debug(mainColor, issuer, "[Debug] \x1b[37m", task, data, "\x1b[0m");
      break;
    case "info":
      console.info(mainColor, issuer, "🗯️ \x1b[36m", task, data, "\x1b[0m");
      break;
    case "warn":
      console.warn(mainColor, issuer, "⚠️ \x1b[33m", task, data, "\x1b[0m");
      break;
    case "error":
      console.error(mainColor, issuer, "⛔ \x1b[31m", task, data, "\x1b[0m");
      break;
    case "success":
      console.log(mainColor, issuer, "✅ \x1b[32m", task, data, "\x1b[0m");
      break;
    default:
      console.log("'\x1b[0m'", issuer, task, data, "\x1b[0m");
      break;
  }
}

function setLogLevel(level: LogLevel) {
  logLevel = level;
}

//! ====================
//! 
//! ====================


const usedKeyRegistery = new Set<string>();


function replaceJsonKeysInFiles(
  {
    targetFolder,
    allowExtensions,
    classConversionJsonFolderPath,

    contentIgnoreRegexes,

    whiteListedFolderPaths,
    blackListedFolderPaths,
    includeAnyMatchRegexes,
    excludeAnyMatchRegexes,
    enableObfuscateMarkerClasses,
    obfuscateMarkerClasses,
    removeObfuscateMarkerClassesAfterObfuscated,
  }: {
    targetFolder: string,
    allowExtensions: string[],
    classConversionJsonFolderPath: string,

    contentIgnoreRegexes: RegExp[],

    whiteListedFolderPaths: string[],
    blackListedFolderPaths: string[],
    includeAnyMatchRegexes: RegExp[],
    excludeAnyMatchRegexes: RegExp[],
    enableObfuscateMarkerClasses: boolean,
    obfuscateMarkerClasses: string[],
    removeObfuscateMarkerClassesAfterObfuscated: boolean,
  }) {
  //ref: https://github.com/n4j1Br4ch1D/postcss-obfuscator/blob/main/utils.js

  const classConversion: ClassConversion = loadAndMergeJsonFiles(classConversionJsonFolderPath);

  if (removeObfuscateMarkerClassesAfterObfuscated) {
    obfuscateMarkerClasses.forEach(obfuscateMarkerClass => {
      classConversion[`.${obfuscateMarkerClass}`] = "";
    });
  }

  const cssPaths: string[] = [];

  // Read and process the files
  const replaceJsonKeysInFile = (filePath: string) => {
    const fileExt = path.extname(filePath).toLowerCase();
    if (fs.statSync(filePath).isDirectory()) {
      // Recursively process all files in subdirectories
      fs.readdirSync(filePath).forEach((subFilePath) => {
        replaceJsonKeysInFile(path.join(filePath, subFilePath));
      });
    } else if (
      allowExtensions.includes(fileExt)
    ) {

      let isTargetFile = true;
      if (whiteListedFolderPaths.length > 0) {
        isTargetFile = whiteListedFolderPaths.some((incloudPath) => {
          return normalizePath(filePath).includes(normalizePath(incloudPath));
        });
      }
      if (blackListedFolderPaths.length > 0) {
        const res = !blackListedFolderPaths.some((incloudPath) => {
          return normalizePath(filePath).includes(normalizePath(incloudPath));
        });
        if (!res) {
          isTargetFile = false;
        }
      }
      if (includeAnyMatchRegexes.length > 0) {
        isTargetFile = includeAnyMatchRegexes.some((regex) => {
          return normalizePath(filePath).match(regex);
        });
      }
      if (excludeAnyMatchRegexes.length > 0) {
        const res = !excludeAnyMatchRegexes.some((regex) => {
          return normalizePath(filePath).match(regex);
        });
        if (!res) {
          isTargetFile = false;
        }
      }
      if (!isTargetFile) {
        return;
      }

      // Replace JSON keys in the file
      let fileContent = fs.readFileSync(filePath, "utf-8");
      const fileContentOriginal = fileContent;

      if (enableObfuscateMarkerClasses) {
        obfuscateMarkerClasses.forEach(obfuscateMarkerClass => {
          const isHtml = [".html"].includes(fileExt);
          if (isHtml) {
            // filter all html
            // ref: https://stackoverflow.com/a/56102604
            const htmlRegex = new RegExp(`(<(.*)>(.*)<\/([^br][A-Za-z0-9]+)>)`, 'g');
            const htmlMatch = fileContent.match(htmlRegex);
            if (htmlMatch) {
              let html = htmlMatch[0];
              const htmlOriginal = html;
              const tagContents = findHtmlTagContentsByClass(html, obfuscateMarkerClass);
              tagContents.forEach(tagContent => {
                const { obfuscatedContent, usedKeys } = obfuscateKeys(classConversion, tagContent, contentIgnoreRegexes);
                addKeysToRegistery(usedKeys);
                if (tagContent !== obfuscatedContent) {
                  html = html.replace(tagContent, obfuscatedContent);
                  log("debug", `Obscured keys under HTML tag in file:`, normalizePath(filePath));
                }
              });

              const scriptTagContents = findHtmlTagContents(html, "script");
              scriptTagContents.forEach(scriptTagContent => {
                const obfuscateScriptContent = obfuscateJs(scriptTagContent, obfuscateMarkerClass, classConversion, filePath, contentIgnoreRegexes, true);
                if (scriptTagContent !== obfuscateScriptContent) {
                  html = html.replace(scriptTagContent, obfuscateScriptContent);
                  log("debug", `Obscured keys under HTML script tag in file:`, normalizePath(filePath));
                }
              });

              if (htmlOriginal !== html) {
                fileContent = fileContent.replace(htmlOriginal, html);
              }
            }
          } else {
            const obfuscateScriptContent = obfuscateJs(fileContent, obfuscateMarkerClass, classConversion, filePath, contentIgnoreRegexes, true);
            if (fileContent !== obfuscateScriptContent) {
              fileContent = obfuscateScriptContent;
              log("debug", `Obscured keys in JS like content file:`, normalizePath(filePath));
            }
          }

        });
      } else {
        if ([".js"].includes(fileExt)) {
          const obfuscateScriptContent = obfuscateJs(fileContent, "jsx", classConversion, filePath, contentIgnoreRegexes);
          if (fileContent !== obfuscateScriptContent) {
            fileContent = obfuscateScriptContent;
            log("debug", `Obscured keys in JSX related file:`, normalizePath(filePath));
          }
        } else {
          const { obfuscatedContent, usedKeys } = obfuscateKeys(classConversion, fileContent, contentIgnoreRegexes);
          fileContent = obfuscatedContent;
          addKeysToRegistery(usedKeys);
        }
      }

      if (fileContentOriginal !== fileContent) {
        log("success", "Data obfuscated:", normalizePath(filePath));
        fs.writeFileSync(filePath, fileContent);
      }

    } else if (fileExt === ".css") {
      cssPaths.push(filePath);
    }
  }

  // Process all files in the directory excluding .css files
  replaceJsonKeysInFile(targetFolder);

  // Obfuscate CSS files
  cssPaths.forEach((cssPath) => {
    obfuscateCss(classConversion, cssPath);
  });

}

function obfuscateKeys(jsonData: ClassConversion, fileContent: string, contentIgnoreRegexes: RegExp[] = []) {
  //ref: https://github.com/n4j1Br4ch1D/postcss-obfuscator/blob/main/utils.js

  const usedKeys = new Set<string>();
  Object.keys(jsonData).forEach((key) => {
    const fileContentOriginal = fileContent;
    let keyUse = escapeRegExp(key.slice(1).replace(/\\/g, ""));
    //? sample: "text-sm w-full\n      text-right\n p-2 flex gap-2 hover:bg-gray-100 dark:hover:bg-red-700 text-right"
    let exactMatchRegex = new RegExp(`([\\s"'\\\`]|^)(${keyUse})(?=$|[\\s"'\\\`]|\\\\n)`, 'g'); // match exact wording & avoid ` ' ""
    // exactMatchRegex = new RegExp(`([\\s"'\\\`]|^)(${keyUse})(?=$|[\\s"'\\\`])`, 'g'); // match exact wording & avoid ` ' ""

    const replacement = `$1` + jsonData[key].slice(1).replace(/\\/g, "");

    const matches = fileContent.match(exactMatchRegex);
    const originalObscuredContentPairs = matches?.map((match) => {
      return { originalContent: match, obscuredContent: match.replace(exactMatchRegex, replacement) };
    });
    fileContent = fileContent.replace(exactMatchRegex, replacement); // capture preceding space

    if (contentIgnoreRegexes.length > 0) {
      contentIgnoreRegexes.forEach((regex) => {
        const originalContentFragments = fileContentOriginal.match(regex);

        originalContentFragments?.map((originalContentFragment) => {
          originalObscuredContentPairs?.map((pair) => {
            if (originalContentFragments?.some((fragment) => fragment.includes(pair.originalContent))) {
              log("debug", "Obscured keys:", `Ignored ${pair.originalContent} at ${originalContentFragment}`);
              fileContent = fileContent.replace(originalContentFragment.replace(pair.originalContent, pair.obscuredContent), originalContentFragment);
            }
          });
        });
      });
    }


    if (fileContentOriginal !== fileContent && !usedKeys.has(key)) {
      usedKeys.add(key);
    }
  });
  return { obfuscatedContent: fileContent, usedKeys: usedKeys };
}

function escapeRegExp(str: string) {
  //ref: https://github.com/n4j1Br4ch1D/postcss-obfuscator/blob/main/utils.js
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

/**
 * Get the filename from a file path
 * @param filePath - The path to the file
 * @returns The filename of the file
 */
function getFilenameFromPath(filePath: string) {
  //ref: https://github.com/n4j1Br4ch1D/postcss-obfuscator/blob/main/utils.js
  return filePath.replace(/^.*[\\/]/, '');
}

/**
 * Normalizes a file path by replacing backslashes with forward slashes.
 * 
 * @param filePath - The file path to normalize.
 * @returns The normalized file path.
 * 
 * @example
 * // Returns: 'c:/Users/next-css-obfuscator/src/utils.ts'
 * normalizePath('c:\\Users\\next-css-obfuscator\\src\\utils.ts');
 * 
 * @example
 * // Returns: 'path/to/file'
 * normalizePath('path\\to\\file');
 */
function normalizePath(filePath: string) {
  return filePath.replace(/\\/g, "/");
}


function loadAndMergeJsonFiles(jsonFolderPath: string) {
  //ref: https://github.com/n4j1Br4ch1D/postcss-obfuscator/blob/main/utils.js
  const jsonFiles: { [key: string]: any } = {};

  fs.readdirSync(jsonFolderPath).forEach((file: string) => {
    const filePath = path.join(jsonFolderPath, file);
    const fileData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    Object.assign(jsonFiles, fileData);
  });

  return jsonFiles;
}

function findHtmlTagContentsRecursive(content: string, targetTag: string, targetClass: string | null = null, foundTagContents: string[] = [], deep: number = 0, maxDeep: number = -1) {
  let contentAfterTag = content;
  const startTagWithClassRegexStr = targetClass ?
    // ref: https://stackoverflow.com/a/16559544
    `(<\\w+?\\s+?class\\s*=\\s*['\"][^'\"]*?\\b${targetClass}\\b)`
    : "";
  const startTagRegexStr = `(<${targetTag}[\\s|>])`;
  const endTagRegexStr = `(<\/${targetTag}>)`;

  // clear content before the start tag
  const clearContentBeforeStartTagRegex = new RegExp(`${startTagWithClassRegexStr ? startTagWithClassRegexStr + ".*|" + startTagRegexStr : startTagRegexStr + ".*"}`, "i");
  const contentAfterStartTagMatch = contentAfterTag.match(clearContentBeforeStartTagRegex);
  if (contentAfterStartTagMatch) {
    contentAfterTag = contentAfterStartTagMatch[0];
  }

  let endTagCont = 0;

  const endTagContRegex = new RegExp(endTagRegexStr, "gi");
  const endTagContMatch = contentAfterTag.match(endTagContRegex);
  if (endTagContMatch) {
    endTagCont = endTagContMatch.length;
  }

  let closeTagPoition = 0;

  const tagPatternRegex = new RegExp(`${startTagWithClassRegexStr ? startTagWithClassRegexStr + "|" + startTagRegexStr : startTagRegexStr}|${endTagRegexStr}`, "gi");
  const tagPatternMatch = contentAfterTag.match(tagPatternRegex);
  if (tagPatternMatch) {
    let tagCount = 0;
    let markedPosition = false;
    for (let i = 0; i < tagPatternMatch.length; i++) {
      if (tagPatternMatch[i].startsWith("</")) {
        if (!markedPosition) {
          closeTagPoition = endTagCont - tagCount;
          markedPosition = true;
        }
        tagCount--;
      } else {
        tagCount++;
      }
      if (tagCount == 0) {
        break;
      }
    };
  }

  // match the last html end tag of all content and all content before it
  const tagEndRegex = new RegExp(`(.*)${endTagRegexStr}`, "i");

  for (let i = 0; i < closeTagPoition; i++) {
    const tagCloseMatch = contentAfterTag.match(tagEndRegex);
    if (tagCloseMatch) {
      contentAfterTag = tagCloseMatch[1];
    }
  }

  const clearContentAfterCloseTagRegex = new RegExp(`.*${endTagRegexStr}`, "i");
  const clearContentAfterCloseTagMatch = contentAfterTag.match(clearContentAfterCloseTagRegex);
  if (clearContentAfterCloseTagMatch) {
    contentAfterTag = clearContentAfterCloseTagMatch[0];
    foundTagContents.push(contentAfterTag);
  }

  // replace the contentAfterTag in content with ""
  // only replace the first match
  const remainingHtmlRegex = new RegExp(contentAfterTag.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "(.*)", "i");
  const remainingHtmlMatch = content.match(remainingHtmlRegex);
  if (remainingHtmlMatch) {
    const remainingHtml = remainingHtmlMatch[1];
    // check if any html tag is left
    const remainingHtmlTagRegex = new RegExp(`(<\\w+?>)`, "i");
    const remainingHtmlTagMatch = remainingHtml.match(remainingHtmlTagRegex);
    if (remainingHtmlTagMatch) {
      if (maxDeep === -1 || deep < maxDeep) {
        return findHtmlTagContentsRecursive(remainingHtml, targetTag, targetClass, foundTagContents, deep + 1, maxDeep);
      } else {
        log("warn", "HTML search:", "Max deep reached, recursive break");
        return foundTagContents;
      }
    }
  }

  return foundTagContents;
}
function findHtmlTagContents(content: string, targetTag: string, targetClass: string | null = null) {
  return findHtmlTagContentsRecursive(content, targetTag, targetClass);
}

function findHtmlTagContentsByClass(content: string, targetClass: string) {
  const regex = new RegExp(`(<(\\w+)\\s+class\\s*=\\s*['\"][^'\"]*?\\b${targetClass}\\b)`, "i");
  const match = content.match(regex);
  if (match) {
    const tag = match[2];
    return findHtmlTagContents(content, tag, targetClass);
  } else {
    return [];
  }
}

/**
 * 
 * @param content 
 * @param openMarker 
 * @param closeMarker 
 * @param startPosition 
 * @param direction - if "forward", the function will search the closest closeMarker after the startPosition, if "backward", the function will search the closest openMarker before the startPosition
 * @returns 
 */
function findClosestSymbolPosition(content: string, openMarker: string, closeMarker: string, startPosition: number = 0, direction: "forward" | "backward" = "backward") {
  let level = 0;
  let currentPos = startPosition;

  if (direction === "backward") {
    while (currentPos >= 0 && level >= 0) {
      if (content.slice(currentPos, currentPos + openMarker.length) === openMarker) {
        level--;
      } else if (content.slice(currentPos, currentPos + closeMarker.length) === closeMarker) {
        level++;
      }
      currentPos--;
    }
    if (level < 0) {
      // remove the last openMarker
      currentPos += 2;
    }
  } else {
    while (currentPos < content.length && level >= 0) {
      if (content.slice(currentPos, currentPos + openMarker.length) === openMarker) {
        level++;
      } else if (content.slice(currentPos, currentPos + closeMarker.length) === closeMarker) {
        level--;
      }
      currentPos++;
    }
    if (level < 0) {
      // remove the last closeMarker
      currentPos--;
    }
  }

  return currentPos;
}

function findContentBetweenMarker(content: string, targetStr: string, openMarker: string, closeMarker: string) {
  if (openMarker === closeMarker) {
    throw new Error("openMarker and closeMarker can not be the same");
  }

  let targetStrPosition = content.indexOf(targetStr);
  const truncatedContents: string[] = [];
  while (targetStrPosition !== -1 && targetStrPosition < content.length) {
    const openPos = findClosestSymbolPosition(content, "{", "}", targetStrPosition, "backward");
    const closePos = findClosestSymbolPosition(content, "{", "}", targetStrPosition, "forward");

    if (openPos === -1 && closePos === -1) {
      break;
    }
    truncatedContents.push(content.slice(openPos, closePos));
    targetStrPosition = content.indexOf(targetStr, closePos + 1);
  }

  return truncatedContents;
}


function obfuscateJs(content: string, key: string, classCoversion: ClassConversion
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

function addKeysToRegistery(usedKeys: Set<string>) {
  usedKeys.forEach((key) => {
    usedKeyRegistery.add(key);
  });
}

function copyCssData(targetSelector: string, newSelectorName: string, cssObj: any) {
  function recursive(rules: any[]): any[] {
    return rules.map((item: any) => {
      if (item.rules) {
        let newRules = recursive(item.rules);
        if (Array.isArray(newRules)) {
          newRules = newRules.flat();
        }
        return { ...item, rules: newRules };
      } else if (item.selectors) {
        // remove empty selectors
        item.selectors = item.selectors.filter((selector: any) => selector !== "");
        if (item.selectors.includes(targetSelector)) {

          const newRule = JSON.parse(JSON.stringify(item));
          newRule.selectors = [newSelectorName];

          return [item, newRule];
        } else {
          return item;
        }
      } else {
        return item;
      }
    });
  }
  cssObj.stylesheet.rules = recursive(cssObj.stylesheet.rules).flat();
  return cssObj;
}

function obfuscateCss(classConversion: ClassConversion, cssPath: string) {
  let cssContent = fs.readFileSync(cssPath, "utf-8");

  let cssObj = css.parse(cssContent);
  const cssRulesCount = cssObj.stylesheet.rules.length;

  // join all selectors start with ":" (eg. ":is")
  Object.keys(classConversion).forEach((key) => {
    if (key.startsWith(":")) {
      usedKeyRegistery.add(key);
    }
  });

  // copy css rules
  usedKeyRegistery.forEach((key) => {
    const originalSelectorName = key;
    const obfuscatedSelectorName = classConversion[key];
    if (obfuscatedSelectorName) {
      // copy the original css rules and paste it with the obfuscated selector name
      cssObj = copyCssData(originalSelectorName, classConversion[key], cssObj);
    }
  });
  log("info", "CSS rules:", `Added ${cssObj.stylesheet.rules.length - cssRulesCount} new CSS rules to ${getFilenameFromPath(cssPath)}`);

  const cssOptions = {
    compress: true,
  };
  const cssObfuscatedContent = css.stringify(cssObj, cssOptions);

  const sizeBefore = Buffer.byteLength(cssContent, "utf8");
  fs.writeFileSync(cssPath, cssObfuscatedContent);
  const sizeAfter = Buffer.byteLength(cssObfuscatedContent, "utf8");
  const percentChange = Math.round(((sizeAfter) / sizeBefore) * 100);
  log("success", "CSS obfuscated:", `Size from ${sizeBefore} to ${sizeAfter} bytes (${percentChange}%) in ${getFilenameFromPath(cssPath)}`);
}

/**
 * Find all files with the specified extension in the build folder
 * @param ext - the extension of the files to find (e.g. .css) "." is required
 * @param targetFolderPath - the path to the folder to start searching from
 * @returns - an array of file relative paths
 */
function findAllFilesWithExt(ext: string, targetFolderPath: string): string[] {
  if (!fs.existsSync(targetFolderPath)) {
    return [];
  }

  const targetExtFiles: string[] = [];

  function findCssFiles(dir: string) {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const filePath = normalizePath(path.join(dir, file));

      if (fs.statSync(filePath).isDirectory()) {
        // if it's a directory, recursively search for CSS files
        findCssFiles(filePath);
      } else {
        // check if the file has the specified extension
        if (file.endsWith(ext)) {
          targetExtFiles.push(filePath);
        }
      }
    });
  }

  // start searching for CSS files from the specified directory
  findCssFiles(targetFolderPath);

  return targetExtFiles;
}

function getAllSelector(cssObj: any): any[] {
  const selectors: string[] = [];
  function recursive(rules: any[]) {
    for (const item of rules) {
      if (item.rules) {
        recursive(item.rules);
      } else if (item.selectors) {
        // remove empty selectors
        item.selectors = item.selectors.filter((selector: any) => selector !== "");

        selectors.push(...item.selectors);
      }
    }
    return null;
  }
  recursive(cssObj.stylesheet.rules);
  return selectors;
}

function getRandomString(length: number) {
  //ref: https://github.com/n4j1Br4ch1D/postcss-obfuscator/blob/main/utils.js
  // Generate a random string of characters with the specified length
  const randomString = Math.random()
    .toString(36)
    .substring(2, length - 1 + 2);
  // Combine the random string with a prefix to make it a valid class name (starts with a letter, contains only letters, digits, hyphens, and underscores)
  const randomLetter = String.fromCharCode(Math.floor(Math.random() * 26) + 97); // 97 is the ASCII code for lowercase 'a'
  return `${randomLetter}${randomString}`;
}

function simplifyString(str: string) {
  //ref: https://github.com/n4j1Br4ch1D/postcss-obfuscator/blob/main/utils.js
  const tempStr = str.replace(/[aeiouw\d_-]/gi, "");
  return tempStr.length < 1
    ? String.fromCharCode(Math.floor(Math.random() * 26) + 97) + tempStr
    : tempStr;
}

function createNewClassName(mode: obfuscateMode, className: string, classPrefix: string = "", classSuffix: string = "", classNameLength: number = 5) {
  let newClassName = className;

  switch (mode) {
    case "random":
      newClassName = getRandomString(classNameLength);
      break;
    case "simplify":
      newClassName = simplifyString(className);
      break;
    default:
      break;
  }

  if (classPrefix) {
    newClassName = `${classPrefix}${newClassName}`;
  }
  if (classSuffix) {
    newClassName = `${newClassName}${classSuffix}`;
  }

  return newClassName;
}

/**
 * Extracts classes from a CSS selector.
 * 
 * @param selector - The CSS selector to extract classes from.
 * @param replacementClassNames - The replacement class names. 
 *                                The position of the class name in the array should match the 
 *                                position of the class in the selector that you want to replece.
 * @returns An array of extracted classes.
 * 
 * @example
 * // Returns: ["some-class", "some-class", "bg-white", "some-class", "bg-dark"]
 * extractClassFromSelector(":is(.some-class .some-class\\:!bg-white .some-class\\:bg-dark::-moz-placeholder)[data-active=\'true\']");
 * 
 * @example
 * // Returns: []
 * extractClassFromSelector("div");
 */
function extractClassFromSelector(selector: string, replacementClassNames?: (string | undefined)[]) {
  function toBase64Key(str: string) {
    return `${Buffer.from(str).toString("base64")}`;
  }
  function fromBase64Key(str: string) {
    return `${Buffer.from(str, "base64").toString("ascii")}`;
  }

  function createKey(str: string) {
    const b64 = toBase64Key(str).replace(/=/g, "");
    return `{{{{{{${b64}}}}}}}`;
  }

  function decodeKey(str: string) {
    const regex = /{{{{{{([\w\+\/]+)}}}}}}/g;
    str = str.replace(regex, (match, p1) => {
      // Calculate the number of '=' needed
      const padding = p1.length % 4 === 0 ? 0 : 4 - (p1.length % 4);
      // Add back the '='
      const b64 = p1 + "=".repeat(padding);
      return fromBase64Key(b64);
    });
    return str;
  }

  //? "(?:\\\*)?" for "*" selector, eg. ".\*\:pt-2"
  //? "\\\:" for eg.".hover\:border-b-2:hover" the ".hover\:border-b-2" should be in the same group
  //? "\\\.\d+" for number with ".", eg. ".ml-1\.5" the ".ml-1.5" should be in the same group, before that ".ml-1\.5" will split into ".ml-1" and ".5"
  //? "\\\/\d+" for number with "/", eg. ".bg-emerald-400\/20" the ".bg-emerald-400\/20" should be in the same group, before that ".bg-emerald-400\/20" will split into ".bg-emerald-400" and "\/20"
  //? "(?:\\?\[[\w\-="\\%\+\(\)]+\])?" for [attribute / Tailwind CSS custom parameter] selector
  const extractClassRegex = /(?<=[.:!\s]|(?<!\w)\.-)((?:\\\*)?(?:[\w\-]|\\\:|\\\.\d+|\\\/\d+|\\!)+(?:\\?\[\S+\])?)(?![\w\-]*\()/g;

  const actionSelectors = [
    ":hover", ":focus", ":active",
    ":visited", ":link", ":target",
    ":checked", ":disabled", ":enabled",
    ":indeterminate", ":optional", ":required",
    ":read-only", ":read-write", ":invalid",
    ":valid", ":in-range", ":out-of-range",
    ":placeholder-shown", ":fullscreen", ":default",
    ":root", ":empty", ":first-child",
    ":last-child", ":first-of-type", ":last-of-type",
    ":only-child", ":only-of-type", ":nth-child",
    ":nth-last-child", ":nth-of-type", ":nth-last-of-type",
    ":first-letter", ":first-line", ":before",
    ":after", ":selection", ":not",
    ":where", ":is", ":matches"
  ];

  const vendorPseudoClassRegexes = [
    /::?-moz-[\w-]+/g, // Firefox
    /::?-ms-[\w-]+/g,  // Internet Explorer, Edge
    /::?-webkit-[\w-]+/g, // Safari, Chrome, and Opera
    /::?-o-[\w-]+/g, // Opera (old ver)
  ]

  // remove action selectors
  actionSelectors.forEach((actionSelector) => {
    const regex = new RegExp(`(?<!\\\\)(?:\\${actionSelector})(?=\\:|\\)|\\s|\\(|$|"|{)`, "g");
    selector = selector.replace(regex, (match) => {
      console.log(selector);
      return createKey(match);
    });
  });

  // replace vendor pseudo class
  vendorPseudoClassRegexes.forEach((regex, i) => {
    selector = selector.replace(regex, (match) => {
      return createKey(match);
    });
  });

  let classes = selector.match(extractClassRegex) as string[] | undefined;

  // replace classes with replacementClassNames
  if (replacementClassNames !== undefined) {
    selector = selector.replace(extractClassRegex, (originalClassName) => {
      return replacementClassNames.shift() || originalClassName;
    });
  }
  selector = decodeKey(selector);

  return {
    selector: selector,
    extractedClasses: classes || []
  };
}

function createClassConversionJson(
  {
    classConversionJsonFolderPath,
    buildFolderPath,

    mode = "random",
    classNameLength = 5,
    classPrefix = "",
    classSuffix = "",
    classIgnore = [],

    enableObfuscateMarkers = false,
  }: {
    classConversionJsonFolderPath: string,
    buildFolderPath: string,

    mode?: obfuscateMode,
    classNameLength?: number,
    classPrefix?: string,
    classSuffix?: string,
    classIgnore?: string[],

    enableObfuscateMarkers?: boolean,
  }) {
  if (!fs.existsSync(classConversionJsonFolderPath)) {
    fs.mkdirSync(classConversionJsonFolderPath);
  }

  const selectorConversion: ClassConversion = loadAndMergeJsonFiles(classConversionJsonFolderPath);

  // pre-defined ".dark", mainly for tailwindcss dark mode
  if (enableObfuscateMarkers) {
    selectorConversion[".dark"] = ".dark";
  }

  // get all css selectors
  const cssPaths = findAllFilesWithExt(".css", buildFolderPath);
  const selectors: string[] = [];
  cssPaths.forEach((cssPath) => {
    const cssContent = fs.readFileSync(cssPath, "utf-8");
    const cssObj = css.parse(cssContent);
    selectors.push(...getAllSelector(cssObj));
  });

  // remove duplicated selectors
  const uniqueSelectors = [...new Set(selectors)];

  const allowClassStartWith = [".", ":is(", ":where(", ":not("
    , ":matches(", ":nth-child(", ":nth-last-child("
    , ":nth-of-type(", ":nth-last-of-type(", ":first-child("
    , ":last-child(", ":first-of-type(", ":last-of-type("
    , ":only-child(", ":only-of-type(", ":empty(", ":link("
    , ":visited(", ":active(", ":hover(", ":focus(", ":target("
    , ":lang(", ":enabled(", ":disabled(", ":checked(", ":default("
    , ":indeterminate(", ":root(", ":before("
    , ":after(", ":first-letter(", ":first-line(", ":selection("
    , ":read-only(", ":read-write(", ":fullscreen(", ":optional("
    , ":required(", ":valid(", ":invalid(", ":in-range(", ":out-of-range("
    , ":placeholder-shown("
  ];

  const selectorClassPair: { [key: string]: string[] } = {};

  for (let i = 0; i < uniqueSelectors.length; i++) {
    const originalSelector = uniqueSelectors[i];
    const { extractedClasses } = extractClassFromSelector(originalSelector) || [];
    selectorClassPair[originalSelector] = extractedClasses;
  }

  //? since a multi part selector normally grouped by multiple basic selectors
  //? so we need to obfuscate the basic selector first
  //? eg. ":is(.class1 .class2)" grouped by ".class1" and ".class2"
  // sort the selectorClassPair by the number of classes in the selector (from least to most)
  // and remove the selector with no class
  const sortedSelectorClassPair = Object.entries(selectorClassPair)
    .sort((a, b) => a[1].length - b[1].length)
    .filter((pair) => pair[1].length > 0);

  for (let i = 0; i < sortedSelectorClassPair.length; i++) {
    const [originalSelector, selectorClasses] = sortedSelectorClassPair[i];
    // const selectorStartWith = originalSelector.slice(0, 1);
    if (selectorClasses.length == 0) {
      continue;
    }

    let selector = originalSelector;
    let classes = selectorConversion[selector] ? [selectorConversion[selector].slice(1)] : selectorClasses;

    if (classes && allowClassStartWith.some((start) => selector.startsWith(start))) {
      classes = classes.map((className) => {
        if (classIgnore.includes(className)) {
          return className;
        }
        let obfuscatedSelector = selectorConversion[`.${className}`];
        if (!obfuscatedSelector) {
          const obfuscatedClass = createNewClassName(mode, className, classPrefix, classSuffix, classNameLength);
          obfuscatedSelector = `.${obfuscatedClass}`;
          selectorConversion[`.${className}`] = obfuscatedSelector;
        }
        // if (selector.includes("dark\\:ring-dark-tremor-ring")) {
        //   console.log(selector);
        // }
        // if (obfuscatedSelector.length !== 6) {
        //   console.log(selector);
        // }
        return obfuscatedSelector.slice(1)
      });
      const { selector: obfuscatedSelector } = extractClassFromSelector(originalSelector, classes);
      selectorConversion[originalSelector] = obfuscatedSelector;
      if (originalSelector.includes(".dark")) {
        console.log(selector);
      }
    }
  }

  const jsonPath = path.join(process.cwd(), classConversionJsonFolderPath, "conversion.json");
  fs.writeFileSync(jsonPath, JSON.stringify(selectorConversion, null, 2));
}

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

function replaceFirstMatch(source: string, find: string, replace: string): string {
  const index = source.indexOf(find);
  if (index !== -1) {
    return source.slice(0, index) + replace + source.slice(index + find.length);
  }
  return source;
}


function obfuscateForwardComponentJs(searchContent: string, wholeContent: string, classConversion: ClassConversion) {
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
      const { obfuscatedContent, usedKeys } = obfuscateKeys(classConversion, block);
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
    const childComponentObfuscatedcomponentCodePairs = obfuscateForwardComponentJs(componentsCode[i].code, wholeContent, classConversion);
    componentObfuscatedcomponentCodePairs.push(...childComponentObfuscatedcomponentCodePairs);
  }

  console.log(componentObfuscatedcomponentCodePairs);
  return componentObfuscatedcomponentCodePairs;
}

export {
  getFilenameFromPath, log, normalizePath
  , replaceJsonKeysInFiles, setLogLevel
  , copyCssData, findContentBetweenMarker, findHtmlTagContentsByClass
  , findAllFilesWithExt, createClassConversionJson, extractClassFromSelector
  , obfuscateKeys, searchForwardComponent, obfuscateForwardComponentJs
};
