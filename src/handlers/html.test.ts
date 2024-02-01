import {
    findHtmlTagContentsByClass,
} from "./html";

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
