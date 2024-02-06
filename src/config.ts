import { type Options, type OptionalOptions } from "./types";

const defaultOptions: Options = {
    enable: true, // Enable or disable the plugin.
    mode: "random", // Obfuscate mode, "random" or "simplify".
    buildFolderPath: ".next", // Build folder of your project.
    classConversionJsonFolderPath: "./css-obfuscator", // The folder path to store the before obfuscate and after obfuscated classes conversion table.
    refreshClassConversionJson: false, // Refresh the class conversion JSON file.

    classLength: 5, // Length of the obfuscated class name.
    classPrefix: "", // Prefix of the obfuscated class name.
    classSuffix: "", // Suffix of the obfuscated class name.
    classIgnore: [], // The class names to be ignored during obfuscation.
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
    generatorSeed: "-1", // The seed for the random generator. "-1" means use random seed.
    logLevel: "info", // Log level
};

class Config {
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