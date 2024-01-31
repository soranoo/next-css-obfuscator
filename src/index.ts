import fs from "fs";
import path from "path";
import yargs from "yargs";
import {
  log,
  replaceJsonKeysInFiles,
  setLogLevel,
  createClassConversionJson,
  findAllFilesWithExt,
} from "./utils";

import Config from "./config";
import { Options, OptionalOptions } from "./type";

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
  createClassConversionJson({
    classConversionJsonFolderPath: options.classConversionJsonFolderPath,
    buildFolderPath: options.buildFolderPath,

    mode: options.mode,
    classNameLength: options.classLength,
    classPrefix: options.classPrefix,
    classSuffix: options.classSuffix,
    classIgnore: options.classIgnore,

    enableObfuscateMarkerClasses: options.enableMarkers,
  });
  log("success", "Obfuscation", "Class conversion JSON created/updated");

  replaceJsonKeysInFiles({
    targetFolder: options.buildFolderPath,
    allowExtensions: options.allowExtensions,
    classConversionJsonFolderPath: options.classConversionJsonFolderPath,

    contentIgnoreRegexes: options.contentIgnoreRegexes,

    whiteListedFolderPaths: options.whiteListedFolderPaths,
    blackListedFolderPaths: options.blackListedFolderPaths,
    includeAnyMatchRegexes: options.includeAnyMatchRegexes,
    excludeAnyMatchRegexes: options.excludeAnyMatchRegexes,
    enableObfuscateMarkerClasses: options.enableMarkers,
    obfuscateMarkerClasses: options.markers,
    removeObfuscateMarkerClassesAfterObfuscated: options.removeMarkersAfterObfuscated,
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
  log("success", "Obfuscation", "Obfuscation complete");
}

export { obfuscateCli, type OptionalOptions as Options };
