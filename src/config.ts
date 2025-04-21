import type { OptionalOptions, Options } from "./types";

export const defaultOptions: Options = {
  enable: true, // Enable or disable the plugin.
  mode: "random", // Obfuscate mode, "random", "simplify" or "simplify-seedable".
  buildFolderPath: ".next", // Build folder of your project.
  classConversionJsonFolderPath: "./css-obfuscator", // The folder path to store the before obfuscate and after obfuscated classes conversion table.
  refreshClassConversionJson: false, // Refresh the class conversion JSON file.

  /**
   * @deprecated Not longer used from v3.0.0 and will be removed in the next major version.
   */
  classLength: 5, // Length of the obfuscated class name.

  /**
   * @deprecated Merged into `prefix` from v3.0.0 and will be removed in the next major version.
   */
  classPrefix: "", // Prefix of the obfuscated class name.

  /**
   * @deprecated Merged into `suffix` from v3.0.0 and will be removed in the next major version.
   */
  classSuffix: "", // Suffix of the obfuscated class name.

  prefix: "", // Prefix of the obfuscated class and ident name.
  suffix: "", // Suffix of the obfuscated class and ident name.

  /**
   * @deprecated Merged into `ignorePatterns.selectors` from v3.0.0 and will be removed in the next major version.
   */
  classIgnore: [], // The class names to be ignored during obfuscation.
  ignorePatterns: {
    // The patterns to be ignored during obfuscation.
    selectors: [], // The selectors to be ignored during obfuscation.
    idents: [], // The idents to be ignored during obfuscation.
  },

  allowExtensions: [".jsx", ".tsx", ".js", ".ts", ".html", ".rsc"], // The file extensions to be processed.
  contentIgnoreRegexes: [
    /\.jsxs\)\("\w+"/g, // avoid accidentally obfuscate the HTML tag
  ], // The regexes to match the file content to be ignored during obfuscation.

  whiteListedFolderPaths: [], // Only obfuscate files in these folders
  blackListedFolderPaths: ["./.next/cache"], // Don't obfuscate files in these folders
  enableMarkers: false, // Enable or disable the obfuscate marker classes.
  markers: ["next-css-obfuscation"], // Classes that indicate component(s) need to obfuscate.
  removeMarkersAfterObfuscated: true, // Remove the obfuscation markers from HTML elements after obfuscation.
  removeOriginalCss: false, // Delete original CSS from CSS files if it has a obfuscated version.
  generatorSeed: undefined, // The seed for the random generator. "undefined" means use random seed.

  /**
   * Experimental feature
   */
  enableJsAst: true, // Whether to obfuscate JS files using abstract syntax tree parser. (Experimental feature)

  logLevel: "info", // Log level
};

export class Config {
  private options: Options;

  constructor(options?: OptionalOptions) {
    if (!options) {
      this.options = defaultOptions;
      return;
    }
    this.options = {
      ...defaultOptions,
      ...options,
    };
  }

  public get(): Options {
    return this.options;
  }
}

export default Config;
