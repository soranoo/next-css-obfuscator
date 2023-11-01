import fs from "fs";
import path from "path";

type LogType = "info" | "warn" | "error" | "success";

const issuer = "next-css-obfuscator";

function log(type: LogType, task: string, data: any) {
  const mainColor = "\x1b[38;2;99;102;241m%s\x1b[0m";
  switch (type) {
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

function replaceJsonKeysInFiles(
  filesDir: string,
  htmlExtensions: string[],
  htmlExcludes: string[],
  jsonDataPath: string,
  indicatorStart: string | null,
  indicatorEnd: string | null,
  keepData: boolean,

  whiteListedPaths: string[],
  excludeAnyMatchRegex: string[],
) {
  // Read and merge the JSON data
  const jsonData = {};
  fs.readdirSync(jsonDataPath).forEach((file: string) => {
    const filePath = path.join(jsonDataPath, file);
    const fileData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    Object.assign(jsonData, fileData);
  });

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
        // check if file path is inclouded
        excludeAnyMatchRegex.forEach((excludeRegex) => {
          if (normalizePath(filePath).match(excludeRegex)) {
            return;
          }
        });
      }

      // Replace JSON keys in the file
      let fileContent = fs.readFileSync(filePath, "utf-8");
      const fileContentOriginal = fileContent;
      Object.keys(jsonData).forEach((key) => {
        let keyUse = escapeRegExp(key.slice(1).replace(/\\/g, ""));
        let regex;
        regex = new RegExp(`([\\s"'\\\`]|^)(${keyUse})(?=$|[\\s"'\\\`])`, 'g'); // match exact wording & avoid ` ' ""
        //@ts-ignore
        fileContent = fileContent.replace(regex, `$1` + jsonData[key].slice(1).replace(/\\/g, "")); // capture preceding space
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
      if (fileContentOriginal !== fileContent) {
        log("success", "Data obfuscated:", filePath);
        fs.writeFileSync(filePath, fileContent);
      }
    }
    if (!keepData) {
      if (fs.existsSync(jsonDataPath)) {
        fs.rmSync(jsonDataPath, { recursive: true });
        log("info", "Data removed:", jsonDataPath);
      }
    }
  };

  // Process all files in the directory
  replaceJsonKeysInFile(filesDir);
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

export { log, replaceJsonKeysInFiles, getFilenameFromPath, normalizePath };
