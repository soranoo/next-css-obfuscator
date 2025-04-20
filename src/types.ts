import type { ConversionTables } from "css-seasoning";

type LogLevel = "debug" | "info" | "warn" | "error" | "success";
type obfuscateMode = "random" | "simplify";
type SelectorConversion = ConversionTables["selector"];

type Options = {
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
    /**
     * @deprecated
     */
    includeAnyMatchRegexes?: RegExp[];
    /**
     * @deprecated
     */
    excludeAnyMatchRegexes?: RegExp[];
    enableMarkers: boolean;
    markers: string[];
    removeMarkersAfterObfuscated: boolean;
    removeOriginalCss: boolean;
    generatorSeed: string;

    enableJsAst: boolean;

    logLevel: LogLevel;
}
type OptionalOptions = {
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
    /**
     * @deprecated
     */
    includeAnyMatchRegexes?: RegExp[];
    /**
     * @deprecated
     */
    excludeAnyMatchRegexes?: RegExp[];
    enableMarkers?: boolean;
    markers?: string[];
    removeMarkersAfterObfuscated?: boolean;
    removeOriginalCss?: boolean;
    generatorSeed?: string;

    enableJsAst?: boolean;

    logLevel?: LogLevel;
}

interface HtmlCharacterEntityConversion {
    [key: string]: string;
}

export {
    type LogLevel,
    type obfuscateMode,
    type SelectorConversion,
    type Options,
    type OptionalOptions,
    type HtmlCharacterEntityConversion
}