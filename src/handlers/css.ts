import path from "path";
import fs from "fs";
// @ts-ignore
import css from 'css';
import NumberGenerator from "recoverable-random";

import {
    log,
    getRandomString,
    simplifyString,
    loadAndMergeJsonFiles,
    findAllFilesWithExt,
    usedKeyRegistery,
    getFilenameFromPath,
    duplicationCheck,
} from "../utils";
import { obfuscateMode, SelectorConversion } from "../types";

let randomStringGeneraterStateCode: string | undefined = undefined;
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
    //? so the seed input `simplifyString`
    //? in the following usage is meaningless
    //? :)

    switch (mode) {
        case "random":
            ({ rngStateCode, randomString } = getRandomString(classNameLength, seed, undefined, className));
            break;
        case "simplify":
            ({ rngStateCode, randomString } = simplifyString(className, seed, seed + NumberGenerator.stringToSeed(className).toString()));
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
const findActionSelectorsRegex = /(?<!\\)(?:\:\w[\w-]+)(?=\:|\)|\s|\(|$|"|{)/g;

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
function extractClassFromSelector(selector: string, replacementClassNames?: (string | undefined)[]) {
    function toBase64Key(str: string) {
        return `${Buffer.from(str).toString("base64")}`;
    }
    function fromBase64Key(str: string) {
        return `${Buffer.from(str, "base64").toString("ascii")}`;
    }

    function createKey(str: string) {
        const b64 = toBase64Key(str).replace(/=/g, "");
        return `{{{{{{${b64}}}}}}}`;
    }

    function decodeKey(str: string) {
        const regex = /{{{{{{([\w\+\/]+)}}}}}}/g;
        str = str.replace(regex, (match, p1) => {
            // Calculate the number of '=' needed
            const padding = p1.length % 4 === 0 ? 0 : 4 - (p1.length % 4);
            // Add back the '='
            const b64 = p1 + "=".repeat(padding);
            return fromBase64Key(b64);
        });
        return str;
    }

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

function createSelectorConversionJson(
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
    if (!fs.existsSync(selectorConversionJsonFolderPath)) {
        fs.mkdirSync(selectorConversionJsonFolderPath);
    }

    const selectorConversion: SelectorConversion = loadAndMergeJsonFiles(selectorConversionJsonFolderPath);

    // pre-defined ".dark", mainly for tailwindcss dark mode
    if (enableObfuscateMarkerClasses) {
        selectorConversion[".dark"] = ".dark";
    }

    // get all css selectors
    const cssPaths = findAllFilesWithExt(".css", buildFolderPath);
    const selectors: string[] = [];
    cssPaths.forEach((cssPath) => {
        const cssContent = fs.readFileSync(cssPath, "utf-8");
        const cssObj = css.parse(cssContent);
        selectors.push(...getAllSelector(cssObj));
    });

    // remove duplicated selectors
    const uniqueSelectors = [...new Set(selectors)];

    const allowClassStartWith = [".", ":is(", ":where(", ":not("
        , ":matches(", ":nth-child(", ":nth-last-child("
        , ":nth-of-type(", ":nth-last-of-type(", ":first-child("
        , ":last-child(", ":first-of-type(", ":last-of-type("
        , ":only-child(", ":only-of-type(", ":empty(", ":link("
        , ":visited(", ":active(", ":hover(", ":focus(", ":target("
        , ":lang(", ":enabled(", ":disabled(", ":checked(", ":default("
        , ":indeterminate(", ":root(", ":before("
        , ":after(", ":first-letter(", ":first-line(", ":selection("
        , ":read-only(", ":read-write(", ":fullscreen(", ":optional("
        , ":required(", ":valid(", ":invalid(", ":in-range(", ":out-of-range("
        , ":placeholder-shown("
    ];

    const selectorClassPair: { [key: string]: string[] } = {};

    for (let i = 0; i < uniqueSelectors.length; i++) {
        const originalSelector = uniqueSelectors[i];
        const { extractedClasses } = extractClassFromSelector(originalSelector) || [];
        selectorClassPair[originalSelector] = extractedClasses;
    }

    //? since a multi part selector normally grouped by multiple basic selectors
    //? so we need to obfuscate the basic selector first
    //? eg. ":is(.class1 .class2)" grouped by ".class1" and ".class2"
    // sort the selectorClassPair by the number of classes in the selector (from least to most)
    // and remove the selector with no class
    const sortedSelectorClassPair = Object.entries(selectorClassPair)
        .sort((a, b) => a[1].length - b[1].length)
        .filter((pair) => pair[1].length > 0);

    for (let i = 0; i < sortedSelectorClassPair.length; i++) {
        const [originalSelector, selectorClasses] = sortedSelectorClassPair[i];
        if (selectorClasses.length == 0) {
            continue;
        }

        let selector = originalSelector;
        let classes = selectorClasses;

        if (classes && allowClassStartWith.some((start) => selector.startsWith(start))) {
            classes = classes.map((className) => {

                // apply ignore list
                if (classIgnore.some(regex => {
                    if (typeof regex === "string") {
                        return className === regex;
                    }
                    return new RegExp(regex).test(className)
                })) {
                    return className;
                }

                // try to get the obfuscated selector from the selectorConversion
                // if not found, create a new one
                let obfuscatedSelector = selectorConversion[`.${className}`];
                if (!obfuscatedSelector) {
                    const obfuscatedClass = createNewClassName(mode, className, classPrefix, classSuffix, classNameLength, generatorSeed);
                    obfuscatedSelector = `.${obfuscatedClass}`;
                    selectorConversion[`.${className}`] = obfuscatedSelector;
                }

                // return the obfuscated class
                return obfuscatedSelector.slice(1)
            });

            // obfuscate the selector
            const { selector: obfuscatedSelector } = extractClassFromSelector(originalSelector, classes);

            selectorConversion[originalSelector] = obfuscatedSelector;
        }
    }

    const jsonPath = path.join(process.cwd(), selectorConversionJsonFolderPath, "conversion.json");
    fs.writeFileSync(jsonPath, JSON.stringify(selectorConversion, null, 2));
    if (duplicationCheck(Object.keys(selectorConversion))) {
        if (mode == "random") {
            log("error", "Obfuscation", "Duplicated class names found in the conversion JSON, try to increase the class name length / open an issue on GitHub https://github.com/soranoo/next-css-obfuscator/issues");
        } else {
            log("error", "Obfuscation", "Duplicated class names found in the conversion JSON, please open an issue on GitHub https://github.com/soranoo/next-css-obfuscator/issues");
        }
    }
}

function copyCssData(targetSelector: string, newSelectorName: string, cssObj: any) {
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

function renameCssSelector(oldSelector: string, newSelector: string, cssObj: any) {
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

function obfuscateCss(
    selectorConversion: SelectorConversion,
    cssPath: string,
    replaceOriginalSelector: boolean = false,
    outCssPath?: string,
) {
    if (!outCssPath) {
        outCssPath = cssPath;
    } else if (!fs.existsSync(path.dirname(outCssPath))) {
        fs.mkdirSync(path.dirname(outCssPath));
    }

    let cssContent = fs.readFileSync(cssPath, "utf-8");

    let cssObj = css.parse(cssContent);
    const cssRulesCount = cssObj.stylesheet.rules.length;

    // join all selectors start with ":" (eg. ":is")
    Object.keys(selectorConversion).forEach((key) => {
        if (key.startsWith(":")) {
            usedKeyRegistery.add(key);
        }
    });

    // join all selectors with action selectors
    const actionSelectors = getAllSelector(cssObj).filter((selector) => selector.match(findActionSelectorsRegex));
    actionSelectors.forEach((actionSelector) => {
        usedKeyRegistery.add(actionSelector);
    });

    // join all Tailwind CSS [child] selectors (eg. ".\[\&_\.side-box\]\:absolute .side-box")
    const tailwindCssChildSelectors = getAllSelector(cssObj).filter((selector) => selector.startsWith(".\\["));
    tailwindCssChildSelectors.forEach((tailwindCssChildSelector) => {
        usedKeyRegistery.add(tailwindCssChildSelector);
    });

    // join all child selectors (eg. ">*")
    const universalSelectors = getAllSelector(cssObj).filter((selector) => selector.includes(">"));
    universalSelectors.forEach((universalSelector) => {
        usedKeyRegistery.add(universalSelector);
    });

    // modify css rules
    usedKeyRegistery.forEach((key) => {
        const originalSelectorName = key;
        const obfuscatedSelectorName = selectorConversion[key];
        if (obfuscatedSelectorName) {
            if (replaceOriginalSelector) {
                cssObj = renameCssSelector(originalSelectorName, selectorConversion[key], cssObj);
            } else {
                cssObj = copyCssData(originalSelectorName, selectorConversion[key], cssObj);
            }
        }
    });

    if (replaceOriginalSelector) {
        log("info", "CSS rules:", `Modified ${usedKeyRegistery.size} CSS rules to ${getFilenameFromPath(cssPath)}`);
    } else {
        log("info", "CSS rules:", `Added ${cssObj.stylesheet.rules.length - cssRulesCount} new CSS rules to ${getFilenameFromPath(cssPath)}`);
    }

    const cssOptions = {
        compress: true,
    };
    const cssObfuscatedContent = css.stringify(cssObj, cssOptions);

    const sizeBefore = Buffer.byteLength(cssContent, "utf8");
    fs.writeFileSync(outCssPath, cssObfuscatedContent);
    const sizeAfter = Buffer.byteLength(cssObfuscatedContent, "utf8");
    const percentChange = Math.round(((sizeAfter) / sizeBefore) * 100);
    log("success", "CSS obfuscated:", `Size from ${sizeBefore} to ${sizeAfter} bytes (${percentChange}%) in ${getFilenameFromPath(cssPath)}`);
}

export {
    copyCssData,
    renameCssSelector,
    createSelectorConversionJson,
    obfuscateCss,
    extractClassFromSelector,
}