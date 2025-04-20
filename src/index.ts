import type { Options, OptionalOptions } from "./types";

import fs from "node:fs";
import path from "node:path";
import yargs from "yargs";
import {
  log,
  replaceJsonKeysInFiles,
  setLogLevel,
  findAllFilesWithExt,
  getFilenameFromPath,
} from "./utils";
import { obfuscateCssFiles } from "./handlers/css";
import Config from "./config";

const obfuscate = async (options: Options) => {
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

  // Create conversion tables and obfuscate CSS files
  const { conversionTables } = await obfuscateCssFiles({
    selectorConversionJsonFolderPath: options.classConversionJsonFolderPath,
    buildFolderPath: options.buildFolderPath,
    whiteListedFolderPaths: options.whiteListedFolderPaths,
    blackListedFolderPaths: options.blackListedFolderPaths,

    mode: options.mode,
    prefix: options.classPrefix,
    suffix: options.classSuffix,
    classIgnore: options.classIgnore,

    generatorSeed: options.generatorSeed,
    removeOriginalCss: options.removeOriginalCss,
  });

  // Save the conversion table to a JSON file
  const jsonPath = path.join(process.cwd(), options.classConversionJsonFolderPath, "conversion.json");
  console.log({ jsonPath });
  fs.writeFileSync(jsonPath, JSON.stringify(conversionTables, null, 2));
  log("success", "CSS obfuscation:", `Saved conversion table to ${getFilenameFromPath(jsonPath)}`);

  // Use the same unified paths for replacing JSON keys in files
  replaceJsonKeysInFiles({
    conversionTables: conversionTables,
    targetFolder: options.buildFolderPath,
    allowExtensions: options.allowExtensions,

    contentIgnoreRegexes: options.contentIgnoreRegexes,

    whiteListedFolderPaths: options.whiteListedFolderPaths,
    blackListedFolderPaths: options.blackListedFolderPaths,
    enableObfuscateMarkerClasses: options.enableMarkers,
    obfuscateMarkerClasses: options.markers,
    removeObfuscateMarkerClassesAfterObfuscated: options.removeMarkersAfterObfuscated,

    enableJsAst: options.enableJsAst,
  });
}

export const obfuscateCli = async () => {
  const argv = yargs.option("config", {
    alias: "c",
    type: "string",
    description: "Path to the config file"
  }).argv;

  let configPath: string | undefined = undefined;

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
  await obfuscate(config);
  log("success", "Obfuscation", "Completed~");
}

export { type OptionalOptions as Options };
