# Toward to version 3

Version 3 introduces several breaking changes, primarily focused on supporting TailwindCSS 4, nested CSS, and CSS ident obfuscation. Please review the configuration changes below carefully before upgrading.

## Configuration

The following table outlines the changes to the configuration options from version 2.x to 3.x:

| Old configuration (v2.x)       | New configuration (v3.x)             | Notes                                                                                                                               |
| ------------------------------ | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `generatorSeed` (default: -1)  | `generatorSeed` (default: {random})  | Default seed is now a random string. Provide a fixed string if you need consistent output across builds (e.g., for CDN caching). |
| `mode: "simplify-seedable"`    | ⛔ (Removed)                         | Use `mode: "random"` with a fixed `generatorSeed` instead.                                                                          |
| `classLength`                  | ⛔ (Deprecated)                      | No longer supported. Will be removed in the next major version.                               |
| `classPrefix`                  | `prefix.selectors`                | Renamed for clarity, now applies to both selectors and idents. `classPrefix` will be removed in the next major version.             |
| ➡️                             | `prefix.idents`              | New option to add specific prefix idents|
| `classSuffix`                  | `suffix.selectors`                | Renamed for clarity, now applies to both selectors and idents. `classSuffix` will be removed in the next major version.             |
| ➡️                             | `suffix.idents`              | New option to add specific suffix idents|
| `classIgnore`                  | `ignorePatterns.selectors` | Merged into the new `ignorePatterns` object. `classIgnore` will be removed in the next major version.                               |
| ➡️                             | `ignorePatterns.idents`              | New option to ignore specific CSS idents|
| `includeAnyMatchRegexes`       | ⛔ (Removed)                         | Use `whiteListedFolderPaths` instead.                                                                                               |
| `excludeAnyMatchRegexes`       | ⛔ (Removed)                         | Use `blackListedFolderPaths` instead.                                                                                               |
| (Implicit `.dark` preservation)| (No implicit preservation)           | TailwindCSS `.dark` class is no longer preserved by default. Add `.dark` or relevant selectors to `ignorePatterns.selectors`.       |
