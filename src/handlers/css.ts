import type { obfuscateMode, SelectorConversion } from "../types";

import path from "node:path";
import fs from "node:fs";
// @ts-ignore
import css from "css";
import NumberGenerator from "recoverable-random";
import { initTransform, transform, ConversionTable, cssEscape, type ConversionTables, type TransformProps } from "css-seasoning";
import lightningcssInit, { transform as lightningcssTransform } from "lightningcss-wasm";

import {
    log,
    getRandomString,
    seedableSimplifyString,
    simplifyString,
    loadAndMergeJsonFiles,
    findAllFilesWithExt,
    usedKeyRegistery,
    getFilenameFromPath,
    duplicationCheck,
    createKey,
    decodeKey,
    stringToNumber,
    loadConversionTables,
} from "../utils";

let randomStringGeneraterStateCode: string | undefined = undefined;
let currentAlphabetPoistion = 1;
function createNewClassName(
    mode: obfuscateMode,
    className: string,
    classPrefix: string = "",
    classSuffix: string = "",
    classNameLength: number = 5,
    seed: string = Math.random().toString()
) {
    let newClassName = className;

    let { rngStateCode, randomString }: { rngStateCode: string, randomString: string } = { rngStateCode: "", randomString: "" };

    //? Based on the mechanism behind `recoverable-random` library
    //? `stateCode` is directly equivalent to the `seed`
    //? so recover the stateCode is the same as setting the seed
    //? so the seed input `seedableSimplifyString`
    //? in the following usage is meaningless
    //? :)

    switch (mode) {
        case "random":
            ({ rngStateCode, randomString } = getRandomString(classNameLength, seed, undefined, className));
            break;
        // case "simplify-seedable":
        //     ({ rngStateCode, randomString } = seedableSimplifyString(className, seed, seed + NumberGenerator.stringToSeed(className).toString()));
        //     break;
        case "simplify":
            randomString = simplifyString(currentAlphabetPoistion);
            currentAlphabetPoistion++;
            break;
        default:
            break;
    }

    newClassName = randomString;
    randomStringGeneraterStateCode = rngStateCode;

    if (classPrefix) {
        newClassName = `${classPrefix}${newClassName}`;
    }
    if (classSuffix) {
        newClassName = `${newClassName}${classSuffix}`;
    }

    return newClassName;
}

//? CSS action selectors always at the end of the selector
//? and they can be stacked, eg. "class:hover:active"
//? action selectors can start with ":" or "::"
const findActionSelectorsRegex = /(?<!\\)(?:\:\w[\w-]+)(?=\:|\)|\s|\(|$|"|{|>)/g;

/**
 * Extracts classes from a CSS selector.
 * 
 * @param selector - The CSS selector to extract classes from.
 * @param replacementClassNames - The replacement class names. 
 *                                The position of the class name in the array should match the 
 *                                position of the class in the selector that you want to replece.
 * @returns An array of extracted classes.
 * 
 * @example
 * // Returns: ["some-class", "some-class", "bg-white", "some-class", "bg-dark"]
 * extractClassFromSelector(":is(.some-class .some-class\\:!bg-white .some-class\\:bg-dark::-moz-placeholder)[data-active=\'true\']");
 * 
 * @example
 * // Returns: []
 * extractClassFromSelector("div");
 */
export function extractClassFromSelector(selector: string, replacementClassNames?: (string | undefined)[]) {
    //? "\\[\w\%\:\.\!\*\<\>\/]" handle escaped characters
    //? "(?:\\\[(?:[^\[\]\s])*\\\]))+)" handle [attribute / Tailwind CSS custom parameter] selector
    const extractClassRegex = /(?<=[.:!]|(?<!\w)\.-)((?:[\w\-]|\\[\w\%\:\.\!\*\<\>\/]|(?:\\\[(?:[^\[\]\s])*\\\]))+)(?![\w\-]*\()/g;

    const vendorPseudoClassRegexes = [
        /::?-moz-[\w-]+/g, // Firefox
        /::?-ms-[\w-]+/g,  // Internet Explorer, Edge
        /::?-webkit-[\w-]+/g, // Safari, Chrome, and Opera
        /::?-o-[\w-]+/g, // Opera (old ver)
    ]

    // temporary remove action selectors
    selector = selector.replace(findActionSelectorsRegex, (match) => {
        return createKey(match);
    });

    // temporary remove vendor pseudo classes
    vendorPseudoClassRegexes.forEach((regex, i) => {
        selector = selector.replace(regex, (match) => {
            return createKey(match);
        });
    });

    // extract classes
    let classes = selector.match(extractClassRegex) as string[] | undefined;

    // replace classes with replacementClassNames
    if (replacementClassNames !== undefined) {
        selector = selector.replace(extractClassRegex, (originalClassName) => {
            return replacementClassNames.shift() || originalClassName;
        });
    }

    // place back the pseudo classes
    selector = decodeKey(selector);

    return {
        selector: selector,
        extractedClasses: classes || []
    };
}

function getAllSelector(cssObj: any): any[] {
    const selectors: string[] = [];
    function recursive(rules: any[]) {
        for (const item of rules) {
            if (item.rules) {
                recursive(item.rules);
            } else if (item.selectors) {
                // remove empty selectors
                item.selectors = item.selectors.filter((selector: any) => selector !== "");

                selectors.push(...item.selectors);
            }
        }
        return null;
    }
    recursive(cssObj.stylesheet.rules);
    return selectors;
}

export function copyCssData(targetSelector: string, newSelectorName: string, cssObj: any) {
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

                // check if the selector is the target selector
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

export function renameCssSelector(oldSelector: string, newSelector: string, cssObj: any) {
    function recursive(rules: any[]): any[] {
        return rules.map((item: any) => {
            if (item.rules) {
                return { ...item, rules: recursive(item.rules) };
            } else if (item.selectors) {
                // remove empty selectors
                item.selectors = item.selectors.filter((selector: any) => selector !== "");

                let updatedSelectors = item.selectors.map((selector: any) =>
                    selector === oldSelector ? newSelector : selector
                );

                return { ...item, selectors: updatedSelectors };
            } else {
                return item;
            }
        });
    }

    cssObj.stylesheet.rules = recursive(cssObj.stylesheet.rules);
    return cssObj;
}


const obfuscateCss = async ({
    cssPath,
    removeOriginalCss,
    isFullObfuscation,
    outCssPath,
    conversionTables,

    mode = "random",
    prefix,
    suffix,
    classIgnore = [],
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
    classIgnore?: (string | RegExp)[],
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

    // TODO: use const instead of function
    // TODO: this function is combined createSelectorConversionJson and obfuscateCss
    // TODO: connect props to this function
    // TODO: bc we updated conversion table, so other function using the table have to update to the new table

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
        ignorePatterns: {
            selector: classIgnore
        }
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

    const totalConversion = Object.keys(newConversionTables.selector).length + Object.keys(newConversionTables.ident).length;
    if (removeOriginalCss) {
        log("info", "CSS rules:", `Modified ${totalConversion} CSS rules to ${getFilenameFromPath(cssPath)}`);
    } else {
        const oldTotalConversion = conversionTables ? Object.keys(conversionTables.selector).length + Object.keys(conversionTables.ident).length : 0;
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
    classIgnore = [],
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
    classIgnore?: (string | RegExp)[],
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
        selector: {},
        ident: {},
    };
    
    cssPaths.forEach(async (cssPath) => {
        const { conversionTables: newConversionTables } = await obfuscateCss({
            cssPath: cssPath,
            conversionTables: conversionTables,

            prefix,
            suffix,
            mode,
            classIgnore,
            generatorSeed,
            removeOriginalCss,
        });

        // Merge the conversion tables
        Object.entries(newConversionTables.selector).forEach(([key, value]) => {
            if (!tables.selector[key]) {
                // If it doesn't exist, create a new entry
                tables.selector[key] = value;
            }
        });
        Object.entries(newConversionTables.ident).forEach(([key, value]) => {
            if (!tables.ident[key]) {
                // If it doesn't exist, create a new entry
                tables.ident[key] = value;
            }
        });
    });

    return {
        conversionTables: tables,
    };
}
