import fs from "fs";
import path from "path";
// @ts-ignore
import css from 'css';

type LogType = "debug" | "info" | "warn" | "error" | "success";
type JsonData = { [key: string]: string };

const issuer = "next-css-obfuscator";
let logLevel = "info";
const levels = ["debug", "info", "warn", "error", "success"];
const usedKeyRegistery = new Set<string>();

function log(type: LogType, task: string, data: any) {
  if (levels.indexOf(type) < levels.indexOf(logLevel)) {
    return;
  }

  const mainColor = "\x1b[38;2;99;102;241m%s\x1b[0m";

  switch (type) {
    case "debug":
      console.debug(mainColor, issuer, "\x1b[37m", task, data, "\x1b[0m");
      break;
    case "info":
      console.info(mainColor, issuer, "\x1b[36m", task, data, "\x1b[0m");
      break;
    case "warn":
      console.warn(mainColor, issuer, "\x1b[33m", task, data, "\x1b[0m");
      break;
    case "error":
      console.error(mainColor, issuer, "\x1b[31m", task, data, "\x1b[0m");
      break;
    case "success":
      console.log(mainColor, issuer, "\x1b[32m", task, data, "\x1b[0m");
      break;
    default:
      console.log("'\x1b[0m'", issuer, task, data, "\x1b[0m");
      break;
  }
}

function setLogLevel(level: LogType) {
  logLevel = level;
}


function replaceJsonKeysInFiles(
  filesDir: string,
  htmlExtensions: string[],
  htmlExcludes: string[],
  jsonDataPath: string,
  indicatorStart: string | null,
  indicatorEnd: string | null,
  keepData: boolean,

  whiteListedPaths: string[],
  blackListedPaths: string[],
  excludeAnyMatchRegex: string[],
  enableObfuscateMarkerClasses: boolean,
  obfuscateMarkerClasses: string[],
  removeObfuscateMarkerClasses: boolean,
) {
  // Read and merge the JSON data
  const jsonData: JsonData = {};
  fs.readdirSync(jsonDataPath).forEach((file: string) => {
    const filePath = path.join(jsonDataPath, file);
    const fileData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    Object.assign(jsonData, fileData);
  });

  if (removeObfuscateMarkerClasses) {
    obfuscateMarkerClasses.forEach(obfuscateMarkerClass => {
      jsonData[`.${obfuscateMarkerClass}`] = "";
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
      htmlExtensions.includes(fileExt) &&
      !htmlExcludes.includes(path.basename(filePath))
    ) {
      if (whiteListedPaths.length > 0) {
        // check if file path is inclouded
        let inclouded = false;
        whiteListedPaths.forEach((incloudPath) => {
          if (normalizePath(filePath).includes(normalizePath(incloudPath))) {
            inclouded = true;
          }
        });
        if (!inclouded) {
          return;
        }
      }
      if (excludeAnyMatchRegex.length > 0) {
        let inclouded = false;
        excludeAnyMatchRegex.forEach((excludeRegex) => {
          if (normalizePath(filePath).match(excludeRegex)) {
            inclouded = true;
          }
        });
        if (inclouded) {
          return;
        }
      }
      if (blackListedPaths.length > 0) {
        let inclouded = false;
        blackListedPaths.forEach((incloudPath) => {
          if (normalizePath(filePath).includes(normalizePath(incloudPath))) {
            inclouded = true;
          }
        });
        if (inclouded) {
          return;
        }
      }

      // Replace JSON keys in the file
      let fileContent = fs.readFileSync(filePath, "utf-8");
      const fileContentOriginal = fileContent;

      if (enableObfuscateMarkerClasses) {
        obfuscateMarkerClasses.forEach(obfuscateMarkerClass => {
          const isHtml = [".html"].includes(fileExt);
          if (isHtml) {
            // ref: https://stackoverflow.com/a/56102604
            // filter all html
            const htmlRegex = new RegExp(`(<(.*)>(.*)<\/([^br][A-Za-z0-9]+)>)`, 'g');
            const htmlMatch = fileContent.match(htmlRegex);
            if (htmlMatch) {
              let html = htmlMatch[0];
              const htmlOriginal = html;
              const tagContents = findTagContentsByClass(html, obfuscateMarkerClass);
              tagContents.forEach(tagContent => {
                const { obfuscatedContent, usedKeys } = obfuscateKeys(jsonData, tagContent, indicatorStart, indicatorEnd);
                addKeysToRegistery(jsonData, usedKeys);
                if (tagContent !== obfuscatedContent) {
                  html = html.replace(tagContent, obfuscatedContent);
                  log("debug", `Obscured keys under HTML tag in file:`, normalizePath(filePath));
                }
              });

              const scriptTagContents = findHtmlTagContents(html, "script");
              scriptTagContents.forEach(scriptTagContent => {
                const obfuscateScriptContent = obfuscateJs(scriptTagContent, obfuscateMarkerClass, jsonData, filePath, indicatorStart, indicatorEnd);
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
            const obfuscateScriptContent = obfuscateJs(fileContent, obfuscateMarkerClass, jsonData, filePath, indicatorStart, indicatorEnd);
            if (fileContent !== obfuscateScriptContent) {
              fileContent = obfuscateScriptContent;
              log("debug", `Obscured keys in JS like content file:`, normalizePath(filePath));
            }
          }

        });
      } else {
        const { obfuscatedContent, usedKeys } = obfuscateKeys(jsonData, fileContent, indicatorStart, indicatorEnd);
        fileContent = obfuscatedContent;
        addKeysToRegistery(jsonData, usedKeys);
      }
      if (fileContentOriginal !== fileContent) {
        log("success", "Data obfuscated:", normalizePath(filePath));
        fs.writeFileSync(filePath, fileContent);
      }

    } else if (fileExt === ".css" && enableObfuscateMarkerClasses) {
      cssPaths.push(filePath);
    }

    if (!keepData) {
      if (fs.existsSync(jsonDataPath)) {
        fs.rmSync(jsonDataPath, { recursive: true });
        log("info", "Data removed:", jsonDataPath);
      }
    }

  };

  // Process all files in the directory excluding .css files
  replaceJsonKeysInFile(filesDir);

  // Obfuscate CSS files
  cssPaths.forEach((cssPath) => {
    obfuscateCss(jsonData, cssPath);
  });

}

function obfuscateKeys(jsonData: JsonData, fileContent: string, indicatorStart: string | null, indicatorEnd: string | null) {
  const usedKeys = new Set<string>();
  Object.keys(jsonData).forEach((key) => {
    const fileContentOriginal = fileContent;
    let keyUse = escapeRegExp(key.slice(1).replace(/\\/g, ""));
    let regex;
    regex = new RegExp(`([\\s"'\\\`]|^)(${keyUse})(?=$|[\\s"'\\\`])`, 'g'); // match exact wording & avoid ` ' ""
    //@ts-ignore
    fileContent = fileContent.replace(regex, `$1` + jsonData[key].slice(1).replace(/\\/g, "")); // capture preceding space

    if (fileContentOriginal !== fileContent && !usedKeys.has(key)) {
      usedKeys.add(key);
    }

    if (indicatorStart || indicatorEnd) {
      regex = new RegExp(`([\\s"'\\\`]|^)(${indicatorStart ?? ''}${keyUse})(?=$|[\\s"'\\\`])`, 'g');
      //@ts-ignore
      fileContent = fileContent.replace(regex, `$1` + jsonData[key].slice(1).replace(/\\/g, ""));
      regex = new RegExp(`([\\s"'\\\`]|^)(${keyUse}${indicatorEnd ?? ''})(?=$|[\\s"'\\\`])`, 'g');
      //@ts-ignore
      fileContent = fileContent.replace(regex, `$1` + jsonData[key].slice(1).replace(/\\/g, ""));
      regex = new RegExp(`([\\s"'\\\`]|^)(${indicatorStart ?? ''}${keyUse}${indicatorEnd ?? ''})(?=$|[\\s"'\\\`])`, 'g');
      //@ts-ignore
      fileContent = fileContent.replace(regex, `$1` + jsonData[key].slice(1).replace(/\\/g, ""));
    }
  });
  return { obfuscatedContent: fileContent, usedKeys: usedKeys };
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function getFilenameFromPath(filePath: string) {
  return filePath.replace(/^.*[\\/]/, '');
}

function normalizePath(filePath: string) {
  return filePath.replace(/\\/g, "/");
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

function findTagContentsByClass(content: string, targetClass: string) {
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

function obfuscateJs(content: string, key: string, jsonData: JsonData
  , filePath: string, indicatorStart: string | null, indicatorEnd: string | null
) {
  const truncatedContents = findContentBetweenMarker(content, key, "{", "}");
  truncatedContents.forEach((truncatedContent) => {
    const { obfuscatedContent, usedKeys } = obfuscateKeys(jsonData, truncatedContent, indicatorStart, indicatorEnd);
    addKeysToRegistery(jsonData, usedKeys);
    if (truncatedContent !== obfuscatedContent) {
      content = content.replace(truncatedContent, obfuscatedContent);
      log("debug", `Obscured keys "${key}":`, `${normalizePath(filePath)}`);
    }
  });
  return content;
}

function addKeysToRegistery(jsonData: JsonData, usedKeys: Set<string>) {
  Object.keys(jsonData).forEach((key) => {
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

function obfuscateCss(jsonData: JsonData, cssPath: string) {
  let cssContent = fs.readFileSync(cssPath, "utf-8");

  let cssObj = css.parse(cssContent);
  const cssRulesCount = cssObj.stylesheet.rules.length;

  // copy css rules
  usedKeyRegistery.forEach((key) => {
    const originalSelectorName = key;
    const obfuscatedSelectorName = jsonData[key];
    if (obfuscatedSelectorName) {
      // copy the original css rules and paste it with the obfuscated selector name
      cssObj = copyCssData(originalSelectorName, jsonData[key], cssObj);
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

export { getFilenameFromPath, log, normalizePath, replaceJsonKeysInFiles, setLogLevel, type LogType };
