# Toward to version 2

### Configuration

We have added a new individual configuration file `next-css-obfuscator.config.cjs`. The old configuration in `postcss.config.cjs` was deprecated. You can use the following Table to migrate your configuration.

| Old configuration    | New configuration              |
| -------------------- | ------------------------------ |
| enable               | enabled                        |
| length               | classLength                    |
| classMethod          | mode                           |
| classPrefix          | classPrefix                    |
| classSuffix          | classSuffix                    |
| classIgnore          | classIgnore                    |
| ids                  | ⛔                             |
| idMethod             | ⛔                             |
| idPrefix             | ⛔                             |
| idSuffix             | ⛔                             |
| idIgnore             | ⛔                             |
| indicatorStart       | ⛔                             |
| indicatorEnd         | ⛔                             |
| jsonsPath            | classConversionJsonFolderPath  |
| srcPath              | buildFolderPath                |
| desPath              | buildFolderPath                |
| extensions           | allowExtensions                |
| ➡️                   | contentIgnoreRegexes           |
| formatJson           | ⛔                             |
| showConfig           | ⛔                             |
| keepData             | ⛔                             |
| preRun               | ⛔                             |
| callBack             | ⛔                             |
| whiteListedPaths     | whiteListedFolderPaths         |
| blackListedPaths     | blackListedFolderPaths         |
| ➡️                   | includeAnyMatchRegexes         |
| excludeAnyMatchRegex | excludeAnyMatchRegex           |
| ➡️                   | refreshClassConversionJson     |
| ➡️                   | enableMarkers                  |
| ➡️                   | removeMarkersAfterObfuscated   |
| ➡️                   | customTailwindDarkModeSelector |
| ➡️                   | logLevel                       |
