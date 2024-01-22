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

      let isTargetFile = false;
      if (whiteListedFolderPaths.length > 0) {
        isTargetFile = whiteListedFolderPaths.some((incloudPath) => {
          return normalizePath(filePath).includes(normalizePath(incloudPath));
        });
      }
      if (blackListedFolderPaths.length > 0) {
        isTargetFile = !blackListedFolderPaths.some((incloudPath) => {
          return normalizePath(filePath).includes(normalizePath(incloudPath));
        });
      }
      if (includeAnyMatchRegexes.length > 0) {
        isTargetFile = includeAnyMatchRegexes.some((regex) => {
          return normalizePath(filePath).match(regex);
        });
      }
      if (excludeAnyMatchRegexes.length > 0) {
        isTargetFile = !excludeAnyMatchRegexes.some((regex) => {
          return normalizePath(filePath).match(regex);
        });
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
                const { obfuscatedContent, usedKeys } = obfuscateKeys(classConversion, tagContent);
                addKeysToRegistery(usedKeys);
                if (tagContent !== obfuscatedContent) {
                  html = html.replace(tagContent, obfuscatedContent);
                  log("debug", `Obscured keys under HTML tag in file:`, normalizePath(filePath));
                }
              });

              const scriptTagContents = findHtmlTagContents(html, "script");
              scriptTagContents.forEach(scriptTagContent => {
                const obfuscateScriptContent = obfuscateJs(scriptTagContent, obfuscateMarkerClass, classConversion, filePath);
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
            const obfuscateScriptContent = obfuscateJs(fileContent, obfuscateMarkerClass, classConversion, filePath);
            if (fileContent !== obfuscateScriptContent) {
              fileContent = obfuscateScriptContent;
              log("debug", `Obscured keys in JS like content file:`, normalizePath(filePath));
            }
          }

        });
      } else {
        const { obfuscatedContent, usedKeys } = obfuscateKeys(classConversion, fileContent);
        fileContent = obfuscatedContent;
        addKeysToRegistery(usedKeys);
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

function obfuscateKeys(jsonData: ClassConversion, fileContent: string) {
  //ref: https://github.com/n4j1Br4ch1D/postcss-obfuscator/blob/main/utils.js

  const usedKeys = new Set<string>();
  Object.keys(jsonData).forEach((key) => {
    const fileContentOriginal = fileContent;
    let keyUse = escapeRegExp(key.slice(1).replace(/\\/g, ""));
    let regex;

    //? sample: "text-sm w-full\n      text-right\n p-2 flex gap-2 hover:bg-gray-100 dark:hover:bg-red-700 text-right"
    regex = new RegExp(`([\\s"'\\\`]|^)(${keyUse})(?=$|[\\s"'\\\`]|\\\\n)`, 'g'); // match exact wording & avoid ` ' ""
    // regex = new RegExp(`([\\s"'\\\`]|^)(${keyUse})(?=$|[\\s"'\\\`])`, 'g'); // match exact wording & avoid ` ' ""

    fileContent = fileContent.replace(regex, `$1` + jsonData[key].slice(1).replace(/\\/g, "")); // capture preceding space

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

function findContentBetweenMarker(content: string, targetStr: string, openMarker: string, closeMarker: string) {
  if (openMarker === closeMarker) {
    throw new Error("openMarker and closeMarker can not be the same");
  }

  const foundContents: string[] = [];

  let targetStrPosition = content.indexOf(targetStr);
  while (targetStrPosition !== -1 && targetStrPosition < content.length) {
    let openMarkerPosition = -1;

    // search the closer openMarker before the targetStr
    let currentPosition = targetStrPosition;
    while (openMarkerPosition === -1 && currentPosition > 0) {
      const reading = content.slice(currentPosition, currentPosition + openMarker.length);
      if (reading === openMarker) {
        openMarkerPosition = currentPosition;
      } else if (reading === closeMarker) {
        break;
      } else {
        currentPosition--;
      }
    }
    if (openMarkerPosition !== -1) {
      let closeMarkerPosition = openMarkerPosition;
      if (closeMarkerPosition < content.length) {
        let count = 1;
        let closeMarkerReadingFramePos = closeMarkerPosition + closeMarker.length;
        while (count > 0 && closeMarkerReadingFramePos < content.length) {
          if (content.slice(closeMarkerReadingFramePos, closeMarkerReadingFramePos + openMarker.length) === openMarker) {
            count++;
            closeMarkerReadingFramePos += openMarker.length;
          } else if (content.slice(closeMarkerReadingFramePos, closeMarkerReadingFramePos + closeMarker.length) === closeMarker) {
            count--;
            closeMarkerReadingFramePos += closeMarker.length;
          } else {
            closeMarkerReadingFramePos++;
          }
        }
        if (count === 0) {
          const block = content.slice(openMarkerPosition + openMarker.length, closeMarkerReadingFramePos - closeMarker.length);
          if (block.includes(targetStr)) {
            foundContents.push(block);
          }
        }
      }
    }
    targetStrPosition = content.indexOf(targetStr, targetStrPosition + 1);
  }

  return foundContents;
}

function obfuscateJs(content: string, key: string, jsonData: ClassConversion
  , filePath: string) {
  const truncatedContents = findContentBetweenMarker(content, key, "{", "}");
  truncatedContents.forEach((truncatedContent) => {
    const { obfuscatedContent, usedKeys } = obfuscateKeys(jsonData, truncatedContent);
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
function extractClassFromSelector(selector: string) {
  const extractClassRegex = /(?<=[:|.|\s|!])(\b\w[\w\-]*\b)(?![\w\-]*\()/g;
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
  let classes = selector.match(extractClassRegex) as string[] | undefined;
  classes = classes?.filter((className) => !actionSelectors.some((actionSelector) => `:${className}` === actionSelector));
  return classes || [];
}

function getKeyByValue(object: { [key: string]: string }, value: string) {
  return Object.keys(object).find(key => object[key] === value);
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

    customTailwindDarkModeSelector = null
  }: {
    classConversionJsonFolderPath: string,
    buildFolderPath: string,

    mode?: obfuscateMode,
    classNameLength?: number,
    classPrefix?: string,
    classSuffix?: string,
    classIgnore?: string[],

    customTailwindDarkModeSelector?: string | null
  }) {
  if (!fs.existsSync(classConversionJsonFolderPath)) {
    fs.mkdirSync(classConversionJsonFolderPath);
  }

  const selectorConversion: ClassConversion = loadAndMergeJsonFiles(classConversionJsonFolderPath);

  const cssPaths = findAllFilesWithExt(".css", buildFolderPath);
  const selectors: string[] = [];

  cssPaths.forEach((cssPath) => {
    const cssContent = fs.readFileSync(cssPath, "utf-8");
    const cssObj = css.parse(cssContent);
    selectors.push(...getAllSelector(cssObj));
  });

  // remove duplicated selectors
  const uniqueSelectors = [...new Set(selectors)];

  // for tailwindcss dark mode
  if (customTailwindDarkModeSelector) {
    selectorConversion[".dark"] = `.${customTailwindDarkModeSelector}`;
  }

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
    selectorClassPair[originalSelector] = extractClassFromSelector(originalSelector) || [];
  }

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
      if (selectorClasses.length > 1) {
        const haveNotFoundClass = classes.some((className) => {
          return !selectorConversion[`.${className}`];
        });
        classes = haveNotFoundClass ? [originalSelector.slice(1)] : classes;
      }
      classes.forEach((className) => {
        if (classIgnore.includes(className)) {
          return;
        }
        let newClassName = selectorConversion[`.${className}`];

        if (selectorConversion[originalSelector]) {
          selector = selectorConversion[originalSelector];
        } else {
          if (!newClassName) {
            newClassName = createNewClassName(mode, className, classPrefix, classSuffix, classNameLength);
            selectorConversion[`.${className}`] = `.${newClassName}`;
          } else {
            newClassName = newClassName.slice(1);
          }
          selector = selector.replace(className, newClassName);
        }
      });
      selectorConversion[originalSelector] = selector;

      // for tailwindcss dark mode
      if (originalSelector.startsWith(`:is(.dark .dark\\:`)) {
        const obfuscatedDarkSelector = selectorConversion[".dark"];
        //eg. :is(.dark .dark\\:bg-emerald-400\\/20 .dark\\:bg-emerald-400\\/20) => .dark\\:bg-emerald-400\\/20
        const matchWholeDarkSelector = /(?<=\.dark\s)([\w\\\/\-:.]*)/;
        const match = originalSelector.match(matchWholeDarkSelector);
        const wholeDarkSelector = match ? match[0] : "";
        if (obfuscatedDarkSelector && classes.length > 2) {
          //? since during the obfuscation, the class name will remove the "." at the start, so we need to add it back to prevent the class name got sliced
          const obfuscatedWholeDarkSelector = wholeDarkSelector.replace(".dark", obfuscatedDarkSelector).replace(classes[2], selectorConversion[`.${classes[2]}`].slice(1));
          selectorConversion[wholeDarkSelector] = obfuscatedWholeDarkSelector;
        }
      }
    }
  }

  const jsonPath = path.join(process.cwd(), classConversionJsonFolderPath, "conversion.json");
  fs.writeFileSync(jsonPath, JSON.stringify(selectorConversion, null, 2));
}

export {
  getFilenameFromPath, log, normalizePath
  , replaceJsonKeysInFiles, setLogLevel
  , copyCssData, findContentBetweenMarker, findHtmlTagContentsByClass
  , findAllFilesWithExt, createClassConversionJson, extractClassFromSelector
};
