import type { ConversionTables } from "css-seasoning";

export type LogLevel = "debug" | "info" | "warn" | "error" | "success";
export type obfuscateMode = "random" | "simplify";
export type SelectorConversion = ConversionTables["selector"];

export type Options = {
    enable: boolean;
    mode: obfuscateMode;
    buildFolderPath: string;
    classConversionJsonFolderPath: string;
    refreshClassConversionJson: boolean;

    classLength: number;
    classPrefix: string;
    classSuffix: string;
    classIgnore: (string | RegExp)[];
    allowExtensions: string[];
    contentIgnoreRegexes: RegExp[];

    whiteListedFolderPaths: (string | RegExp)[];
    blackListedFolderPaths: (string | RegExp)[];
    enableMarkers: boolean;
    markers: string[];
    removeMarkersAfterObfuscated: boolean;
    removeOriginalCss: boolean;
    generatorSeed: string;

    enableJsAst: boolean;

    logLevel: LogLevel;
}

export type OptionalOptions = {
    enable?: boolean;
    mode?: obfuscateMode;
    buildFolderPath?: string;
    classConversionJsonFolderPath?: string;
    refreshClassConversionJson?: boolean;

    classLength?: number;
    classPrefix?: string;
    classSuffix?: string;
    classIgnore?: string[];
    allowExtensions?: string[];
    contentIgnoreRegexes: RegExp[];

    whiteListedFolderPaths?: (string | RegExp)[];
    blackListedFolderPaths?: (string | RegExp)[];
    enableMarkers?: boolean;
    markers?: string[];
    removeMarkersAfterObfuscated?: boolean;
    removeOriginalCss?: boolean;
    generatorSeed?: string;

    enableJsAst?: boolean;

    logLevel?: LogLevel;
}

export interface HtmlCharacterEntityConversion {
    [key: string]: string;
}
