import fs from "node:fs";
import path from "node:path";
import { type ConversionTables, cssEscape, cssUnescape } from "css-seasoning";
import { obfuscateHtmlClassNames } from "./handlers/html";
import { obfuscateJs } from "./handlers/js";
import type { LogLevel, SelectorConversion } from "./types";

// Add a new function for path filtering
/**
 * Checks if a path should be included based on whitelist and blacklist rules
 *
 * @param filePath - The file path to check
 * @param whiteListedFolderPaths - Paths to include
 * @param blackListedFolderPaths - Paths to exclude (higher priority than whitelist)
 * @returns - True if the path should be included, false otherwise
 */
const shouldIncludePath = (
  filePath: string,
  whiteListedFolderPaths: (string | RegExp)[] = [],
  blackListedFolderPaths: (string | RegExp)[] = [],
): boolean => {
  const normalizedPath = normalizePath(filePath);

  // Check if the path is blacklisted (higher priority)
  const isBlacklisted = blackListedFolderPaths.some((excludePath) => {
    if (typeof excludePath === "string") {
      return normalizedPath.includes(excludePath);
    }
    return excludePath.test(normalizedPath);
  });

  if (isBlacklisted) {
    return false; // Skip this file/directory
  }

  // Check if the path is whitelisted (if whitelist is not empty)
  const isWhitelisted =
    whiteListedFolderPaths.length === 0 ||
    whiteListedFolderPaths.some((includePath) => {
      if (typeof includePath === "string") {
        return normalizedPath.includes(includePath);
      }
      return includePath.test(normalizedPath);
    });

  return isWhitelisted;
};

//! ====================
//! Log
//! ====================

const issuer = "[next-css-obfuscator]";
let logLevel: LogLevel = "info";
const levels: LogLevel[] = ["debug", "info", "warn", "error", "success"];

export const log = (type: LogLevel, task: string, data: unknown) => {
  //ref: https://github.com/n4j1Br4ch1D/postcss-obfuscator/blob/main/utils.js
  if (levels.indexOf(type) < levels.indexOf(logLevel)) {
    return;
  }

  const mainColor = "\x1b[38;2;99;102;241m%s\x1b[0m";

  switch (type) {
    case "debug":
      console.debug(
        mainColor,
        issuer,
        "[Debug] \x1b[37m",
        task,
        data,
        "\x1b[0m",
      );
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
};

export const setLogLevel = (level: LogLevel) => {
  logLevel = level;
};

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

export const usedKeyRegistery = new Set<string>();

export const replaceJsonKeysInFiles = ({
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
  conversionTables: ConversionTables;
  targetFolder: string;
  allowExtensions: string[];

  contentIgnoreRegexes: RegExp[];

  whiteListedFolderPaths: (string | RegExp)[];
  blackListedFolderPaths: (string | RegExp)[];
  enableObfuscateMarkerClasses: boolean;
  obfuscateMarkerClasses: string[];
  removeObfuscateMarkerClassesAfterObfuscated: boolean;

  enableJsAst: boolean;
}) => {
  //ref: https://github.com/n4j1Br4ch1D/postcss-obfuscator/blob/main/utils.js

  if (removeObfuscateMarkerClassesAfterObfuscated) {
    obfuscateMarkerClasses.forEach((obfuscateMarkerClass) => {
      conversionTables.selectors[cssEscape(`.${obfuscateMarkerClass}`)] = "";
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
    } else if (allowExtensions.includes(fileExt)) {
      // Use the unified path filtering function
      if (
        !shouldIncludePath(
          filePath,
          whiteListedFolderPaths,
          blackListedFolderPaths,
        )
      ) {
        return;
      }

      // Replace JSON keys in the file
      let fileContent = fs.readFileSync(filePath, "utf-8");
      const fileContentOriginal = fileContent;

      if (enableObfuscateMarkerClasses) {
        obfuscateMarkerClasses.forEach((obfuscateMarkerClass) => {
          const isHtml = [".html"].includes(fileExt);
          if (isHtml) {
            // filter all html
            // ref: https://stackoverflow.com/a/56102604
            // biome-ignore lint/complexity/useRegexLiterals: using regex literals herer will cause typing issues
            const htmlRegex = new RegExp(
              "(<(.*)>(.*)</([^br][A-Za-z0-9]+)>)",
              "g",
            );
            const htmlMatch = fileContent.match(htmlRegex);
            if (htmlMatch) {
              const htmlOriginal = htmlMatch[0];
              const { obfuscatedContent, usedKeys } = obfuscateHtmlClassNames({
                html: htmlOriginal,
                selectorConversion: conversionTables.selectors,
                obfuscateMarkerClass: obfuscateMarkerClass,
                contentIgnoreRegexes: contentIgnoreRegexes,
              });
              addKeysToRegistery(usedKeys);
              if (htmlOriginal !== obfuscatedContent) {
                fileContent = fileContent.replace(
                  htmlOriginal,
                  obfuscatedContent,
                );
              }
            }
          } else {
            const obfuscateScriptContent = obfuscateJs(
              fileContent,
              obfuscateMarkerClass,
              conversionTables.selectors,
              filePath,
              contentIgnoreRegexes,
              enableJsAst,
            );
            if (fileContent !== obfuscateScriptContent) {
              fileContent = obfuscateScriptContent;
              log(
                "debug",
                "Obscured keys in JS like content file:",
                normalizePath(filePath),
              );
            }
          }
        });
      } else {
        /* Handle Full Obfuscation */

        if ([".js"].includes(fileExt)) {
          const obfuscateScriptContent = obfuscateJs(
            fileContent,
            enableJsAst ? "" : "jsx",
            conversionTables.selectors,
            filePath,
            contentIgnoreRegexes,
            enableJsAst,
          );
          if (fileContent !== obfuscateScriptContent) {
            fileContent = obfuscateScriptContent;
            log(
              "debug",
              "Obscured keys in JSX related file:",
              normalizePath(filePath),
            );
          }
        } else if ([".html"].includes(fileExt)) {
          //! NEW
          const { obfuscatedContent, usedKeys } = obfuscateHtmlClassNames({
            html: fileContent,
            selectorConversion: conversionTables.selectors,
            contentIgnoreRegexes: contentIgnoreRegexes,
          });

          fileContent = obfuscatedContent;
          addKeysToRegistery(usedKeys);
        } else {
          const { obfuscatedContent, usedKeys } = obfuscateKeys(
            conversionTables.selectors,
            fileContent,
            contentIgnoreRegexes,
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
  };

  // Process all files in the directory excluding .css files
  replaceJsonKeysInFile(targetFolder);

  // Obfuscate CSS files
  // cssPaths.forEach(async (cssPath) => {
  //   await obfuscateCss(classConversion, cssPath, removeOriginalCss, !enableObfuscateMarkerClasses);
  // });
};

export const obfuscateKeys = (
  selectorConversion: SelectorConversion,
  fileContent: string,
  contentIgnoreRegexes: RegExp[] = [],
) => {
  //ref: https://github.com/n4j1Br4ch1D/postcss-obfuscator/blob/main/utils.js

  const usedKeys = new Set<string>();
  Object.keys(selectorConversion).forEach((key) => {
    const fileContentOriginal = fileContent;
    // let keyUse = escapeRegExp(key.slice(1).replace(/\\/g, ""));
    let keyUse = cssUnescape(key).slice(1);

    keyUse = escapeRegExp(keyUse.replace(/\\/g, "")); // escape the key

    //? sample: "text-sm w-full\n      text-right\n p-2 flex gap-2 hover:bg-gray-100 dark:hover:bg-red-700 text-right"
    const exactMatchRegex = new RegExp(
      `([\\s"'\\\`]|^)(${keyUse})(?=$|[\\s"'\\\`]|\\\\n|\\\\",|\\\\"})`,
      "g",
    ); // match exact wording & avoid ` ' ""
    // exactMatchRegex = new RegExp(`([\\s"'\\\`]|^)(${keyUse})(?=$|[\\s"'\\\`])`, 'g'); // match exact wording & avoid ` ' ""

    const replacement = `$1${selectorConversion[key].slice(1).replace(/\\/g, "").slice(1)}`;

    const matches = fileContent.match(exactMatchRegex);
    const originalObscuredContentPairs = matches?.map((match) => {
      return {
        originalContent: match,
        obscuredContent: match.replace(exactMatchRegex, replacement),
      };
    });
    fileContent = fileContent.replace(exactMatchRegex, replacement); // capture preceding space

    if (contentIgnoreRegexes.length > 0) {
      contentIgnoreRegexes.forEach((regex) => {
        const originalContentFragments = fileContentOriginal.match(regex);

        originalContentFragments?.map((originalContentFragment) => {
          originalObscuredContentPairs?.map((pair) => {
            if (
              originalContentFragments?.some((fragment) =>
                fragment.includes(pair.originalContent),
              )
            ) {
              log(
                "debug",
                "Obscured keys:",
                `Ignored ${pair.originalContent} at ${originalContentFragment}`,
              );
              fileContent = fileContent.replace(
                originalContentFragment.replace(
                  pair.originalContent,
                  pair.obscuredContent,
                ),
                originalContentFragment,
              );
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
};

const escapeRegExp = (str: string) => {
  //ref: https://github.com/n4j1Br4ch1D/postcss-obfuscator/blob/main/utils.js
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
};

/**
 * Get the filename from a file path
 * @param filePath - The path to the file
 * @returns The filename of the file
 */
export const getFilenameFromPath = (filePath: string) => {
  //ref: https://github.com/n4j1Br4ch1D/postcss-obfuscator/blob/main/utils.js
  return filePath.replace(/^.*[\\/]/, "");
};

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
export const normalizePath = (filePath: string) => {
  return filePath.replace(/\\/g, "/");
};

/**
 *
 * @param content
 * @param openMarker
 * @param closeMarker
 * @param startPosition
 * @param direction - if "forward", the function will search the closest closeMarker after the startPosition, if "backward", the function will search the closest openMarker before the startPosition
 * @returns
 */
export const findClosestSymbolPosition = (
  content: string,
  openMarker: string,
  closeMarker: string,
  startPosition = 0,
  direction: "forward" | "backward" = "backward",
) => {
  let level = 0;
  let currentPos = startPosition;

  if (direction === "backward") {
    while (currentPos >= 0 && level >= 0) {
      if (
        content.slice(currentPos, currentPos + openMarker.length) === openMarker
      ) {
        level--;
      } else if (
        content.slice(currentPos, currentPos + closeMarker.length) ===
        closeMarker
      ) {
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
      if (
        content.slice(currentPos, currentPos + openMarker.length) === openMarker
      ) {
        level++;
      } else if (
        content.slice(currentPos, currentPos + closeMarker.length) ===
        closeMarker
      ) {
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
};

export const findContentBetweenMarker = (
  content: string,
  targetStr: string,
  openMarker: string,
  closeMarker: string,
) => {
  if (openMarker === closeMarker) {
    throw new Error("openMarker and closeMarker can not be the same");
  }

  let targetStrPosition = content.indexOf(targetStr);
  const truncatedContents: string[] = [];
  while (targetStrPosition !== -1 && targetStrPosition < content.length) {
    const openPos = findClosestSymbolPosition(
      content,
      openMarker,
      closeMarker,
      targetStrPosition,
      "backward",
    );
    const closePos = findClosestSymbolPosition(
      content,
      openMarker,
      closeMarker,
      targetStrPosition,
      "forward",
    );

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
};

export const addKeysToRegistery = (usedKeys: Set<string> | string[]) => {
  usedKeys.forEach((key) => {
    usedKeyRegistery.add(key);
  });
};

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
export const findAllFilesWithExt = (
  ext: string,
  targetFolderPath: string,
  options?: {
    whiteListedFolderPaths?: (string | RegExp)[];
    blackListedFolderPaths?: (string | RegExp)[];
  },
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
      const filePath = path.join(dir, file);

      if (!shouldIncludePath(filePath, whiteList, blackList)) {
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
  };

  // start searching for files from the specified directory
  findFiles(targetFolderPath);

  return targetExtFiles;
};

export const replaceFirstMatch = (
  source: string,
  find: string,
  replace: string,
): string => {
  const index = source.indexOf(find);
  if (index !== -1) {
    return source.slice(0, index) + replace + source.slice(index + find.length);
  }
  return source;
};

/**
 * Check if there are any duplicates in an array of strings
 * @param arr - an array of strings
 * @returns - true if there are any duplicates, false otherwise
 */
export const duplicationCheck = (arr: string[]) => {
  const set = new Set(arr);
  return arr.length !== set.size;
};

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
};

/**
 * Loads and merges all JSON files (Conversion Tables) in the specified folder.
 *
 * @param folderPath - The folder path to load the conversion tables from.
 * @returns ConversionTables - The merged conversion tables.
 */
export const loadConversionTables = (folderPath: string): ConversionTables => {
  const tables: ConversionTables = {
    idents: {},
    selectors: {},
  };

  fs.readdirSync(folderPath).forEach((file: string) => {
    const filePath = path.join(folderPath, file);
    const fileData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    if (
      Object.keys(fileData).includes("ident") &&
      Object.keys(fileData).includes("selector")
    ) {
      Object.assign(tables.idents, fileData.ident);
      Object.assign(tables.selectors, fileData.selector);
    } else {
      // if the file doesn't have ident, it should be selector
      //? For backward compatibility
      Object.assign(tables.selectors, fileData);
    }
  });

  return tables;
};
