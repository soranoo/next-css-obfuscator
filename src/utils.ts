import fs from "node:fs";
import path from "node:path";
import NumberGenerator from "recoverable-random";
import type {
  LogLevel,
  SelectorConversion,
  HtmlCharacterEntityConversion
} from "./types";
import { cssEscape, type ConversionTables } from "css-seasoning";

import { obfuscateCss } from "./handlers/css";
import { obfuscateHtmlClassNames } from "./handlers/html";
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
//! Constants
//! ====================

//! deprecated
// const HTML_CHARACTER_ENTITY_CONVERSION: HtmlCharacterEntityConversion = {
//   "\\&": "&amp;",
//   "\\<": "&lt;",
//   "\\>": "&gt;",
//   '\\"': "&quot;",
//   "\\'": "&#39;",

//   "\\2c": ",", //! not working
// };

//! ====================
//! 
//! ====================

const usedKeyRegistery = new Set<string>();


const replaceJsonKeysInFiles = (
  {
    conversionTables,
    targetFolder,
    allowExtensions,

    contentIgnoreRegexes,

    whiteListedFolderPaths,
    blackListedFolderPaths,
    enableObfuscateMarkerClasses,
    obfuscateMarkerClasses,
    removeObfuscateMarkerClassesAfterObfuscated,

    enableJsAst,
  }: {
    conversionTables: ConversionTables,
    targetFolder: string,
    allowExtensions: string[],

    contentIgnoreRegexes: RegExp[],

    whiteListedFolderPaths: (string | RegExp)[],
    blackListedFolderPaths: (string | RegExp)[],
    enableObfuscateMarkerClasses: boolean,
    obfuscateMarkerClasses: string[],
    removeObfuscateMarkerClassesAfterObfuscated: boolean,

    enableJsAst: boolean,
  }) => {
  //ref: https://github.com/n4j1Br4ch1D/postcss-obfuscator/blob/main/utils.js

  if (removeObfuscateMarkerClassesAfterObfuscated) {
    obfuscateMarkerClasses.forEach(obfuscateMarkerClass => {
      conversionTables.selector[cssEscape(`.${obfuscateMarkerClass}`)] = "";
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
          if (typeof incloudPath === "string") {
            return normalizePath(filePath).includes(incloudPath);
          }
          const regex = new RegExp(incloudPath);
          return regex.test(normalizePath(filePath));
        });
      }
      if (blackListedFolderPaths.length > 0) {
        const res = !blackListedFolderPaths.some((incloudPath) => {
          if (typeof incloudPath === "string") {
            return normalizePath(filePath).includes(incloudPath);
          }
          const regex = new RegExp(incloudPath);
          return regex.test(normalizePath(filePath));
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
              const htmlOriginal = htmlMatch[0];
              const { obfuscatedContent, usedKeys } = obfuscateHtmlClassNames({
                html: htmlOriginal,
                selectorConversion: conversionTables.selector,
                obfuscateMarkerClass: obfuscateMarkerClass,
                contentIgnoreRegexes: contentIgnoreRegexes,
              });
              addKeysToRegistery(usedKeys);
              if (htmlOriginal !== obfuscatedContent) {
                fileContent = fileContent.replace(htmlOriginal, obfuscatedContent);
              }
            }
          } else {
            const obfuscateScriptContent = obfuscateJs(fileContent,
              obfuscateMarkerClass,
              conversionTables.selector,
              filePath,
              contentIgnoreRegexes,
              enableJsAst
            );
            if (fileContent !== obfuscateScriptContent) {
              fileContent = obfuscateScriptContent;
              log("debug", `Obscured keys in JS like content file:`, normalizePath(filePath));
            }
          }

        });
      } else {
        /* Handle Full Obfuscation */

        if ([".js"].includes(fileExt)) {
          const obfuscateScriptContent = obfuscateJs(
            fileContent,
            enableJsAst ? "" : "jsx",
            conversionTables.selector,
            filePath,
            contentIgnoreRegexes,
            enableJsAst
          );
          if (fileContent !== obfuscateScriptContent) {
            fileContent = obfuscateScriptContent;
            log("debug", `Obscured keys in JSX related file:`, normalizePath(filePath));
          }
        } else if ([".html"].includes(fileExt)) {
          //! NEW
          const { obfuscatedContent, usedKeys } = obfuscateHtmlClassNames({
            html: fileContent,
            selectorConversion: conversionTables.selector,
            contentIgnoreRegexes: contentIgnoreRegexes,
          });

          fileContent = obfuscatedContent;
          addKeysToRegistery(usedKeys);
        } else {
          const { obfuscatedContent, usedKeys } = obfuscateKeys(
            conversionTables.selector,
            fileContent,
            contentIgnoreRegexes
          );


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
  // cssPaths.forEach(async (cssPath) => {
  //   await obfuscateCss(classConversion, cssPath, removeOriginalCss, !enableObfuscateMarkerClasses);
  // });
}

function obfuscateKeys(
  selectorConversion: SelectorConversion,
  fileContent: string,
  contentIgnoreRegexes: RegExp[] = [],
  useHtmlEntity: boolean = false
) {
  //ref: https://github.com/n4j1Br4ch1D/postcss-obfuscator/blob/main/utils.js

  const usedKeys = new Set<string>();
  Object.keys(selectorConversion).forEach((key) => {
    const fileContentOriginal = fileContent;
    // let keyUse = escapeRegExp(key.slice(1).replace(/\\/g, ""));
    let keyUse = key.slice(1);

    //! deprecated
    // if (useHtmlEntity) {
    //   const regex = new RegExp(`(${Object.keys(HTML_CHARACTER_ENTITY_CONVERSION).join("|")})`, "g");
    //   keyUse = keyUse.replace(regex, (m: string) => {
    //     return HTML_CHARACTER_ENTITY_CONVERSION[m]
    //   });
    // }
    keyUse = escapeRegExp(keyUse.replace(/\\/g, ""));

    //? sample: "text-sm w-full\n      text-right\n p-2 flex gap-2 hover:bg-gray-100 dark:hover:bg-red-700 text-right"
    let exactMatchRegex = new RegExp(`([\\s"'\\\`]|^)(${keyUse})(?=$|[\\s"'\\\`]|\\\\n|\\\\",|\\\\"})`, 'g'); // match exact wording & avoid ` ' ""
    // exactMatchRegex = new RegExp(`([\\s"'\\\`]|^)(${keyUse})(?=$|[\\s"'\\\`])`, 'g'); // match exact wording & avoid ` ' ""

    const replacement = `$1` + selectorConversion[key].slice(1).replace(/\\/g, "");

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
    const openPos = findClosestSymbolPosition(content, openMarker, closeMarker, targetStrPosition, "backward");
    const closePos = findClosestSymbolPosition(content, openMarker, closeMarker, targetStrPosition, "forward");

    if (openPos === -1 && closePos === -1) {
      break;
    }

    if (openPos > -1 && closePos > -1) {
      truncatedContents.push(content.slice(openPos, closePos));
      targetStrPosition = content.indexOf(targetStr, closePos + 1);
    } else {
      // If there is only one of the markers found, move to the next targetStr
      targetStrPosition = content.indexOf(targetStr, targetStrPosition + 1);
    }
  }

  return truncatedContents;
}

export function addKeysToRegistery(usedKeys: Set<string> | string[]) {
  usedKeys.forEach((key) => {
    usedKeyRegistery.add(key);
  });
}

/**
 * Find all files with the specified extension in the build folder.
 * 
 * @param ext - the extension of the files to find (e.g. .css) "." is required.
 * @param targetFolderPath - the path to the folder to start searching from.
 * @param options - optional parameters.
 * @param options.whiteListedFolderPaths - an array of folder paths to include in the search.
 * @param options.blackListedFolderPaths - an array of folder paths to exclude from the search. Higher priority than whiteListedFolderPaths.
 * @returns - an array of file relative paths.
 */
const findAllFilesWithExt = (
  ext: string, targetFolderPath: string,
  options?: {
    whiteListedFolderPaths?: (string | RegExp)[],
    blackListedFolderPaths?: (string | RegExp)[],
  }
): string[] => {
  if (!fs.existsSync(targetFolderPath)) {
    return [];
  }

  const targetExtFiles: string[] = [];
  const whiteList = options?.whiteListedFolderPaths || [];
  const blackList = options?.blackListedFolderPaths || [];

  const findFiles = (dir: string) => {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const filePath = normalizePath(path.join(dir, file));

      // Check if the path is blacklisted (higher priority)
      const isBlacklisted = blackList.some((excludePath) => {
        if (typeof excludePath === "string") {
          return filePath.includes(excludePath);
        }
        return excludePath.test(filePath);
      });

      if (isBlacklisted) {
        return; // Skip this file/directory
      }

      // Check if the path is whitelisted (if whitelist is not empty)
      const isWhitelisted = whiteList.length === 0 || whiteList.some((includePath) => {
        if (typeof includePath === "string") {
          return filePath.includes(includePath);
        }
        return includePath.test(filePath);
      });

      if (!isWhitelisted) {
        return; // Skip this file/directory
      }

      if (fs.statSync(filePath).isDirectory()) {
        // if it's a directory, recursively search for files
        findFiles(filePath);
      } else {
        // check if the file has the specified extension
        if (file.endsWith(ext)) {
          targetExtFiles.push(filePath);
        }
      }
    });
  }

  // start searching for files from the specified directory
  findFiles(targetFolderPath);

  return targetExtFiles;
}

let rng: NumberGenerator | undefined = undefined;

function getRandomString(length: number, seed?: string, rngStateCode?: string, str?: string) {
  if (length <= 0 || !Number.isInteger(length)) {
    throw new Error("Length must be a positive integer");
  }

  if (!rng) {
    rng = new NumberGenerator(seed);
  }
  if (rngStateCode) {
    rng.recoverState(rngStateCode);
  }

  let rn = rng.random(0, 1, true);
  if (str && seed) {
    // can create a more collision resistant "random number" but in fact it's not random number
    rn = Number.parseFloat(`0.${NumberGenerator.stringToSeed(str) + NumberGenerator.stringToSeed(seed)}`);
  }

  //ref: https://github.com/n4j1Br4ch1D/postcss-obfuscator/blob/main/utils.js
  // Generate a random string of characters with the specified length
  const randomString = rn.toString(36).substring(2, length - 1 + 2);
  // Combine the random string with a prefix to make it a valid class name (starts with a letter, contains only letters, digits, hyphens, and underscores)
  const randomLetter = String.fromCharCode(Math.floor(rng.random(0, 1, true) * 26) + 97); // 97 is the ASCII code for lowercase 'a'
  return {
    rngStateCode: rng.getStateCode(),
    randomString: `${randomLetter}${randomString}`,
  };
}

/**
 * 
 * @param str 
 * @param seed 
 * @param rngStateCode 
 * @returns 
 */
function seedableSimplifyString(str: string, seed?: string, rngStateCode?: string) {
  if (!str) {
    throw new Error("String can not be empty");
  }
  if (!rng) {
    rng = new NumberGenerator(seed);
  }
  if (rngStateCode) {
    rng.recoverState(rngStateCode);
  }

  //ref: https://github.com/n4j1Br4ch1D/postcss-obfuscator/blob/main/utils.js
  const tempStr = str.replace(/[aeiouw\d_-]/gi, "");

  return {
    rngStateCode: rng.getStateCode(),
    randomString: tempStr.length < 1
      ? String.fromCharCode(Math.floor(rng.random(0, 1, true) * 26) + 97) + tempStr
      : tempStr,
  };
}

/**
 * Get a simplified string from a number
 * @param alphabetPoistion (starting from 1)
 * @returns alphabet string
 * 
 * @example
 * simplifyString(1) // returns "a"
 * simplifyString(26) // returns "z"
 * simplifyString(27) // returns "aa"
 * simplifyString(52) // returns "az"
 * simplifyString(53) // returns "ba"
 */
function simplifyString(alphabetPoistion: number) {
  if (alphabetPoistion <= 0 || !Number.isInteger(alphabetPoistion)) {
    throw new Error("Position must be a positive integer");
  }

  let dividend = alphabetPoistion;
  let columnName = "";
  let modulo = 0;

  while (dividend > 0) {
    modulo = (dividend - 1) % 26;
    columnName = String.fromCharCode(97 + modulo) + columnName;
    dividend = Math.floor((dividend - modulo) / 26);
  }

  return columnName;
}

function replaceFirstMatch(source: string, find: string, replace: string): string {
  const index = source.indexOf(find);
  if (index !== -1) {
    return source.slice(0, index) + replace + source.slice(index + find.length);
  }
  return source;
}

/**
 * Check if there are any duplicates in an array of strings
 * @param arr - an array of strings
 * @returns - true if there are any duplicates, false otherwise
 */
function duplicationCheck(arr: string[]) {
  const set = new Set(arr);
  return arr.length !== set.size;
}


function createKey(str: string) {
  const b64 = Buffer.from(str).toString("base64").replace(/=/g, "");
  return `{{{{{{${b64}}}}}}}`;
}

function decodeKey(str: string) {
  const regex = /{{{{{{([\w\+\/]+)}}}}}}/g;
  str = str.replace(regex, (match, p1) => {
    // Calculate the number of '=' needed
    const padding = p1.length % 4 === 0 ? 0 : 4 - (p1.length % 4);
    // Add back the '='
    const b64 = p1 + "=".repeat(padding);
    return Buffer.from(b64, "base64").toString("ascii");
  });
  return str;
}

/**
 * Convert a string to a number by summing the char codes of each character
 * 
 * @param str - The string to convert
 * @returns The sum of the char codes of each character in the string
 * 
 * @example
 * stringToNumber("abc") // returns 294 (97 + 98 + 99)
 * stringToNumber("hello") // returns 532 (104 + 101 + 108 + 108 + 111)
 */
export const stringToNumber = (str: string) => {
  return str.split("").reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
}


/**
 * Loads and merges all JSON files (Conversion Tables) in the specified folder.
 * 
 * @param folderPath - The folder path to load the conversion tables from.
 * @returns ConversionTables - The merged conversion tables.
 */
export const loadConversionTables = (folderPath: string): ConversionTables => {
  const tables: ConversionTables = {
    ident: {},
    selector: {},
  };

  fs.readdirSync(folderPath).forEach((file: string) => {
    const filePath = path.join(folderPath, file);
    const fileData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    if (Object.keys(fileData).includes("ident") && Object.keys(fileData).includes("selector")) {
      Object.assign(tables.ident, fileData.ident);
      Object.assign(tables.selector, fileData.selector);
    } else {
      // if the file doesn't have ident, it should be selector
      //? For backward compatibility
      Object.assign(tables.selector, fileData);
    }
  });

  return tables;
}


export {
  getFilenameFromPath, log, normalizePath, loadAndMergeJsonFiles
  , replaceJsonKeysInFiles, setLogLevel, findContentBetweenMarker, replaceFirstMatch
  , findAllFilesWithExt, getRandomString, seedableSimplifyString, usedKeyRegistery
  , obfuscateKeys, findClosestSymbolPosition, duplicationCheck
  , createKey, decodeKey, simplifyString
};
