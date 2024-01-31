// @ts-ignore
import css from "css";
import {
    copyCssData, findContentBetweenMarker,
    findHtmlTagContentsByClass, getFilenameFromPath,
    extractClassFromSelector, searchForwardComponent,
    renameCssSelector
} from "./utils";

const testCss = `
.s0-1 {
    background: #181810;
    color: #181811;
}

@media (min-width: 640px) 
{
    .s1-1
    {
        background: #181812;
        color: #181813;
    }

    @media (min-width: 768px) 
    {
        .s2-1, .s2-1-1 {
            background: #181814;
            color: #181815;
        },
        .s2-1, .s2-1-1 {
            background: #181814;
            color: #181815;
        },
        .s2-2, .s2-2-2 {
            background: #181816;
            color: #181817;
        },
        .s2-3 {
            background: #181818;
            color: #181819;
        }
    }

    .s1-2
    {
        background: #181820;
        color: #181821;
    }
}

.s0-2 {
    background: #181822;
    color: #181823;
}
`

// function getCssRulesIncludedSelector(selector: string, cssObj: any): any[] {
//     function recursive(rules: any[]) {
//         for (const item of rules) {
//             if (item.rules) {
//                 const result: any = recursive(item.rules);
//                 if (result !== null) {
//                     return [{ ...item, rules: result }];
//                 }
//             } else if (item.selectors.includes(selector)) {
//                 // remove empty selectors
//                 item.selectors = item.selectors.filter((selector: any) => selector !== "");

//                 return [{ ...item, selectors: [selector] }];
//             }
//         }
//         return null;
//     }
//     return recursive(cssObj.stylesheet.rules) || [];
// }

// describe("getCssRulesIncludedSelector", () => {
//     it("should return the correct CSS rules (single selector, no nested rule)", () => {
//         const cssObj = css.parse(testCss);

//         const selector = ".s0-1";
//         const expectedOutput = [{ "type": "rule", "selectors": [".s0-1"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181810", "position": { "start": { "line": 3, "column": 5 }, "end": { "line": 3, "column": 24 } } }, { "type": "declaration", "property": "color", "value": "#181811", "position": { "start": { "line": 4, "column": 5 }, "end": { "line": 4, "column": 19 } } }], "position": { "start": { "line": 2, "column": 1 }, "end": { "line": 5, "column": 2 } } }];

//         const result = getCssRulesIncludedSelector(selector, cssObj);
//         expect(result).toEqual(expectedOutput);
//     });

//     it("should return the correct CSS rules (multiple nested rules)", () => {
//         const cssObj = css.parse(testCss);

//         const selector = ".s2-3";
//         const expectedOutput = [{ "type": "media", "media": "(min-width: 640px)", "rules": [{ "type": "media", "media": "(min-width: 768px)", "rules": [{ "type": "rule", "selectors": [".s2-3"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181818", "position": { "start": { "line": 26, "column": 13 }, "end": { "line": 26, "column": 32 } } }, { "type": "declaration", "property": "color", "value": "#181819", "position": { "start": { "line": 27, "column": 13 }, "end": { "line": 27, "column": 27 } } }], "position": { "start": { "line": 24, "column": 10 }, "end": { "line": 28, "column": 10 } } }], "position": { "start": { "line": 15, "column": 5 }, "end": { "line": 29, "column": 6 } } }], "position": { "start": { "line": 7, "column": 1 }, "end": { "line": 36, "column": 2 } } }];

//         const result = getCssRulesIncludedSelector(selector, cssObj);
//         expect(result).toEqual(expectedOutput);
//     });

//     it("should return the correct CSS rules (multiple selector in same rule)", () => {
//         const cssObj = css.parse(testCss);

//         const selector = ".s2-2-2";
//         const expectedOutput = [{ "type": "media", "media": "(min-width: 640px)", "rules": [{ "type": "media", "media": "(min-width: 768px)", "rules": [{ "type": "rule", "selectors": [".s2-2-2"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181816", "position": { "start": { "line": 22, "column": 13 }, "end": { "line": 22, "column": 32 } } }, { "type": "declaration", "property": "color", "value": "#181817", "position": { "start": { "line": 23, "column": 13 }, "end": { "line": 23, "column": 27 } } }], "position": { "start": { "line": 20, "column": 10 }, "end": { "line": 24, "column": 10 } } }], "position": { "start": { "line": 15, "column": 5 }, "end": { "line": 29, "column": 6 } } }], "position": { "start": { "line": 7, "column": 1 }, "end": { "line": 36, "column": 2 } } }];

//         const result = getCssRulesIncludedSelector(selector, cssObj);
//         expect(result).toEqual(expectedOutput);
//     });

//     it("should return the empty array", () => {
//         const cssObj = css.parse(testCss);

//         const selector = ".s2-2-3";
//         const expectedOutput: [] = [];

//         const result = getCssRulesIncludedSelector(selector, cssObj);
//         expect(result).toEqual(expectedOutput);
//     });
// });

describe("renameCssSelector", () => {
    it("should rename the CSS selector (single selector, no nested rule)", () => {
        const cssObj = css.parse(testCss);

        const oldSelector = ".s1-1";
        const newSelector = ".s1-1-new";
        const expectedOutput = [{ "type": "rule", "selectors": [".s0-1"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181810", "position": { "start": { "line": 3, "column": 5 }, "end": { "line": 3, "column": 24 } } }, { "type": "declaration", "property": "color", "value": "#181811", "position": { "start": { "line": 4, "column": 5 }, "end": { "line": 4, "column": 19 } } }], "position": { "start": { "line": 2, "column": 1 }, "end": { "line": 5, "column": 2 } } }, { "type": "media", "media": "(min-width: 640px)", "rules": [{ "type": "rule", "selectors": [".s1-1-new"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181812", "position": { "start": { "line": 11, "column": 9 }, "end": { "line": 11, "column": 28 } } }, { "type": "declaration", "property": "color", "value": "#181813", "position": { "start": { "line": 12, "column": 9 }, "end": { "line": 12, "column": 23 } } }], "position": { "start": { "line": 9, "column": 5 }, "end": { "line": 13, "column": 6 } } }, { "type": "media", "media": "(min-width: 768px)", "rules": [{ "type": "rule", "selectors": [".s2-1", ".s2-1-1"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181814", "position": { "start": { "line": 18, "column": 13 }, "end": { "line": 18, "column": 32 } } }, { "type": "declaration", "property": "color", "value": "#181815", "position": { "start": { "line": 19, "column": 13 }, "end": { "line": 19, "column": 27 } } }], "position": { "start": { "line": 17, "column": 9 }, "end": { "line": 20, "column": 10 } } }, { "type": "rule", "selectors": [".s2-1", ".s2-1-1"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181814", "position": { "start": { "line": 22, "column": 13 }, "end": { "line": 22, "column": 32 } } }, { "type": "declaration", "property": "color", "value": "#181815", "position": { "start": { "line": 23, "column": 13 }, "end": { "line": 23, "column": 27 } } }], "position": { "start": { "line": 20, "column": 10 }, "end": { "line": 24, "column": 10 } } }, { "type": "rule", "selectors": [".s2-2", ".s2-2-2"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181816", "position": { "start": { "line": 26, "column": 13 }, "end": { "line": 26, "column": 32 } } }, { "type": "declaration", "property": "color", "value": "#181817", "position": { "start": { "line": 27, "column": 13 }, "end": { "line": 27, "column": 27 } } }], "position": { "start": { "line": 24, "column": 10 }, "end": { "line": 28, "column": 10 } } }, { "type": "rule", "selectors": [".s2-3"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181818", "position": { "start": { "line": 30, "column": 13 }, "end": { "line": 30, "column": 32 } } }, { "type": "declaration", "property": "color", "value": "#181819", "position": { "start": { "line": 31, "column": 13 }, "end": { "line": 31, "column": 27 } } }], "position": { "start": { "line": 28, "column": 10 }, "end": { "line": 32, "column": 10 } } }], "position": { "start": { "line": 15, "column": 5 }, "end": { "line": 33, "column": 6 } } }, { "type": "rule", "selectors": [".s1-2"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181820", "position": { "start": { "line": 37, "column": 9 }, "end": { "line": 37, "column": 28 } } }, { "type": "declaration", "property": "color", "value": "#181821", "position": { "start": { "line": 38, "column": 9 }, "end": { "line": 38, "column": 23 } } }], "position": { "start": { "line": 35, "column": 5 }, "end": { "line": 39, "column": 6 } } }], "position": { "start": { "line": 7, "column": 1 }, "end": { "line": 40, "column": 2 } } }, { "type": "rule", "selectors": [".s0-2"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181822", "position": { "start": { "line": 43, "column": 5 }, "end": { "line": 43, "column": 24 } } }, { "type": "declaration", "property": "color", "value": "#181823", "position": { "start": { "line": 44, "column": 5 }, "end": { "line": 44, "column": 19 } } }], "position": { "start": { "line": 42, "column": 1 }, "end": { "line": 45, "column": 2 } } }];

        const result = renameCssSelector(oldSelector, newSelector, cssObj);
        expect(result.stylesheet.rules).toEqual(expectedOutput);
    });

    it("should rename the CSS selector (multiple nested media queries)", () => {
        const cssObj = css.parse(testCss);

        const oldSelector = ".s2-2";
        const newSelector = ".s2-2-new";
        const expectedOutput = [{ "type": "rule", "selectors": [".s0-1"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181810", "position": { "start": { "line": 3, "column": 5 }, "end": { "line": 3, "column": 24 } } }, { "type": "declaration", "property": "color", "value": "#181811", "position": { "start": { "line": 4, "column": 5 }, "end": { "line": 4, "column": 19 } } }], "position": { "start": { "line": 2, "column": 1 }, "end": { "line": 5, "column": 2 } } }, { "type": "media", "media": "(min-width: 640px)", "rules": [{ "type": "rule", "selectors": [".s1-1"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181812", "position": { "start": { "line": 11, "column": 9 }, "end": { "line": 11, "column": 28 } } }, { "type": "declaration", "property": "color", "value": "#181813", "position": { "start": { "line": 12, "column": 9 }, "end": { "line": 12, "column": 23 } } }], "position": { "start": { "line": 9, "column": 5 }, "end": { "line": 13, "column": 6 } } }, { "type": "media", "media": "(min-width: 768px)", "rules": [{ "type": "rule", "selectors": [".s2-1", ".s2-1-1"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181814", "position": { "start": { "line": 18, "column": 13 }, "end": { "line": 18, "column": 32 } } }, { "type": "declaration", "property": "color", "value": "#181815", "position": { "start": { "line": 19, "column": 13 }, "end": { "line": 19, "column": 27 } } }], "position": { "start": { "line": 17, "column": 9 }, "end": { "line": 20, "column": 10 } } }, { "type": "rule", "selectors": [".s2-1", ".s2-1-1"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181814", "position": { "start": { "line": 22, "column": 13 }, "end": { "line": 22, "column": 32 } } }, { "type": "declaration", "property": "color", "value": "#181815", "position": { "start": { "line": 23, "column": 13 }, "end": { "line": 23, "column": 27 } } }], "position": { "start": { "line": 20, "column": 10 }, "end": { "line": 24, "column": 10 } } }, { "type": "rule", "selectors": [".s2-2-new", ".s2-2-2"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181816", "position": { "start": { "line": 26, "column": 13 }, "end": { "line": 26, "column": 32 } } }, { "type": "declaration", "property": "color", "value": "#181817", "position": { "start": { "line": 27, "column": 13 }, "end": { "line": 27, "column": 27 } } }], "position": { "start": { "line": 24, "column": 10 }, "end": { "line": 28, "column": 10 } } }, { "type": "rule", "selectors": [".s2-3"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181818", "position": { "start": { "line": 30, "column": 13 }, "end": { "line": 30, "column": 32 } } }, { "type": "declaration", "property": "color", "value": "#181819", "position": { "start": { "line": 31, "column": 13 }, "end": { "line": 31, "column": 27 } } }], "position": { "start": { "line": 28, "column": 10 }, "end": { "line": 32, "column": 10 } } }], "position": { "start": { "line": 15, "column": 5 }, "end": { "line": 33, "column": 6 } } }, { "type": "rule", "selectors": [".s1-2"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181820", "position": { "start": { "line": 37, "column": 9 }, "end": { "line": 37, "column": 28 } } }, { "type": "declaration", "property": "color", "value": "#181821", "position": { "start": { "line": 38, "column": 9 }, "end": { "line": 38, "column": 23 } } }], "position": { "start": { "line": 35, "column": 5 }, "end": { "line": 39, "column": 6 } } }], "position": { "start": { "line": 7, "column": 1 }, "end": { "line": 40, "column": 2 } } }, { "type": "rule", "selectors": [".s0-2"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181822", "position": { "start": { "line": 43, "column": 5 }, "end": { "line": 43, "column": 24 } } }, { "type": "declaration", "property": "color", "value": "#181823", "position": { "start": { "line": 44, "column": 5 }, "end": { "line": 44, "column": 19 } } }], "position": { "start": { "line": 42, "column": 1 }, "end": { "line": 45, "column": 2 } } }];

        const result = renameCssSelector(oldSelector, newSelector, cssObj);
        expect(result.stylesheet.rules).toEqual(expectedOutput);
    });
});

//! ================================
//! copyCssData
//! ================================

describe("copyCssData", () => {
    it("should copy the CSS data (single selector, no nested rule)", () => {
        const cssObj = css.parse(testCss);

        const targetSelector = ".s0-2";
        const newSelectorName = ".s0-2-new";
        const expectedOutput = [{ "type": "rule", "selectors": [".s0-1"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181810", "position": { "start": { "line": 3, "column": 5 }, "end": { "line": 3, "column": 24 } } }, { "type": "declaration", "property": "color", "value": "#181811", "position": { "start": { "line": 4, "column": 5 }, "end": { "line": 4, "column": 19 } } }], "position": { "start": { "line": 2, "column": 1 }, "end": { "line": 5, "column": 2 } } }, { "type": "media", "media": "(min-width: 640px)", "rules": [{ "type": "rule", "selectors": [".s1-1"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181812", "position": { "start": { "line": 11, "column": 9 }, "end": { "line": 11, "column": 28 } } }, { "type": "declaration", "property": "color", "value": "#181813", "position": { "start": { "line": 12, "column": 9 }, "end": { "line": 12, "column": 23 } } }], "position": { "start": { "line": 9, "column": 5 }, "end": { "line": 13, "column": 6 } } }, { "type": "media", "media": "(min-width: 768px)", "rules": [{ "type": "rule", "selectors": [".s2-1", ".s2-1-1"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181814", "position": { "start": { "line": 18, "column": 13 }, "end": { "line": 18, "column": 32 } } }, { "type": "declaration", "property": "color", "value": "#181815", "position": { "start": { "line": 19, "column": 13 }, "end": { "line": 19, "column": 27 } } }], "position": { "start": { "line": 17, "column": 9 }, "end": { "line": 20, "column": 10 } } }, { "type": "rule", "selectors": [".s2-1", ".s2-1-1"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181814", "position": { "start": { "line": 22, "column": 13 }, "end": { "line": 22, "column": 32 } } }, { "type": "declaration", "property": "color", "value": "#181815", "position": { "start": { "line": 23, "column": 13 }, "end": { "line": 23, "column": 27 } } }], "position": { "start": { "line": 20, "column": 10 }, "end": { "line": 24, "column": 10 } } }, { "type": "rule", "selectors": [".s2-2", ".s2-2-2"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181816", "position": { "start": { "line": 26, "column": 13 }, "end": { "line": 26, "column": 32 } } }, { "type": "declaration", "property": "color", "value": "#181817", "position": { "start": { "line": 27, "column": 13 }, "end": { "line": 27, "column": 27 } } }], "position": { "start": { "line": 24, "column": 10 }, "end": { "line": 28, "column": 10 } } }, { "type": "rule", "selectors": [".s2-3"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181818", "position": { "start": { "line": 30, "column": 13 }, "end": { "line": 30, "column": 32 } } }, { "type": "declaration", "property": "color", "value": "#181819", "position": { "start": { "line": 31, "column": 13 }, "end": { "line": 31, "column": 27 } } }], "position": { "start": { "line": 28, "column": 10 }, "end": { "line": 32, "column": 10 } } }], "position": { "start": { "line": 15, "column": 5 }, "end": { "line": 33, "column": 6 } } }, { "type": "rule", "selectors": [".s1-2"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181820", "position": { "start": { "line": 37, "column": 9 }, "end": { "line": 37, "column": 28 } } }, { "type": "declaration", "property": "color", "value": "#181821", "position": { "start": { "line": 38, "column": 9 }, "end": { "line": 38, "column": 23 } } }], "position": { "start": { "line": 35, "column": 5 }, "end": { "line": 39, "column": 6 } } }], "position": { "start": { "line": 7, "column": 1 }, "end": { "line": 40, "column": 2 } } }, { "type": "rule", "selectors": [".s0-2"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181822", "position": { "start": { "line": 43, "column": 5 }, "end": { "line": 43, "column": 24 } } }, { "type": "declaration", "property": "color", "value": "#181823", "position": { "start": { "line": 44, "column": 5 }, "end": { "line": 44, "column": 19 } } }], "position": { "start": { "line": 42, "column": 1 }, "end": { "line": 45, "column": 2 } } }, { "type": "rule", "selectors": [".s0-2-new"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181822", "position": { "start": { "line": 43, "column": 5 }, "end": { "line": 43, "column": 24 } } }, { "type": "declaration", "property": "color", "value": "#181823", "position": { "start": { "line": 44, "column": 5 }, "end": { "line": 44, "column": 19 } } }], "position": { "start": { "line": 42, "column": 1 }, "end": { "line": 45, "column": 2 } } }];

        const result = copyCssData(targetSelector, newSelectorName, cssObj);
        expect(result.stylesheet.rules).toEqual(expectedOutput);
    });

    it("should copy the CSS data (multiple nested rules)", () => {
        const cssObj = css.parse(testCss);

        const targetSelector = ".s2-3";
        const newSelectorName = ".s2-3-new";
        const expectedOutput = [{ "type": "rule", "selectors": [".s0-1"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181810", "position": { "start": { "line": 3, "column": 5 }, "end": { "line": 3, "column": 24 } } }, { "type": "declaration", "property": "color", "value": "#181811", "position": { "start": { "line": 4, "column": 5 }, "end": { "line": 4, "column": 19 } } }], "position": { "start": { "line": 2, "column": 1 }, "end": { "line": 5, "column": 2 } } }, { "type": "media", "media": "(min-width: 640px)", "rules": [{ "type": "rule", "selectors": [".s1-1"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181812", "position": { "start": { "line": 11, "column": 9 }, "end": { "line": 11, "column": 28 } } }, { "type": "declaration", "property": "color", "value": "#181813", "position": { "start": { "line": 12, "column": 9 }, "end": { "line": 12, "column": 23 } } }], "position": { "start": { "line": 9, "column": 5 }, "end": { "line": 13, "column": 6 } } }, { "type": "media", "media": "(min-width: 768px)", "rules": [{ "type": "rule", "selectors": [".s2-1", ".s2-1-1"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181814", "position": { "start": { "line": 18, "column": 13 }, "end": { "line": 18, "column": 32 } } }, { "type": "declaration", "property": "color", "value": "#181815", "position": { "start": { "line": 19, "column": 13 }, "end": { "line": 19, "column": 27 } } }], "position": { "start": { "line": 17, "column": 9 }, "end": { "line": 20, "column": 10 } } }, { "type": "rule", "selectors": [".s2-1", ".s2-1-1"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181814", "position": { "start": { "line": 22, "column": 13 }, "end": { "line": 22, "column": 32 } } }, { "type": "declaration", "property": "color", "value": "#181815", "position": { "start": { "line": 23, "column": 13 }, "end": { "line": 23, "column": 27 } } }], "position": { "start": { "line": 20, "column": 10 }, "end": { "line": 24, "column": 10 } } }, { "type": "rule", "selectors": [".s2-2", ".s2-2-2"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181816", "position": { "start": { "line": 26, "column": 13 }, "end": { "line": 26, "column": 32 } } }, { "type": "declaration", "property": "color", "value": "#181817", "position": { "start": { "line": 27, "column": 13 }, "end": { "line": 27, "column": 27 } } }], "position": { "start": { "line": 24, "column": 10 }, "end": { "line": 28, "column": 10 } } }, { "type": "rule", "selectors": [".s2-3"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181818", "position": { "start": { "line": 30, "column": 13 }, "end": { "line": 30, "column": 32 } } }, { "type": "declaration", "property": "color", "value": "#181819", "position": { "start": { "line": 31, "column": 13 }, "end": { "line": 31, "column": 27 } } }], "position": { "start": { "line": 28, "column": 10 }, "end": { "line": 32, "column": 10 } } }, { "type": "rule", "selectors": [".s2-3-new"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181818", "position": { "start": { "line": 30, "column": 13 }, "end": { "line": 30, "column": 32 } } }, { "type": "declaration", "property": "color", "value": "#181819", "position": { "start": { "line": 31, "column": 13 }, "end": { "line": 31, "column": 27 } } }], "position": { "start": { "line": 28, "column": 10 }, "end": { "line": 32, "column": 10 } } }], "position": { "start": { "line": 15, "column": 5 }, "end": { "line": 33, "column": 6 } } }, { "type": "rule", "selectors": [".s1-2"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181820", "position": { "start": { "line": 37, "column": 9 }, "end": { "line": 37, "column": 28 } } }, { "type": "declaration", "property": "color", "value": "#181821", "position": { "start": { "line": 38, "column": 9 }, "end": { "line": 38, "column": 23 } } }], "position": { "start": { "line": 35, "column": 5 }, "end": { "line": 39, "column": 6 } } }], "position": { "start": { "line": 7, "column": 1 }, "end": { "line": 40, "column": 2 } } }, { "type": "rule", "selectors": [".s0-2"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181822", "position": { "start": { "line": 43, "column": 5 }, "end": { "line": 43, "column": 24 } } }, { "type": "declaration", "property": "color", "value": "#181823", "position": { "start": { "line": 44, "column": 5 }, "end": { "line": 44, "column": 19 } } }], "position": { "start": { "line": 42, "column": 1 }, "end": { "line": 45, "column": 2 } } }];

        const result = copyCssData(targetSelector, newSelectorName, cssObj);
        expect(result.stylesheet.rules).toEqual(expectedOutput);
    });

    it("should copy the CSS data (multiple selector in same rule)", () => {
        const cssObj = css.parse(testCss);

        const targetSelector = ".s2-2-2";
        const newSelectorName = ".s2-2-2-new";
        const expectedOutput = [{ "type": "rule", "selectors": [".s0-1"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181810", "position": { "start": { "line": 3, "column": 5 }, "end": { "line": 3, "column": 24 } } }, { "type": "declaration", "property": "color", "value": "#181811", "position": { "start": { "line": 4, "column": 5 }, "end": { "line": 4, "column": 19 } } }], "position": { "start": { "line": 2, "column": 1 }, "end": { "line": 5, "column": 2 } } }, { "type": "media", "media": "(min-width: 640px)", "rules": [{ "type": "rule", "selectors": [".s1-1"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181812", "position": { "start": { "line": 11, "column": 9 }, "end": { "line": 11, "column": 28 } } }, { "type": "declaration", "property": "color", "value": "#181813", "position": { "start": { "line": 12, "column": 9 }, "end": { "line": 12, "column": 23 } } }], "position": { "start": { "line": 9, "column": 5 }, "end": { "line": 13, "column": 6 } } }, { "type": "media", "media": "(min-width: 768px)", "rules": [{ "type": "rule", "selectors": [".s2-1", ".s2-1-1"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181814", "position": { "start": { "line": 18, "column": 13 }, "end": { "line": 18, "column": 32 } } }, { "type": "declaration", "property": "color", "value": "#181815", "position": { "start": { "line": 19, "column": 13 }, "end": { "line": 19, "column": 27 } } }], "position": { "start": { "line": 17, "column": 9 }, "end": { "line": 20, "column": 10 } } }, { "type": "rule", "selectors": [".s2-1", ".s2-1-1"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181814", "position": { "start": { "line": 22, "column": 13 }, "end": { "line": 22, "column": 32 } } }, { "type": "declaration", "property": "color", "value": "#181815", "position": { "start": { "line": 23, "column": 13 }, "end": { "line": 23, "column": 27 } } }], "position": { "start": { "line": 20, "column": 10 }, "end": { "line": 24, "column": 10 } } }, { "type": "rule", "selectors": [".s2-2", ".s2-2-2"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181816", "position": { "start": { "line": 26, "column": 13 }, "end": { "line": 26, "column": 32 } } }, { "type": "declaration", "property": "color", "value": "#181817", "position": { "start": { "line": 27, "column": 13 }, "end": { "line": 27, "column": 27 } } }], "position": { "start": { "line": 24, "column": 10 }, "end": { "line": 28, "column": 10 } } }, { "type": "rule", "selectors": [".s2-2-2-new"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181816", "position": { "start": { "line": 26, "column": 13 }, "end": { "line": 26, "column": 32 } } }, { "type": "declaration", "property": "color", "value": "#181817", "position": { "start": { "line": 27, "column": 13 }, "end": { "line": 27, "column": 27 } } }], "position": { "start": { "line": 24, "column": 10 }, "end": { "line": 28, "column": 10 } } }, { "type": "rule", "selectors": [".s2-3"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181818", "position": { "start": { "line": 30, "column": 13 }, "end": { "line": 30, "column": 32 } } }, { "type": "declaration", "property": "color", "value": "#181819", "position": { "start": { "line": 31, "column": 13 }, "end": { "line": 31, "column": 27 } } }], "position": { "start": { "line": 28, "column": 10 }, "end": { "line": 32, "column": 10 } } }], "position": { "start": { "line": 15, "column": 5 }, "end": { "line": 33, "column": 6 } } }, { "type": "rule", "selectors": [".s1-2"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181820", "position": { "start": { "line": 37, "column": 9 }, "end": { "line": 37, "column": 28 } } }, { "type": "declaration", "property": "color", "value": "#181821", "position": { "start": { "line": 38, "column": 9 }, "end": { "line": 38, "column": 23 } } }], "position": { "start": { "line": 35, "column": 5 }, "end": { "line": 39, "column": 6 } } }], "position": { "start": { "line": 7, "column": 1 }, "end": { "line": 40, "column": 2 } } }, { "type": "rule", "selectors": [".s0-2"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181822", "position": { "start": { "line": 43, "column": 5 }, "end": { "line": 43, "column": 24 } } }, { "type": "declaration", "property": "color", "value": "#181823", "position": { "start": { "line": 44, "column": 5 }, "end": { "line": 44, "column": 19 } } }], "position": { "start": { "line": 42, "column": 1 }, "end": { "line": 45, "column": 2 } } }];

        const result = copyCssData(targetSelector, newSelectorName, cssObj);
        expect(result.stylesheet.rules).toEqual(expectedOutput);
    });

    it("should copy the CSS data (same selector with different declarations)", () => {
        const cssObj = css.parse(testCss);

        const targetSelector = ".s2-1";
        const newSelectorName = ".s2-1-new";
        const expectedOutput = [{ "type": "rule", "selectors": [".s0-1"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181810", "position": { "start": { "line": 3, "column": 5 }, "end": { "line": 3, "column": 24 } } }, { "type": "declaration", "property": "color", "value": "#181811", "position": { "start": { "line": 4, "column": 5 }, "end": { "line": 4, "column": 19 } } }], "position": { "start": { "line": 2, "column": 1 }, "end": { "line": 5, "column": 2 } } }, { "type": "media", "media": "(min-width: 640px)", "rules": [{ "type": "rule", "selectors": [".s1-1"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181812", "position": { "start": { "line": 11, "column": 9 }, "end": { "line": 11, "column": 28 } } }, { "type": "declaration", "property": "color", "value": "#181813", "position": { "start": { "line": 12, "column": 9 }, "end": { "line": 12, "column": 23 } } }], "position": { "start": { "line": 9, "column": 5 }, "end": { "line": 13, "column": 6 } } }, { "type": "media", "media": "(min-width: 768px)", "rules": [{ "type": "rule", "selectors": [".s2-1", ".s2-1-1"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181814", "position": { "start": { "line": 18, "column": 13 }, "end": { "line": 18, "column": 32 } } }, { "type": "declaration", "property": "color", "value": "#181815", "position": { "start": { "line": 19, "column": 13 }, "end": { "line": 19, "column": 27 } } }], "position": { "start": { "line": 17, "column": 9 }, "end": { "line": 20, "column": 10 } } }, { "type": "rule", "selectors": [".s2-1-new"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181814", "position": { "start": { "line": 18, "column": 13 }, "end": { "line": 18, "column": 32 } } }, { "type": "declaration", "property": "color", "value": "#181815", "position": { "start": { "line": 19, "column": 13 }, "end": { "line": 19, "column": 27 } } }], "position": { "start": { "line": 17, "column": 9 }, "end": { "line": 20, "column": 10 } } }, { "type": "rule", "selectors": [".s2-1", ".s2-1-1"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181814", "position": { "start": { "line": 22, "column": 13 }, "end": { "line": 22, "column": 32 } } }, { "type": "declaration", "property": "color", "value": "#181815", "position": { "start": { "line": 23, "column": 13 }, "end": { "line": 23, "column": 27 } } }], "position": { "start": { "line": 20, "column": 10 }, "end": { "line": 24, "column": 10 } } }, { "type": "rule", "selectors": [".s2-1-new"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181814", "position": { "start": { "line": 22, "column": 13 }, "end": { "line": 22, "column": 32 } } }, { "type": "declaration", "property": "color", "value": "#181815", "position": { "start": { "line": 23, "column": 13 }, "end": { "line": 23, "column": 27 } } }], "position": { "start": { "line": 20, "column": 10 }, "end": { "line": 24, "column": 10 } } }, { "type": "rule", "selectors": [".s2-2", ".s2-2-2"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181816", "position": { "start": { "line": 26, "column": 13 }, "end": { "line": 26, "column": 32 } } }, { "type": "declaration", "property": "color", "value": "#181817", "position": { "start": { "line": 27, "column": 13 }, "end": { "line": 27, "column": 27 } } }], "position": { "start": { "line": 24, "column": 10 }, "end": { "line": 28, "column": 10 } } }, { "type": "rule", "selectors": [".s2-3"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181818", "position": { "start": { "line": 30, "column": 13 }, "end": { "line": 30, "column": 32 } } }, { "type": "declaration", "property": "color", "value": "#181819", "position": { "start": { "line": 31, "column": 13 }, "end": { "line": 31, "column": 27 } } }], "position": { "start": { "line": 28, "column": 10 }, "end": { "line": 32, "column": 10 } } }], "position": { "start": { "line": 15, "column": 5 }, "end": { "line": 33, "column": 6 } } }, { "type": "rule", "selectors": [".s1-2"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181820", "position": { "start": { "line": 37, "column": 9 }, "end": { "line": 37, "column": 28 } } }, { "type": "declaration", "property": "color", "value": "#181821", "position": { "start": { "line": 38, "column": 9 }, "end": { "line": 38, "column": 23 } } }], "position": { "start": { "line": 35, "column": 5 }, "end": { "line": 39, "column": 6 } } }], "position": { "start": { "line": 7, "column": 1 }, "end": { "line": 40, "column": 2 } } }, { "type": "rule", "selectors": [".s0-2"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181822", "position": { "start": { "line": 43, "column": 5 }, "end": { "line": 43, "column": 24 } } }, { "type": "declaration", "property": "color", "value": "#181823", "position": { "start": { "line": 44, "column": 5 }, "end": { "line": 44, "column": 19 } } }], "position": { "start": { "line": 42, "column": 1 }, "end": { "line": 45, "column": 2 } } }];

        const result = copyCssData(targetSelector, newSelectorName, cssObj);
        expect(result.stylesheet.rules).toEqual(expectedOutput);
    });
});


//! ================================
//! findContentBetweenMarker
//! ================================

describe("findContentBetweenMarker", () => {

    it("should return the correct content between markers", () => {
        const content = `123{{4}5{67}8}901{2345678}9`;
        const targetStr = '5';
        const openSymbol = '{';
        const closeSymbol = '}';

        const expectedOutput = ["{4}5{67}8", "2345678"];

        const result = findContentBetweenMarker(content, targetStr, openSymbol, closeSymbol);
        expect(result).toEqual(expectedOutput);
    });

    // it('should return the correct content between (if marker length > 1)', () => {
    //     const content = '[Hello_0 [[Hello_1]]! Hello_2 [[Hello_3]]!]';
    //     const targetStr = 'He';
    //     const openSymbol = '[[';
    //     const closeSymbol = ']]';

    //     const expectedOutput = ['Hello_1', 'Hello_3'];

    //     const result = findContentBetweenMarker(content, targetStr, openSymbol, closeSymbol);
    //     expect(result).toEqual(expectedOutput);
    // });
});

//! ================================
//! findHtmlTagContentsByClass
//! ================================

describe("findHtmlTagContentsByClass", () => {
    const content = `<body><div class="test1 test2">12345678<div class="test1">901234</div>56789</div><div class="test1 test3">0123456</div></body>`;

    it("should return the correct content within the tag that with a given class", () => {
        const targetClass = "test1";

        const expectedOutput = ['<div class="test1 test2">12345678<div class="test1">901234</div>56789</div>'];

        const result = findHtmlTagContentsByClass(content, targetClass);
        expect(result).toEqual(expectedOutput);
    });

    it("should return empty array if no content found", () => {
        const targetClass = "test5";

        const expectedOutput: any[] = [];

        const result = findHtmlTagContentsByClass(content, targetClass);
        expect(result).toEqual(expectedOutput);
    });
});

//! ================================
//! getFilenameFromPath
//! ================================

describe("getFilenameFromPath", () => {

    test("should extract filename from a Unix-like path", () => {
        // Act
        const result = getFilenameFromPath("/home/user/documents/report.pdf");

        // Assert
        expect(result).toBe("report.pdf");
    });

    test("should extract filename from a Windows-like path", () => {
        // Act
        const result = getFilenameFromPath("C:\\Users\\hokin\\report.pdf");

        // Assert
        expect(result).toBe("report.pdf");
    });

    test("should handle filenames without an extension", () => {
        // Act
        const result = getFilenameFromPath("/home/user/documents/notes");

        // Assert
        expect(result).toBe("notes");
    });

    test("should handle paths with multiple periods", () => {
        // Act
        const result = getFilenameFromPath("/home/user/documents/report.v1.0.pdf");

        // Assert
        expect(result).toBe("report.v1.0.pdf");
    });

    test("should handle paths with no directory", () => {
        // Act
        const result = getFilenameFromPath("report.pdf");

        // Assert
        expect(result).toBe("report.pdf");
    });

    test("should handle empty strings", () => {
        // Act
        const result = getFilenameFromPath("");

        // Assert
        expect(result).toBe("");
    });

    test("should handle paths with only directories and no filename", () => {
        // Act
        const result = getFilenameFromPath("/home/user/documents/");

        // Assert
        expect(result).toBe("");
    });

    test("should handle paths with special characters in the filename", () => {
        // Act
        const result = getFilenameFromPath("/home/user/documents/~$!%20report.pdf");

        // Assert
        expect(result).toBe("~$!%20report.pdf");
    });

    test("should handle paths with a dot at the start", () => {
        // Act
        const result = getFilenameFromPath("/home/user/documents/.env");

        // Assert
        expect(result).toBe(".env");
    });

    test("should handle paths with a space in the filename", () => {
        // Act
        const result = getFilenameFromPath("/home/user/documents/my report.pdf");

        // Assert
        expect(result).toBe("my report.pdf");
    });

    test("should throw an error for non-string inputs", () => {
        // Arrange
        const input: any = null;

        // Act and Assert
        expect(() => getFilenameFromPath(input)).toThrow(TypeError);
    });

});

//! ================================
//! extractClassFromSelector
//! ================================

describe("extractClassFromSelector", () => {

    test("should extract single class from simple selector", () => {
        const sample = ".example";

        // Act
        const result = extractClassFromSelector(sample);

        // Assert
        expect(result).toEqual({
            selector: sample,
            extractedClasses: ["example"]
        });
    });

    test("should extract multiple classes from complex selector", () => {
        const sample = ":is(.some-class .some-class\\:bg-dark::-moz-placeholder)[data-active=\'true\']";

        // Act
        const result = extractClassFromSelector(sample);

        // Assert
        expect(result).toEqual({
            selector: sample,
            extractedClasses: ["some-class", "some-class\\:bg-dark"]
        });
    });

    test("should handle selector with no classes", () => {
        const sample = "div";

        // Act
        const result = extractClassFromSelector(sample);

        // Assert
        expect(result).toEqual({
            selector: sample,
            extractedClasses: []
        });
    });

    test("should handle selector with action pseudo-classes and not extract them", () => {
        const sample = ".btn:hover .btn-active::after";

        // Act
        const result = extractClassFromSelector(sample);

        // Assert
        expect(result).toEqual({
            selector: sample,
            extractedClasses: ["btn", "btn-active"]
        });
    });

    test("should handle selector with vendor pseudo-classes and not extract them", () => {
        const sample = ".btn-moz:-moz-focusring .btn-ms::-ms-placeholder .btn-webkit::-webkit-placeholder .btn-o::-o-placeholder";

        // Act
        const result = extractClassFromSelector(sample);

        // Assert
        expect(result).toEqual({
            selector: sample,
            extractedClasses: ["btn-moz", "btn-ms", "btn-webkit", "btn-o"]
        });
    });

    test("should handle selector with escaped characters", () => {
        const sample = ".escaped\\:class:action";

        // Act
        const result = extractClassFromSelector(sample);

        // Assert
        expect(result).toEqual({
            selector: sample,
            extractedClasses: ["escaped\\:class"]
        });
    });

    test("should handle selector with multiple classes separated by spaces", () => {
        const sample = ".class1 .class2 .class3";

        // Act
        const result = extractClassFromSelector(sample);

        // Assert
        expect(result).toEqual({
            selector: sample,
            extractedClasses: ["class1", "class2", "class3"]
        });
    });

    test("should handle selector with multiple classes separated by commas", () => {
        const sample = ".class1, .class2, .class3";

        // Act
        const result = extractClassFromSelector(sample);

        // Assert
        expect(result).toEqual({
            selector: sample,
            extractedClasses: ["class1", "class2", "class3"]
        });
    });

    test("should handle selector with a combination of classes and ids", () => {
        const sample = ".class1 #id .class2";

        // Act
        const result = extractClassFromSelector(sample);

        // Assert
        expect(result).toEqual({
            selector: sample,
            extractedClasses: ["class1", "class2"]
        });
    });

    test("should handle [attribute] selector", () => {
        const sample = ".class1[data-attr=\"value\"] .class2[data-attr='value']";

        // Act
        const result = extractClassFromSelector(sample);

        // Assert
        expect(result).toEqual({
            selector: sample,
            extractedClasses: ["class1[data-attr=\"value\"]", "class2[data-attr='value']"]
        });
    });

    test("should handle action pseudo-class selector correctly", () => {
        const sample = ".class1\\:hover\\:class2:after .class3\\:hover\\:class4:after:hover :is(.class5 .class6\\:hover\\:class7:hover:after) :is(.hover\\:class8\\:class9):after";

        // Act
        const result = extractClassFromSelector(sample);

        // Assert
        expect(result).toEqual({
            selector: sample,
            extractedClasses: ["class1\\:hover\\:class2", "class3\\:hover\\:class4", "class5", "class6\\:hover\\:class7", "hover\\:class8\\:class9"]
        });
    });

    test("should ignore [attribute] selector that not in the same scope as class", () => {
        const sample = ":is(.class1 .class2\\:class3\\:\\!class4)[aria-selected=\"true\"]";

        // Act
        const result = extractClassFromSelector(sample);

        // Assert
        expect(result).toEqual({
            selector: sample,
            extractedClasses: ["class1", "class2\\:class3\\:\\!class4"]
        });
    });

    test("should return null for invalid input types", () => {
        // Act & Assert
        // @ts-ignore
        expect(() => extractClassFromSelector(null)).toThrow(TypeError);
        // @ts-ignore
        expect(() => extractClassFromSelector(undefined)).toThrow(TypeError);
        expect(() => extractClassFromSelector(123 as any)).toThrow(TypeError);
    });


    //? *********************
    //? Tailwind CSS
    //? *********************
    test("should handle Tailwind CSS important selector '!'", () => {
        const sample = ".\\!my-0 .some-class\\:\\!bg-white";

        // Act
        const result = extractClassFromSelector(sample);

        // Assert
        expect(result).toEqual({
            selector: sample,
            extractedClasses: ["\\!my-0", "some-class\\:\\!bg-white"]
        })
    });

    test("should handle Tailwind CSS selector with start with '-'", () => {
        const sample = ".-class-1";

        // Act
        const result = extractClassFromSelector(sample);

        // Assert
        expect(result).toEqual({
            selector: sample,
            extractedClasses: ["-class-1"]
        })
    });

    test("should handle Tailwind CSS selector with '.' at the number", () => {
        const sample = ".class-0\\.5 .class-1\\.125";

        // Act
        const result = extractClassFromSelector(sample);

        // Assert
        expect(result).toEqual({
            selector: sample,
            extractedClasses: ["class-0\\.5", "class-1\\.125"]
        })
    });

    test("should handle Tailwind CSS selector with '/' at the number", () => {
        const sample = ".class-1\\/2";

        // Act
        const result = extractClassFromSelector(sample);

        // Assert
        expect(result).toEqual({
            selector: sample,
            extractedClasses: ["class-1\\/2"]
        })
    });

    test("should handle Tailwind CSS universal selector", () => {
        const sample = ".\\*\\:class1 .class2\\*\\:class3";

        // Act
        const result = extractClassFromSelector(sample);

        // Assert
        expect(result).toEqual({
            selector: sample,
            extractedClasses: ["\\*\\:class1", "class2", "class3"]
        })
    });

    test("should handle Tailwind CSS [custom parameter] selector", () => {
        const sample = ".class1[100] .class2-[200]";

        // Act
        const result = extractClassFromSelector(sample);

        // Assert
        expect(result).toEqual({
            selector: sample,
            extractedClasses: ["class1[100]", "class2-[200]"]
        })
    });

    test("should handle Tailwind CSS [custom parameter] selector with escaped characters", () => {
        const sample = ".class1\\[1em\\] .class2-\\[2em\\] .class3\\[3\\%\\] .class4-\\[4\\%\\]";

        // Act
        const result = extractClassFromSelector(sample);

        // Assert
        expect(result).toEqual({
            selector: sample,
            extractedClasses: ["class1\\[1em\\]", "class2-\\[2em\\]", "class3\\[3\\%\\]", "class4-\\[4\\%\\]"]
        })
    });

    test("should handle complex Tailwind CSS [custom parameter] selector", () => {
        const sample = ".w-\\[calc\\(10\\%\\+5px\\)\\]";

        // Act
        const result = extractClassFromSelector(sample);

        // Assert
        expect(result).toEqual({
            selector: sample,
            extractedClasses: ["w-\\[calc\\(10\\%\\+5px\\)\\]"]
        })
    });

    test("should ignore Tailwind CSS [custom parameter] selector that not in the same scope as class", () => {
        const sample = ":is(.class1)[100]";

        // Act
        const result = extractClassFromSelector(sample);

        // Assert
        expect(result).toEqual({
            selector: sample,
            extractedClasses: ["class1"]
        })
    });
});

//! ================================
//! searchForwardComponent
//! ================================

describe("searchForwardComponent", () => {

    test("should return component name when jsx format is correct", () => {
        // Arrange
        const content = `const element = o.jsx(ComponentName, {data: dataValue, index: "date"});`;

        // Act
        const result = searchForwardComponent(content);

        // Assert
        expect(result).toEqual(["ComponentName"]);
    });

    test("should return multiple component names for multiple matches", () => {
        // Arrange
        const content = `o.jsx(FirstComponent, props); o.jsx(SecondComponent, otherProps);`;

        // Act
        const result = searchForwardComponent(content);

        // Assert
        expect(result).toEqual(["FirstComponent", "SecondComponent"]);
    });

    test("should return an empty array when no component name is found", () => {
        // Arrange
        const content = `o.jsx("h1", {data: dataValue, index: "date"});`;

        // Act
        const result = searchForwardComponent(content);

        // Assert
        expect(result).toEqual([]);
    });

    test("should return an empty array when content is empty", () => {
        // Arrange
        const content = "";

        // Act
        const result = searchForwardComponent(content);

        // Assert
        expect(result).toEqual([]);
    });

    test("should return an empty array when jsx is not used", () => {
        // Arrange
        const content = `const element = React.createElement("div", null, "Hello World");`;

        // Act
        const result = searchForwardComponent(content);

        // Assert
        expect(result).toEqual([]);
    });

    test("should handle special characters in component names", () => {
        // Arrange
        const content = `o.jsx($Comp_1, props); o.jsx(_Comp$2, otherProps);`;

        // Act
        const result = searchForwardComponent(content);

        // Assert
        expect(result).toEqual(["$Comp_1", "_Comp$2"]);
    });

    test("should not return component names when they are quoted", () => {
        // Arrange
        const content = `o.jsx("ComponentName", props); o.jsx('AnotherComponent', otherProps);`;

        // Act
        const result = searchForwardComponent(content);

        // Assert
        expect(result).toEqual([]);
    });

    test("should return component names when they are followed by a brace", () => {
        // Arrange
        const content = `o.jsx(ComponentName, {props: true});`;

        // Act
        const result = searchForwardComponent(content);

        // Assert
        expect(result).toEqual(["ComponentName"]);
    });

    test("should handle content with line breaks and multiple jsx calls", () => {
        // Arrange
        const content = `
      o.jsx(FirstComponent, {data: dataValue});
      o.jsx(SecondComponent, {index: "date"});
      o.jsx(ThirdComponent, {flag: true});
    `;

        // Act
        const result = searchForwardComponent(content);

        // Assert
        expect(result).toEqual(["FirstComponent", "SecondComponent", "ThirdComponent"]);
    });

    test("should handle content with nested jsx calls", () => {
        // Arrange
        const content = `o.jsx(ParentComponent, {children: o.jsx(ChildComponent, {})})`;

        // Act
        const result = searchForwardComponent(content);

        // Assert
        expect(result).toEqual(["ParentComponent", "ChildComponent"]);
    });

});
