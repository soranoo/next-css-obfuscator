// @ts-ignore
import css from "css";

import {
    copyCssData,
    renameCssSelector,
    extractClassFromSelector,
} from "./css";

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


//! ================================
//! renameCssSelector
//! ================================

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
            extractedClasses: ["class1", "class2"]
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
        const sample = ".class1\\[100\\] .class2-\\[200\\]";

        // Act
        const result = extractClassFromSelector(sample);

        // Assert
        expect(result).toEqual({
            selector: sample,
            extractedClasses: ["class1\\[100\\]", "class2-\\[200\\]"]
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
