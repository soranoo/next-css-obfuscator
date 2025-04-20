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

/**
 * 
 * @deprecated will be replaced by new css transformer
 */
export function createSelectorConversionJson(
    {
        selectorConversionJsonFolderPath,
        buildFolderPath,

        mode = "random",
        classNameLength = 5,
        classPrefix = "",
        classSuffix = "",
        classIgnore = [],

        enableObfuscateMarkerClasses = false,
        generatorSeed = Math.random().toString().slice(2, 10), // take 8 digits from the random number
    }: {
        selectorConversionJsonFolderPath: string,
        buildFolderPath: string,

        mode?: obfuscateMode,
        classNameLength?: number,
        classPrefix?: string,
        classSuffix?: string,
        classIgnore?: (string | RegExp)[],

        enableObfuscateMarkerClasses?: boolean,
        generatorSeed?: string,
    }) {
    // if (!fs.existsSync(selectorConversionJsonFolderPath)) {
    //     fs.mkdirSync(selectorConversionJsonFolderPath);
    // }

    // const selectorConversion = loadConversionTables(selectorConversionJsonFolderPath);

    // // pre-defined ".dark", mainly for tailwindcss dark mode
    // if (enableObfuscateMarkerClasses) {
    //     selectorConversion[".dark"] = ".dark";
    // }

    // // get all css selectors
    // const cssPaths = findAllFilesWithExt(".css", buildFolderPath);
    // const selectors: string[] = [];
    // cssPaths.forEach((cssPath) => {
    //     const cssContent = fs.readFileSync(cssPath, "utf-8");
    //     const cssObj = css.parse(cssContent);
    //     selectors.push(...getAllSelector(cssObj));
    // });

    // // remove duplicated selectors
    // const uniqueSelectors = [...new Set(selectors)];

    // const allowClassStartWith = [".", "#", ":is(", ":where(", ":not("
    //     , ":matches(", ":nth-child(", ":nth-last-child("
    //     , ":nth-of-type(", ":nth-last-of-type(", ":first-child("
    //     , ":last-child(", ":first-of-type(", ":last-of-type("
    //     , ":only-child(", ":only-of-type(", ":empty(", ":link("
    //     , ":visited(", ":active(", ":hover(", ":focus(", ":target("
    //     , ":lang(", ":enabled(", ":disabled(", ":checked(", ":default("
    //     , ":indeterminate(", ":root(", ":before("
    //     , ":after(", ":first-letter(", ":first-line(", ":selection("
    //     , ":read-only(", ":read-write(", ":fullscreen(", ":optional("
    //     , ":required(", ":valid(", ":invalid(", ":in-range(", ":out-of-range("
    //     , ":placeholder-shown("
    // ];

    // const selectorClassPair: { [key: string]: string[] } = {};

    // for (let i = 0; i < uniqueSelectors.length; i++) {
    //     const originalSelector = uniqueSelectors[i];
    //     const { extractedClasses } = extractClassFromSelector(originalSelector) || [];
    //     selectorClassPair[originalSelector] = extractedClasses;
    // }

    // //? since a multi part selector normally grouped by multiple basic selectors
    // //? so we need to obfuscate the basic selector first
    // //? eg. ":is(.class1 .class2)" grouped by ".class1" and ".class2"
    // // sort the selectorClassPair by the number of classes in the selector (from least to most)
    // // and remove the selector with no class
    // const sortedSelectorClassPair = Object.entries(selectorClassPair)
    //     .sort((a, b) => a[1].length - b[1].length)
    //     .filter((pair) => pair[1].length > 0);

    // for (let i = 0; i < sortedSelectorClassPair.length; i++) {
    //     const [originalSelector, selectorClasses] = sortedSelectorClassPair[i];
    //     if (selectorClasses.length == 0) {
    //         continue;
    //     }

    //     let selector = originalSelector;
    //     let classes = selectorClasses;

    //     if (classes && allowClassStartWith.some((start) => selector.startsWith(start))) {
    //         classes = classes.map((className) => {

    //             // apply ignore list
    //             if (classIgnore.some(regex => {
    //                 if (typeof regex === "string") {
    //                     return className === regex;
    //                 }
    //                 return new RegExp(regex).test(className)
    //             })) {
    //                 return className;
    //             }

    //             // try to get the obfuscated selector from the selectorConversion
    //             // if not found, create a new one
    //             let obfuscatedSelector = selectorConversion[`.${className}`];
    //             if (!obfuscatedSelector) {
    //                 const obfuscatedClass = createNewClassName(mode, className, classPrefix, classSuffix, classNameLength, generatorSeed);
    //                 obfuscatedSelector = `.${obfuscatedClass}`;
    //                 selectorConversion[`.${className}`] = obfuscatedSelector;
    //             }

    //             // return the obfuscated class
    //             return obfuscatedSelector.slice(1)
    //         });

    //         // obfuscate the selector
    //         const { selector: obfuscatedSelector } = extractClassFromSelector(originalSelector, classes);

    //         selectorConversion[originalSelector] = obfuscatedSelector;
    //     }
    // }

    // const jsonPath = path.join(process.cwd(), selectorConversionJsonFolderPath, "conversion.json");
    // fs.writeFileSync(jsonPath, JSON.stringify(selectorConversion, null, 2));
    // if (duplicationCheck(Object.keys(selectorConversion))) {
    //     if (mode == "random") {
    //         log("error", "Obfuscation", "Duplicated class names found in the conversion JSON, try to increase the class name length / open an issue on GitHub https://github.com/soranoo/next-css-obfuscator/issues");
    //     } else {
    //         log("error", "Obfuscation", "Duplicated class names found in the conversion JSON, please open an issue on GitHub https://github.com/soranoo/next-css-obfuscator/issues");
    //     }
    // }
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

/**
 * 
 * @deprecated WIP
 */
export const obfuscateCss = async ({
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

// export const obfuscateCss = async (
//     selectorConversion: ConversionTable,
//     cssPath: string,
//     replaceOriginalSelector = false,
//     isFullObfuscation = false,
//     outCssPath?: string,
// ) => {
//     if (!outCssPath) {
//         outCssPath = cssPath;
//     } else if (!fs.existsSync(path.dirname(outCssPath))) {
//         fs.mkdirSync(path.dirname(outCssPath));
//     }

//     const cssContent = fs.readFileSync(cssPath, "utf-8");

//     let cssObj = css.parse(cssContent);
//     const cssRulesCount = cssObj.stylesheet.rules.length;

//     if (isFullObfuscation) {
//         Object.keys(selectorConversion).forEach((key) => {
//             usedKeyRegistery.add(key);
//         });
//     } else {
//         // join all selectors start with ":" (eg. ":is")
//         Object.keys(selectorConversion).forEach((key) => {
//             if (key.startsWith(":")) {
//                 usedKeyRegistery.add(key);
//             }
//         });

//         // join all selectors with action selectors
//         const actionSelectors = getAllSelector(cssObj).filter((selector) => selector.match(findActionSelectorsRegex));
//         actionSelectors.forEach((actionSelector) => {
//             usedKeyRegistery.add(actionSelector);
//         });

//         // join all Tailwind CSS [child] selectors (eg. ".\[\&_\.side-box\]\:absolute .side-box")
//         const tailwindCssChildSelectors = getAllSelector(cssObj).filter((selector) => selector.startsWith(".\\["));
//         tailwindCssChildSelectors.forEach((tailwindCssChildSelector) => {
//             usedKeyRegistery.add(tailwindCssChildSelector);
//         });

//         // join all child selectors (eg. ">*")
//         const universalSelectors = getAllSelector(cssObj).filter((selector) => selector.includes(">"));
//         universalSelectors.forEach((universalSelector) => {
//             usedKeyRegistery.add(universalSelector);
//         });
//     }

//     // modify css rules
//     usedKeyRegistery.forEach((key) => {
//         const originalSelectorName = key;
//         const obfuscatedSelectorName = selectorConversion[key];
//         if (obfuscatedSelectorName) {
//             if (replaceOriginalSelector) {
//                 cssObj = renameCssSelector(originalSelectorName, selectorConversion[key], cssObj);
//             } else {
//                 cssObj = copyCssData(originalSelectorName, selectorConversion[key], cssObj);
//             }
//         }
//     });

//     if (replaceOriginalSelector) {
//         log("info", "CSS rules:", `Modified ${usedKeyRegistery.size} CSS rules to ${getFilenameFromPath(cssPath)}`);
//     } else {
//         log("info", "CSS rules:", `Added ${cssObj.stylesheet.rules.length - cssRulesCount} new CSS rules to ${getFilenameFromPath(cssPath)}`);
//     }

//     const cssOptions = {
//         compress: true,
//     };
//     const cssObfuscatedContent = css.stringify(cssObj, cssOptions);

//     const sizeBefore = Buffer.byteLength(cssContent, "utf8");
//     fs.writeFileSync(outCssPath, cssObfuscatedContent);
//     const sizeAfter = Buffer.byteLength(cssObfuscatedContent, "utf8");
//     const percentChange = Math.round(((sizeAfter) / sizeBefore) * 100);
//     log("success", "CSS obfuscated:", `Size from ${sizeBefore} to ${sizeAfter} bytes (${percentChange}%) in ${getFilenameFromPath(cssPath)}`);
// }

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

    // get all css selectors
    const cssPaths = findAllFilesWithExt(".css", buildFolderPath, {
        blackListedFolderPaths: blackListedFolderPaths,
        whiteListedFolderPaths: whiteListedFolderPaths,
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
