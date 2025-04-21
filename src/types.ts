import type { ConversionTables, TransformProps } from "css-seasoning";

export type LogLevel = "debug" | "info" | "warn" | "error" | "success";
export type obfuscateMode = "random" | "simplify";
export type SelectorConversion = ConversionTables["selectors"];

export type Options = {
  enable: boolean;
  mode: obfuscateMode;
  buildFolderPath: string;
  classConversionJsonFolderPath: string;
  refreshClassConversionJson: boolean;

  /**
   * @deprecated Not longer used from v3.0.0 and will be removed in the next major version.
   */
  classLength: number;

  /**
   * @deprecated Merged into `prefix` from v3.0.0 and will be removed in the next major version.
   */
  classPrefix: string;
  /**
   * @deprecated Merged into `suffix` from v3.0.0 and will be removed in the next major version.
   */
  classSuffix: string;
  prefix: string;
  suffix: string;

  /**
   * @deprecated Merged into `ignorePatterns.selectors` from v3.0.0 and will be removed in the next major version.
   */
  classIgnore: (string | RegExp)[];
  ignorePatterns: TransformProps["ignorePatterns"];

  allowExtensions: string[];
  contentIgnoreRegexes: RegExp[];

  whiteListedFolderPaths: (string | RegExp)[];
  blackListedFolderPaths: (string | RegExp)[];
  enableMarkers: boolean;
  markers: string[];
  removeMarkersAfterObfuscated: boolean;
  removeOriginalCss: boolean;
  generatorSeed: string | undefined;

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
