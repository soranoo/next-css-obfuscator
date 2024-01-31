type LogLevel = "debug" | "info" | "warn" | "error" | "success";
type obfuscateMode = "random" | "simplify";
type SelectorConversion = { [key: string]: string };

type Options = {
    enable: boolean;
    mode: obfuscateMode;
    buildFolderPath: string;
    classConversionJsonFolderPath: string;
    refreshClassConversionJson: boolean;

    classLength: number;
    classPrefix: string;
    classSuffix: string;
    classIgnore: string[];
    allowExtensions: string[];
    contentIgnoreRegexes: RegExp[];

    whiteListedFolderPaths: string[];
    blackListedFolderPaths: string[];
    includeAnyMatchRegexes: RegExp[];
    excludeAnyMatchRegexes: RegExp[];
    enableMarkers: boolean;
    markers: string[];
    removeMarkersAfterObfuscated: boolean;
    removeOriginalCss: boolean;

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

    whiteListedFolderPaths?: string[];
    blackListedFolderPaths?: string[];
    includeAnyMatchRegexes?: RegExp[];
    excludeAnyMatchRegexes?: RegExp[];
    enableMarkers?: boolean;
    markers?: string[];
    removeMarkersAfterObfuscated?: boolean;
    removeOriginalCss?: boolean;

    logLevel?: LogLevel;
}

export {
    type LogLevel,
    type obfuscateMode,
    type SelectorConversion,
    type Options,
    type OptionalOptions,
}