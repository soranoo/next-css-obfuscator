import type { SelectorConversion } from '../types';

import { describe, it, expect } from "vitest";

import {
  obfuscateHtmlClassNames,
} from "../handlers/html";

//! ================================
//! obfuscateHtmlClassNames
//! ================================

describe("obfuscateHtmlClassNames", () => {

  it("should obfuscate class names correctly", () => {
    // Arrange
    const html = `<div class="foo"></div>`;
    const selectorConversion: SelectorConversion = { "\\.foo": "\\.a" };

    // Act
    const result = obfuscateHtmlClassNames({ html, selectorConversion });

    // Assert
    expect(result.obfuscatedContent).toEqual(`<div class="a"></div>`);
    expect(result.usedKeys).to.deep.equal(["\\.foo"]);
  });

  it("should handle nested tags with obfuscate class", () => {
    // Arrange
    const html = `<div class="key"><span class="foo"></span><span class="foo"></span></div>`;
    const selectorConversion: SelectorConversion = { "\\.foo": "\\.a" };
    const keyClass = "key";

    // Act
    const result = obfuscateHtmlClassNames({ html, selectorConversion, obfuscateMarkerClass: keyClass });

    // Assert
    expect(result.obfuscatedContent).toEqual(`<div class="key"><span class="a"></span><span class="a"></span></div>`);
    expect(result.usedKeys).to.deep.equal(["\\.foo"]);
  });

  it("should not obfuscate class names outside of obfuscate class scope", () => {
    // Arrange
    const html = `<div class="foo"><span class="bar"></span></div>`;
    const selectorConversion: SelectorConversion = { "\\.foo": "\\.a", "\\.bar": "\\.b" };
    const keyClass = "key";

    // Act
    const result = obfuscateHtmlClassNames({ html, selectorConversion, obfuscateMarkerClass: keyClass });

    // Assert
    expect(result.obfuscatedContent).toEqual(`<div class="foo"><span class="bar"></span></div>`);
    expect(result.usedKeys).to.deep.equal([]);
  });

  it("should handle script tags", () => {
    // Arrange
    const html = `<script>self.__next_f.push({\\"className\\":\\"fol foo\\",})</script>`;
    const selectorConversion: SelectorConversion = { "\\.fol": "\\.a", "\\.foo": "\\.b" };

    // Act
    const result = obfuscateHtmlClassNames({ html, selectorConversion, obfuscateMarkerClass: "" });

    // Assert
    expect(result.obfuscatedContent).toEqual(`<script>self.__next_f.push({\\"className\\":\\"a b\\",})</script>`);
    expect(result.usedKeys).to.deep.equal(["\\.fol", "\\.foo"]);
  });

  it("should handle void tags", () => {
    // Arrange
    const html = `<img class="foo" />`;
    const selectorConversion: SelectorConversion = { "\\.foo": "\\.a" };

    // Act
    const result = obfuscateHtmlClassNames({ html, selectorConversion });

    // Assert
    expect(result.obfuscatedContent).toEqual(`<img class="a" />`);
    expect(result.usedKeys).to.deep.equal(["\\.foo"]);
  });


  it("should handle comments", () => {
    // Arrange
    const html = `<!-- This is a comment --><div class="foo"></div>`;
    const selectorConversion: SelectorConversion = { "\\.foo": "\\.a" };

    // Act
    const result = obfuscateHtmlClassNames({ html, selectorConversion });

    // Assert
    expect(result.obfuscatedContent).toEqual(`<!-- This is a comment --><div class="a"></div>`);
    expect(result.usedKeys).to.deep.equal(["\\.foo"]);
  });

  it("should handle HTML without classes", () => {
    // Arrange
    const html = "<div></div>";
    const selectorConversion: SelectorConversion = {};

    // Act
    const result = obfuscateHtmlClassNames({ html, selectorConversion });

    // Assert
    expect(result.obfuscatedContent).toEqual("<div></div>");
    expect(result.usedKeys).to.deep.equal([]);
  });

  it("should handle empty HTML", () => {
    // Arrange
    const html = "";
    const selectorConversion: SelectorConversion = { "\\.foo": "\\.a" };

    // Act
    const result = obfuscateHtmlClassNames({ html, selectorConversion });

    // Assert
    expect(result.obfuscatedContent).toEqual("");
    expect(result.usedKeys).to.deep.equal([]);
  });

  it("should handle HTML with multiple classes in one element", () => {
    // Arrange
    const html = `<div class="foo bar baz"></div>`;
    const selectorConversion: SelectorConversion = { "\\.foo": "\\.a", "\\.bar": "\\.b", "\\.baz": "\\.c" };

    // Act
    const result = obfuscateHtmlClassNames({ html, selectorConversion });

    // Assert
    expect(result.obfuscatedContent).toEqual(`<div class="a b c"></div>`);
    expect(result.usedKeys).to.deep.equal(["\\.foo", "\\.bar", "\\.baz"]);
  });

  it("should handle HTML with nested structures and multiple classes", () => {
    // Arrange
    const html = `<div class="foo"><span class="bar"><i class="baz"></i></span></div>`;
    const selectorConversion: SelectorConversion = { "\\.foo": "\\.a", "\\.bar": "\\.b", "\\.baz": "\\.c" };

    // Act
    const result = obfuscateHtmlClassNames({ html, selectorConversion });

    // Assert
    expect(result.obfuscatedContent).toEqual(`<div class="a"><span class="b"><i class="c"></i></span></div>`);
    expect(result.usedKeys).to.deep.equal(["\\.foo", "\\.bar", "\\.baz"]);
  });

  it("should handle HTML with obfuscate marker class", () => {
    // Arrange
    const html = `<div class="key"><span class="foo"></span><span class="foo"></span></div>`;
    const selectorConversion: SelectorConversion = { "\\.foo": "\\.a" };
    const obfuscateMarkerClass = "key";

    // Act
    const result = obfuscateHtmlClassNames({ html, selectorConversion, obfuscateMarkerClass });

    // Assert
    expect(result.obfuscatedContent).toEqual(`<div class="key"><span class="a"></span><span class="a"></span></div>`);
    expect(result.usedKeys).to.deep.equal(["\\.foo"]);
  });

  it("should handle HTML with multiple classes and obfuscate marker class", () => {
    // Arrange
    const html = `<div class="key foo bar baz"></div>`;
    const selectorConversion: SelectorConversion = { "\\.foo": "\\.a", "\\.bar": "\\.b", "\\.baz": "\\.c" };
    const obfuscateMarkerClass = "key";

    // Act
    const result = obfuscateHtmlClassNames({ html, selectorConversion, obfuscateMarkerClass });

    // Assert
    expect(result.obfuscatedContent).toEqual(`<div class="key a b c"></div>`);
    expect(result.usedKeys).to.deep.equal(["\\.foo", "\\.bar", "\\.baz"]);
  });

  it("should handle HTML instruction", () => {
    // Arrange
    const html = `<!DOCTYPE html><div class="foo"></div>`;
    const selectorConversion: SelectorConversion = { "\\.foo": "\\.a" };

    // Act
    const result = obfuscateHtmlClassNames({ html, selectorConversion });

    // Assert
    expect(result.obfuscatedContent).toEqual(`<!DOCTYPE html><div class="a"></div>`);
    expect(result.usedKeys).to.deep.equal(["\\.foo"]);
  });

  /**
   * @see https://github.com/soranoo/next-css-obfuscator/issues/57
   */
  it("should handle double quot inside double quot", () => {
    // Arrange
    const html = `<div data-opts="{&quot;name&quot;:&quot;MyReactComponent&quot;,&quot;value&quot;:true}" class="foo"></div>`;
    const selectorConversion: SelectorConversion = { "\\.foo": "\\.a" };

    // Act
    const result = obfuscateHtmlClassNames({ html, selectorConversion });

    // Assert
    expect(result.obfuscatedContent).toEqual(`<div data-opts="{&quot;name&quot;:&quot;MyReactComponent&quot;,&quot;value&quot;:true}" class="a"></div>`);
    expect(result.usedKeys).to.deep.equal(["\\.foo"]);
  });
});
