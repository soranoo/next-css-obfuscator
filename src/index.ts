import fs from "fs";
import path from "path";
import yargs from "yargs";
import {
  log,
  replaceJsonKeysInFiles,
  setLogLevel,
  findAllFilesWithExt,
} from "./utils";

import { createSelectorConversionJson } from "./handlers/css";

import Config from "./config";
import { Options, OptionalOptions } from "./types";

function obfuscate(options: Options) {
  setLogLevel(options.logLevel);

  if (!options.enable) {
    log("info", "Obfuscation", "Obfuscation disabled");
    return;
  }

  const classConversionJsonPaths = findAllFilesWithExt(".json", options.classConversionJsonFolderPath);
  if (options.refreshClassConversionJson && classConversionJsonPaths.length > 0) {
    log("info", "Obfuscation", "Refreshing class conversion JSON");
    for (const jsonPath of classConversionJsonPaths) {
      fs.unlinkSync(jsonPath);
      log("success", "Obfuscation", `Deleted ${jsonPath}`);
    }
  }

  log("info", "Obfuscation", "Creating/Updating class conversion JSON");
  createSelectorConversionJson({
    selectorConversionJsonFolderPath: options.classConversionJsonFolderPath,
    buildFolderPath: options.buildFolderPath,

    mode: options.mode,
    classNameLength: options.classLength,
    classPrefix: options.classPrefix,
    classSuffix: options.classSuffix,
    classIgnore: options.classIgnore,

    enableObfuscateMarkerClasses: options.enableMarkers,
    generatorSeed: options.generatorSeed === "-1" ? undefined : options.generatorSeed,
  });
  log("success", "Obfuscation", "Class conversion JSON created/updated");

  if ((options.includeAnyMatchRegexes && options.includeAnyMatchRegexes.length > 0)
    || (options.excludeAnyMatchRegexes && options.excludeAnyMatchRegexes.length > 0)) {
    log("warn", "Obfuscation", "'includeAnyMatchRegexes' and 'excludeAnyMatchRegexes' are deprecated, please use whiteListedFolderPaths and blackListedFolderPaths instead");
  }

  replaceJsonKeysInFiles({
    targetFolder: options.buildFolderPath,
    allowExtensions: options.allowExtensions,
    selectorConversionJsonFolderPath: options.classConversionJsonFolderPath,

    contentIgnoreRegexes: options.contentIgnoreRegexes,

    whiteListedFolderPaths: [...options.whiteListedFolderPaths, ...(options.includeAnyMatchRegexes || [])],
    blackListedFolderPaths: [...options.blackListedFolderPaths, ...(options.excludeAnyMatchRegexes || [])],
    enableObfuscateMarkerClasses: options.enableMarkers,
    obfuscateMarkerClasses: options.markers,
    removeObfuscateMarkerClassesAfterObfuscated: options.removeMarkersAfterObfuscated,
    removeOriginalCss: options.removeOriginalCss,
  });
}

function obfuscateCli() {
  const argv = yargs.option("config", {
    alias: "c",
    type: "string",
    description: "Path to the config file"
  }).argv;

  let configPath;

  // @ts-ignore
  if (argv.config) {
    // @ts-ignore
    configPath = path.resolve(process.cwd(), argv.config);
  } else {
    const configFiles = [
      "next-css-obfuscator.config.ts",
      "next-css-obfuscator.config.cjs",
      "next-css-obfuscator.config.mjs",
      "next-css-obfuscator.config.js",
    ];

    for (const file of configFiles) {
      const potentialPath = path.join(process.cwd(), file);
      if (fs.existsSync(potentialPath)) {
        configPath = potentialPath;
        break;
      }
    }
  }

  const config = new Config(configPath ? require(configPath) : undefined).get();
  obfuscate(config);
  log("success", "Obfuscation", "Completed~");
  log("info", "Give me a ⭐️ on GitHub if you like this plugin", "https://github.com/soranoo/next-css-obfuscator");
}

export { obfuscateCli, type OptionalOptions as Options };
