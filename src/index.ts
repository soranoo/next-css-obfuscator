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
import { createSelectorConversionJson, obfuscateCss, obfuscateCssFiles } from "./handlers/css";
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
    whiteListedFolderPaths: [...options.whiteListedFolderPaths, ...(options.includeAnyMatchRegexes || [])],
    blackListedFolderPaths: [...options.blackListedFolderPaths, ...(options.excludeAnyMatchRegexes || [])],

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

  // createSelectorConversionJson({
  //   selectorConversionJsonFolderPath: options.classConversionJsonFolderPath,
  //   buildFolderPath: options.buildFolderPath,

  //   mode: options.mode,
  //   classNameLength: options.classLength,
  //   classPrefix: options.classPrefix,
  //   classSuffix: options.classSuffix,
  //   classIgnore: options.classIgnore,

  //   enableObfuscateMarkerClasses: options.enableMarkers,
  //   generatorSeed: options.generatorSeed === "-1" ? undefined : options.generatorSeed,
  // });
  log("success", "Obfuscation", "Class conversion JSON created/updated");

  if ((options.includeAnyMatchRegexes && options.includeAnyMatchRegexes.length > 0)
    || (options.excludeAnyMatchRegexes && options.excludeAnyMatchRegexes.length > 0)) {
    log("warn", "Obfuscation", "'includeAnyMatchRegexes' and 'excludeAnyMatchRegexes' are deprecated, please use whiteListedFolderPaths and blackListedFolderPaths instead");
  }

  replaceJsonKeysInFiles({
    conversionTables: conversionTables,
    targetFolder: options.buildFolderPath,
    allowExtensions: options.allowExtensions,

    contentIgnoreRegexes: options.contentIgnoreRegexes,

    whiteListedFolderPaths: [...options.whiteListedFolderPaths, ...(options.includeAnyMatchRegexes || [])],
    blackListedFolderPaths: [...options.blackListedFolderPaths, ...(options.excludeAnyMatchRegexes || [])],
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
