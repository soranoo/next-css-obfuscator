import fs from "fs";
import path from "path";
import { LogLevel, SelectorConversion } from "./types";

import { obfuscateCss } from "./handlers/css";
import { findHtmlTagContentsByClass, findHtmlTagContents } from "./handlers/html";
import { obfuscateJs } from "./handlers/js";

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
    selectorConversionJsonFolderPath,

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
    selectorConversionJsonFolderPath: string,

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

  const classConversion: SelectorConversion = loadAndMergeJsonFiles(selectorConversionJsonFolderPath);

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
    obfuscateCss(classConversion, cssPath, !enableObfuscateMarkerClasses);
  });

}

function obfuscateKeys(jsonData: SelectorConversion, fileContent: string, contentIgnoreRegexes: RegExp[] = []) {
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

function addKeysToRegistery(usedKeys: Set<string>) {
  usedKeys.forEach((key) => {
    usedKeyRegistery.add(key);
  });
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

function replaceFirstMatch(source: string, find: string, replace: string): string {
  const index = source.indexOf(find);
  if (index !== -1) {
    return source.slice(0, index) + replace + source.slice(index + find.length);
  }
  return source;
}

export {
  getFilenameFromPath, log, normalizePath, loadAndMergeJsonFiles
  , replaceJsonKeysInFiles, setLogLevel, findContentBetweenMarker, replaceFirstMatch
  , findAllFilesWithExt, getRandomString, simplifyString, usedKeyRegistery
  , obfuscateKeys, findClosestSymbolPosition, addKeysToRegistery
};
