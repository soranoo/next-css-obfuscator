import type { obfuscateMode } from "../types";
import type { ConversionTables, TransformProps } from "css-seasoning";

import path from "node:path";
import fs from "node:fs";
import { initTransform, transform } from "css-seasoning";
import lightningcssInit, { transform as lightningcssTransform } from "lightningcss-wasm";

// TODO: html failed with .

import {
  log,
  findAllFilesWithExt,
  getFilenameFromPath,
  stringToNumber,
  loadConversionTables,
} from "../utils";


const obfuscateCss = ({
  cssPath,
  removeOriginalCss,
  isFullObfuscation,
  outCssPath,
  conversionTables,

  mode = "random",
  prefix,
  suffix,
  ignorePatterns,
  generatorSeed = Math.random().toString().slice(2, 10), // take 8 digits from the random number
}: {
  cssPath: string,
  removeOriginalCss?: boolean,
  isFullObfuscation?: boolean,
  outCssPath?: string,
  conversionTables?: ConversionTables,

  mode?: obfuscateMode,
  prefix?: string,
  suffix?: string,
  ignorePatterns?: TransformProps["ignorePatterns"],
  generatorSeed?: string,
}) => {
  if (!outCssPath) {
    // If no output path is provided, use the input path
    outCssPath = cssPath;
  } else if (!fs.existsSync(path.dirname(outCssPath))) {
    // Create the output directory if it doesn't exist
    fs.mkdirSync(path.dirname(outCssPath));
  }

  const cssContent = fs.readFileSync(cssPath, "utf-8");

  let transformerMode: TransformProps["mode"] = mode === "simplify" ? "minimal" : "hash";
  if (!transformerMode) {
    // @ts-expect-error - "simplify-seedable" is deprecated but for backward compatibility
    if (mode === "simplify-seedable") {
      log("warn", "CSS obfuscation", "The 'simplify-seedable' mode is deprecated, please use 'random' or 'simplify' instead. Now will fall back to 'random' mode.");
      transformerMode = "hash";
    }
    log("error", "CSS obfuscation", `Invalid mode: ${mode}`);
    throw new Error(`Invalid mode: ${mode}`);
  }

  let finCss = "";
  const { css: obfuscatedCss, conversionTables: newConversionTables } = transform({
    css: cssContent,
    conversionTables: conversionTables,
    mode: transformerMode,
    prefix: prefix,
    suffix: suffix,
    seed: stringToNumber(generatorSeed),
    ignorePatterns: ignorePatterns,
  });

  if (removeOriginalCss) {
    finCss = obfuscatedCss;
  } else {
    // if keep original selector, we need to merge the original css with the obfuscated css
    // then minify the css in order to marge the css
    const mixedCss = cssContent + obfuscatedCss;
    const { code } = lightningcssTransform({
      filename: "style.css",
      code: new TextEncoder().encode(mixedCss),
      minify: true,
    });
    finCss = new TextDecoder().decode(code);
  }

  const totalConversion = Object.keys(newConversionTables.selectors).length + Object.keys(newConversionTables.idents).length;
  if (removeOriginalCss) {
    log("info", "CSS rules:", `Modified ${totalConversion} CSS rules to ${getFilenameFromPath(cssPath)}`);
  } else {
    const oldTotalConversion = conversionTables ? Object.keys(conversionTables.selectors).length + Object.keys(conversionTables.idents).length : 0;
    log("info", "CSS rules:", `Added ${totalConversion - oldTotalConversion} new CSS rules to ${getFilenameFromPath(cssPath)}`);
  }

  // Save the obfuscated CSS to the output path
  const sizeBefore = Buffer.byteLength(cssContent, "utf8");
  fs.writeFileSync(outCssPath, obfuscatedCss);
  const sizeAfter = Buffer.byteLength(obfuscatedCss, "utf8");
  const percentChange = Math.round(((sizeAfter) / sizeBefore) * 100);
  log("success", "CSS obfuscated:", `Size from ${sizeBefore} to ${sizeAfter} bytes (${percentChange}%) in ${getFilenameFromPath(cssPath)}`);

  return {
    conversionTables: newConversionTables,
  }
}

/**
 * 
 */
export const obfuscateCssFiles = async ({
  selectorConversionJsonFolderPath,
  buildFolderPath,
  whiteListedFolderPaths = [],
  blackListedFolderPaths = [],
  mode = "random",
  prefix,
  suffix,
  ignorePatterns,
  generatorSeed = new Date().getTime().toString(),
  removeOriginalCss = false,
}: {
  selectorConversionJsonFolderPath: string,
  buildFolderPath: string,
  whiteListedFolderPaths: (string | RegExp)[],
  blackListedFolderPaths: (string | RegExp)[],
  mode?: obfuscateMode,
  prefix?: string,
  suffix?: string,
  ignorePatterns?: TransformProps["ignorePatterns"],
  generatorSeed?: string,
  removeOriginalCss?: boolean,
}) => {
  // Initialize nessesary modules
  await Promise.all([
    initTransform(),
    lightningcssInit(),
  ]);

  // Create the selector conversion JSON folder if it doesn't exist
  if (!fs.existsSync(selectorConversionJsonFolderPath)) {
    fs.mkdirSync(selectorConversionJsonFolderPath);
  }

  // Load and merge all JSON files in the selector conversion folder
  const conversionTables = loadConversionTables(selectorConversionJsonFolderPath);

  // Get all CSS files using the unified path filtering function
  const cssPaths = findAllFilesWithExt(".css", buildFolderPath, {
    whiteListedFolderPaths,
    blackListedFolderPaths,
  });

  const tables: ConversionTables = {
    selectors: {},
    idents: {},
  };

  cssPaths.forEach(async (cssPath) => {
    const { conversionTables: newConversionTables } = await obfuscateCss({
      cssPath: cssPath,
      conversionTables: conversionTables,

      prefix,
      suffix,
      mode,
      ignorePatterns,
      generatorSeed,
      removeOriginalCss,
    });

    // Merge the conversion tables
    Object.entries(newConversionTables.selectors).forEach(([key, value]) => {
      if (!tables.selectors[key]) {
        // If it doesn't exist, create a new entry
        tables.selectors[key] = value;
      }
    });
    Object.entries(newConversionTables.idents).forEach(([key, value]) => {
      if (!tables.idents[key]) {
        // If it doesn't exist, create a new entry
        tables.idents[key] = value;
      }
    });
  });

  return {
    conversionTables: tables,
  };
}
