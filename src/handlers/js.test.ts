import { describe, it, expect, test } from "vitest";
import {
    searchForwardComponent,
} from "./js";

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
