// @ts-ignore
import css from "css";
import { copyCssData, findContentBetweenMarker, findHtmlTagContentsByClass } from "./utils";

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
// function renameCssSelector(oldSelector: string, newSelector: string, cssObj: any): any[] {
//     function recursive(rules: any[]): any[] {
//         return rules.map((item: any) => {
//             if (item.rules) {
//                 return { ...item, rules: recursive(item.rules) };
//             } else if (item.selectors) {
//                 // remove empty selectors
//                 item.selectors = item.selectors.filter((selector: any) => selector !== "");

//                 let updatedSelectors = item.selectors.map((selector: any) =>
//                     selector === oldSelector ? newSelector : selector
//                 );

//                 return { ...item, selectors: updatedSelectors };
//             } else {
//                 return item;
//             }
//         });
//     }
//     return recursive(cssObj.stylesheet.rules);
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

// describe("renameCssSelector", () => {
//     it("should rename the CSS selector (single selector, no nested rule)", () => {
//         const cssObj = css.parse(testCss);

//         const oldSelector = ".s1-1";
//         const newSelector = ".s1-1-new";
//         const expectedOutput = [{ "type": "rule", "selectors": [".s0-1"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181810", "position": { "start": { "line": 3, "column": 5 }, "end": { "line": 3, "column": 24 } } }, { "type": "declaration", "property": "color", "value": "#181811", "position": { "start": { "line": 4, "column": 5 }, "end": { "line": 4, "column": 19 } } }], "position": { "start": { "line": 2, "column": 1 }, "end": { "line": 5, "column": 2 } } }, { "type": "media", "media": "(min-width: 640px)", "rules": [{ "type": "rule", "selectors": [".s1-1-new"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181812", "position": { "start": { "line": 11, "column": 9 }, "end": { "line": 11, "column": 28 } } }, { "type": "declaration", "property": "color", "value": "#181813", "position": { "start": { "line": 12, "column": 9 }, "end": { "line": 12, "column": 23 } } }], "position": { "start": { "line": 9, "column": 5 }, "end": { "line": 13, "column": 6 } } }, { "type": "media", "media": "(min-width: 768px)", "rules": [{ "type": "rule", "selectors": [".s2-1", ".s2-1-1"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181814", "position": { "start": { "line": 18, "column": 13 }, "end": { "line": 18, "column": 32 } } }, { "type": "declaration", "property": "color", "value": "#181815", "position": { "start": { "line": 19, "column": 13 }, "end": { "line": 19, "column": 27 } } }], "position": { "start": { "line": 17, "column": 9 }, "end": { "line": 20, "column": 10 } } }, { "type": "rule", "selectors": [".s2-2", ".s2-2-2"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181816", "position": { "start": { "line": 22, "column": 13 }, "end": { "line": 22, "column": 32 } } }, { "type": "declaration", "property": "color", "value": "#181817", "position": { "start": { "line": 23, "column": 13 }, "end": { "line": 23, "column": 27 } } }], "position": { "start": { "line": 20, "column": 10 }, "end": { "line": 24, "column": 10 } } }, { "type": "rule", "selectors": [".s2-3"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181818", "position": { "start": { "line": 26, "column": 13 }, "end": { "line": 26, "column": 32 } } }, { "type": "declaration", "property": "color", "value": "#181819", "position": { "start": { "line": 27, "column": 13 }, "end": { "line": 27, "column": 27 } } }], "position": { "start": { "line": 24, "column": 10 }, "end": { "line": 28, "column": 10 } } }], "position": { "start": { "line": 15, "column": 5 }, "end": { "line": 29, "column": 6 } } }, { "type": "rule", "selectors": [".s1-2"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181820", "position": { "start": { "line": 33, "column": 9 }, "end": { "line": 33, "column": 28 } } }, { "type": "declaration", "property": "color", "value": "#181821", "position": { "start": { "line": 34, "column": 9 }, "end": { "line": 34, "column": 23 } } }], "position": { "start": { "line": 31, "column": 5 }, "end": { "line": 35, "column": 6 } } }], "position": { "start": { "line": 7, "column": 1 }, "end": { "line": 36, "column": 2 } } }, { "type": "rule", "selectors": [".s0-2"], "declarations": [{ "type": "declaration", "property": "background", "value": "#181822", "position": { "start": { "line": 39, "column": 5 }, "end": { "line": 39, "column": 24 } } }, { "type": "declaration", "property": "color", "value": "#181823", "position": { "start": { "line": 40, "column": 5 }, "end": { "line": 40, "column": 19 } } }], "position": { "start": { "line": 38, "column": 1 }, "end": { "line": 41, "column": 2 } } }];

//         const result = renameCssSelector(oldSelector, newSelector, cssObj);
//         expect(result).toEqual(expectedOutput);
//     });

//     // it("should rename the CSS selector (multiple nested media queries)", () => {
//     //     const cssObj = css.parse(testCss);

//     //     const oldSelector = ".s2-2";
//     //     const newSelector = ".s2-2-new";
//     //     const expectedOutput = [{ "type": "rule", "selectors": [".s0"], "declarations": [{ "type": "declaration", "property": "background", "value": "#eee", "position": { "start": { "line": 3, "column": 5 }, "end": { "line": 3, "column": 21 } } }, { "type": "declaration", "property": "color", "value": "#888", "position": { "start": { "line": 4, "column": 5 }, "end": { "line": 4, "column": 16 } } }], "position": { "start": { "line": 2, "column": 1 }, "end": { "line": 5, "column": 2 } } }, { "type": "media", "media": "(min-width: 640px)", "rules": [{ "type": "rule", "selectors": [".s1"], "declarations": [{ "type": "declaration", "property": "background", "value": "#eee", "position": { "start": { "line": 11, "column": 9 }, "end": { "line": 11, "column": 25 } } }, { "type": "declaration", "property": "color", "value": "#888", "position": { "start": { "line": 12, "column": 9 }, "end": { "line": 12, "column": 20 } } }], "position": { "start": { "line": 9, "column": 5 }, "end": { "line": 13, "column": 6 } } }, { "type": "media", "media": "(min-width: 768px)", "rules": [{ "type": "rule", "selectors": [".s2-1"], "declarations": [{ "type": "declaration", "property": "background", "value": "#eee", "position": { "start": { "line": 18, "column": 13 }, "end": { "line": 18, "column": 29 } } }, { "type": "declaration", "property": "color", "value": "#888", "position": { "start": { "line": 19, "column": 13 }, "end": { "line": 19, "column": 24 } } }], "position": { "start": { "line": 17, "column": 9 }, "end": { "line": 20, "column": 10 } } }, { "type": "rule", "selectors": [".s2-2-new"], "declarations": [{ "type": "declaration", "property": "background", "value": "#eee", "position": { "start": { "line": 22, "column": 13 }, "end": { "line": 22, "column": 29 } } }, { "type": "declaration", "property": "color", "value": "#888", "position": { "start": { "line": 23, "column": 13 }, "end": { "line": 23, "column": 24 } } }], "position": { "start": { "line": 20, "column": 10 }, "end": { "line": 24, "column": 10 } } }, { "type": "rule", "selectors": [".s2-3"], "declarations": [{ "type": "declaration", "property": "background", "value": "#eee", "position": { "start": { "line": 26, "column": 13 }, "end": { "line": 26, "column": 29 } } }, { "type": "declaration", "property": "color", "value": "#888", "position": { "start": { "line": 27, "column": 13 }, "end": { "line": 27, "column": 24 } } }], "position": { "start": { "line": 24, "column": 10 }, "end": { "line": 28, "column": 10 } } }], "position": { "start": { "line": 15, "column": 5 }, "end": { "line": 29, "column": 6 } } }], "position": { "start": { "line": 7, "column": 1 }, "end": { "line": 30, "column": 2 } } }];

//     //     const result = renameCssSelector(oldSelector, newSelector, cssObj);
//     // console.log(JSON.stringify(result));
//     //     expect(result).toEqual(expectedOutput);
//     // });
// });

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
        const content = `123{45{67}8}901{2345678}9`;
        const targetStr = '5';
        const openSymbol = '{';
        const closeSymbol = '}';

        const expectedOutput = ["45{67}8", "2345678"];

        const result = findContentBetweenMarker(content, targetStr, openSymbol, closeSymbol);
        expect(result).toEqual(expectedOutput);
    });

    it('should return the correct content between (if marker length > 1)', () => {
        const content = '[Hello_0 [[Hello_1]]! Hello_2 [[Hello_3]]!]';
        const targetStr = 'He';
        const openSymbol = '[[';
        const closeSymbol = ']]';

        const expectedOutput = ['Hello_1', 'Hello_3'];

        const result = findContentBetweenMarker(content, targetStr, openSymbol, closeSymbol);
        expect(result).toEqual(expectedOutput);
    });
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

        const expectedOutput:any[] = [];

        const result = findHtmlTagContentsByClass(content, targetClass);
        expect(result).toEqual(expectedOutput);
    });
});
