import { describe, it, expect, test, beforeEach } from "vitest";
import {
  findContentBetweenMarker,
  getFilenameFromPath,
  duplicationCheck,
} from "../utils";
import NumberGenerator from "recoverable-random";


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
//! duplicationCheck
//! ================================

describe("duplicationCheck", () => {

  test("should return false for an array with no duplicates", () => {
    // Arrange
    const input = ["apple", "banana", "cherry"];

    // Act
    const result = duplicationCheck(input);

    // Assert
    expect(result).toBe(false);
  });

  test("should return true for an array with duplicates", () => {
    // Arrange
    const input = ["apple", "banana", "apple"];

    // Act
    const result = duplicationCheck(input);

    // Assert
    expect(result).toBe(true);
  });

  test("should return false for an empty array", () => {
    // Arrange
    const input: string[] = [];

    // Act
    const result = duplicationCheck(input);

    // Assert
    expect(result).toBe(false);
  });

  test("should return false for an array with one element", () => {
    // Arrange
    const input = ["apple"];

    // Act
    const result = duplicationCheck(input);

    // Assert
    expect(result).toBe(false);
  });

  test("should return true for an array with all elements being the same", () => {
    // Arrange
    const input = ["apple", "apple", "apple"];

    // Act
    const result = duplicationCheck(input);

    // Assert
    expect(result).toBe(true);
  });

  test("should handle case sensitivity properly", () => {
    // Arrange
    const input = ["apple", "Apple"];

    // Act
    const result = duplicationCheck(input);

    // Assert
    expect(result).toBe(false);
  });

  test("should return true for an array with duplicates that are not adjacent", () => {
    // Arrange
    const input = ["apple", "banana", "cherry", "apple", "date"];

    // Act
    const result = duplicationCheck(input);

    // Assert
    expect(result).toBe(true);
  });

  test("should return false for an array with similar but unique strings", () => {
    // Arrange
    const input = ["a", "ab", "abc", "abcd"];

    // Act
    const result = duplicationCheck(input);

    // Assert
    expect(result).toBe(false);
  });
});
