import fs from 'fs';
import path from 'path';
import {
  getFilenameFromPath,
  log,
  normalizePath,
  replaceJsonKeysInFiles,
  setLogLevel,
  type LogType,
} from './utils';

let postcssConfigPath = path.join(process.cwd(), 'postcss.config.cjs');
if (!fs.existsSync(postcssConfigPath)) {
  postcssConfigPath = path.join(process.cwd(), 'postcss.config.js');
}
// load config from postcss.config.cjs
const postcssConfig = require(postcssConfigPath);
const obfuscatorConfig =
  postcssConfig.plugins['next-css-obfuscator/patched-postcss-obfuscator'];
const config_JsonsPath = obfuscatorConfig.jsonsPath || './css-obfuscator';
const config_HtmlExcludes = obfuscatorConfig.htmlExcludes || [];
const config_IndicatorStart = obfuscatorConfig.indicatorStart || null;
const config_IndicatorEnd = obfuscatorConfig.indicatorEnd || null;

const config_WhiteListedPaths = obfuscatorConfig.whiteListedPaths || [];
const config_BlackListedPaths = obfuscatorConfig.blackListedPaths || [];
const config_ExcludeAnyMatchRegex = obfuscatorConfig.excludeAnyMatchRegex || [];

const config_enableObfuscateMarkerClasses =
  obfuscatorConfig.enableObfuscateMarkerClasses || false;
const config_obfuscateMarkerClasses =
  obfuscatorConfig.obfuscateMarkerClasses || ['next-css-obfuscation'];
const config_removeObfuscateMarkerClasses =
  obfuscatorConfig.removeObfuscateMarkerClasses;
const config_logLevel: LogType = obfuscatorConfig.logLevel || 'info';

const BUILD_FODLER_PATH = '.next';
const TEMP_CSS_FODLER = './temp-css';

setLogLevel(config_logLevel);

/**
 * Find all files with the specified extension in the build folder
 * @param ext - the extension of the files to find (e.g. .css) "." is required
 * @returns - an array of file relative paths
 */
function findAllFilesWithExt(ext: string): string[] {
  const targetExtFiles: string[] = [];

  function findCssFiles(dir: string) {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const filePath = normalizePath(path.join(dir, file));

      if (fs.statSync(filePath).isDirectory()) {
        // if it"s a directory, recursively search for CSS files
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
  findCssFiles(BUILD_FODLER_PATH);

  return targetExtFiles;
}

/**
 * Find the path of a file with the specified name
 * @param filename - the filename to search for
 * @param ext - the extension of the file to search for (e.g. .css) "." is required
 * @returns - the relative path of the file
 */
function findFilePath(filename: string, ext: string): string | undefined {
  const paths = findAllFilesWithExt(ext);
  const result = paths.filter((path) => path.includes(filename));
  if (result.length === 0) {
    log('error', 'Searching File', `No file found with name ${filename}`);
    return undefined;
  }
  return result[0];
}

function copyCssToTempFolder() {
  // check if the temp css folder exists, if not create it
  if (!fs.existsSync(TEMP_CSS_FODLER)) {
    fs.mkdirSync(TEMP_CSS_FODLER);
  }

  // find all the css files in the build folder
  let cssFilePaths = findAllFilesWithExt('.css');
  // copy the files to the temp folder
  cssFilePaths.forEach((filePath) => {
    fs.copyFileSync(
      filePath,
      path.join(TEMP_CSS_FODLER, getFilenameFromPath(filePath)),
    );
  });
}

function moveCssBackToOriginalPath() {
  // obfuscate the build files
  replaceJsonKeysInFiles(
    BUILD_FODLER_PATH,
    obfuscatorConfig.extensions,
    config_HtmlExcludes,
    config_JsonsPath,
    config_IndicatorStart,
    config_IndicatorEnd,
    true,
    config_WhiteListedPaths,
    config_BlackListedPaths,
    config_ExcludeAnyMatchRegex,
    config_enableObfuscateMarkerClasses,
    config_obfuscateMarkerClasses,
    config_removeObfuscateMarkerClasses,
  );

  // remove the temp folder
  fs.rmSync(TEMP_CSS_FODLER, { recursive: true });
}

function part1() {
  copyCssToTempFolder();
}
function part2() {
  moveCssBackToOriginalPath();
  log('success', 'Obfuscation', 'Obfuscation complete');
}

export { part1, part2 };
