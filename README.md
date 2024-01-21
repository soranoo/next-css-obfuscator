# NEXT-CSS-OBFUSCATOR

Project start on 30-10-2023

![Tests](https://github.com/soranoo/next-css-obfuscator/actions/workflows/auto_test.yml/badge.svg) [![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)&nbsp;&nbsp;&nbsp;[![Donation](https://img.shields.io/static/v1?label=Donation&message=❤️&style=social)](https://github.com/soranoo/Donation)


[![npm version](https://img.shields.io/npm/v/next-css-obfuscator?color=red&style=flat)](https://www.npmjs.com/package/next-css-obfuscator) [![npm downloads](https://img.shields.io/npm/dt/next-css-obfuscator?color=blue&style=flat)](https://www.npmjs.com/package/next-css-obfuscator)

### 🎉 Version 2 has NOW been released 🎉
  This version is deeply inspired by [PostCSS-Obfuscator](https://github.com/n4j1Br4ch1D/postcss-obfuscator). Shout out to [n4j1Br4ch1D](https://github.com/n4j1Br4ch1D) for creating such a great package and thank you [tremor](https://github.com/tremorlabs) for sponsoring this project.

  #### Changes:
  - Support partially obfuscation
  - Support TailwindCSS Dark Mode
  - New configuration file `next-css-obfuscator.config.cjs`
  - More configuration options
  - Now become a independent sulotion (no need to patch `PostCSS-Obfuscator` anymore)
  - More tests
  - Better CSS parsing
  
  #### Migration Guide:
  - [Migrate from version 1.x to 2.x](docs/upgrade-to-v2.md)


[version 1.x README](https://github.com/soranoo/next-css-obfuscator/tree/v.1.1.0)

Give me a ⭐ if you like it.

## 📖 Table of Contents

- [🤔 Why this?](#-why-this)
- [💡 How does it work?](#-how-does-it-work)
  - [Where is issue in PostCSS-Obfuscator?](#where-is-issue-in-postcss-obfuscator)
  - [How does this package solve the issue?](#how-does-this-package-solve-the-issue)
  - [How does this package work?](#how-does-this-package-work)
- [🗝️ Features](#️-features)
- [🛠️ Development Environment](#️-development-environment)
- [🚀 Getting Started](#-getting-started)
  - [Installation](#installation)
  - [Setup](#setup)
  - [Usage 🎉](#usage-)
- [🔧 My Setting](#-my-setting)
- [📖 PostCSS Options Reference](#-postcss-options-reference)
- [💻 CLI](#-cli)
- [💡 Tips](#-tips)
  - [1. Not work at Vercel after updated](#1-not-work-at-vercel-after-updated)
  - [2. Lazy Setup - Obfuscate all files](#2-lazy-setup---obfuscate-all-files)
  - [3. It was working normally just now, but not now?](#3-it-was-working-normally-just-now-but-not-now)
- [👀 Demos](#-demos)
- [⭐ TODO](#-todo)
- [🐛 Known Issues](#-known-issues)
- [💖 Sponsors](#-sponsors)
- [🤝 Contributing](#-contributing)
- [📝 License](#-license)
- [☕ Donation](#-donation)

## 🤔 Why this?

Because in the current version of [PostCSS-Obfuscator](https://github.com/n4j1Br4ch1D/postcss-obfuscator) does not work with Next.js. (see [this issue](https://github.com/n4j1Br4ch1D/postcss-obfuscator/issues/15) for more details)

## 💡 How does it work?

### Where is issue in PostCSS-Obfuscator?

`PostCSS-Obfuscator` will not edit the build files instead it will create a new folder and put the obfuscated source code files in it. This is where the issue is. Next.js will not recognize the obfuscated files and will not include them in the build. I tried to point Nextjs to build the obfuscated files (by simply change the obfuscated source code folder to `src`) but it didn't work.

### How does this package solve the issue?

Edit the build files directly. (It may not be the best solution but it works.)

### How does this package work?

1. Extract and parse CSS files from the build files.
2. Obfuscate the CSS selectors and save to a JSON file.
3. Search and replace the related class names in the build files with the obfuscated class names.

## 🗝️ Features

- WORK WITH NEXT.JS !!!!!!!!!!!!!!!!!!!

> [!NOTE]\
> This package is NOT guaranteed to work with EVERYONE. Check the site carefully before using it in production.

> [!WARNING]\
> As a trade-off, the obfuscation will make your CSS files larger.

## 🛠️ Development Environment

| Environment           | Version                   |
| --------------------- | ------------------------- |
| OS                    | Windows 11 & Ubuntu 22.04 |
| Node.js               | v.18.17.1                 |
| NPM                   | v.10.1.0                  |
| Next.js (Page Router) | v.13.5.4 & v.13.4.1       |
| Next.js (App Router)  | v.14.0.4                  |
| TailwindCSS           | v.3.3.3                   |

- ✅ Tested and works with Next.js Page Router and App Router.
- ✅ Tested and works with [Vercel](https://vercel.com/).

(Theoretically it supports all CSS frameworks but I only tested it with TailwindCSS.)

<!-- ## 📦 Requirements

-  -->

## 🚀 Getting Started

### Installation

```bash
npm install -D  next-css-obfuscator
```

Visit the [npm](https://www.npmjs.com/package/next-css-obfuscator) page.

### Setup

1. Create and add the following code to `next-css-obfuscator.config.cjs` or `next-css-obfuscator.config.ts`:

    ##### Obfuscate all files
    ```javascript
    module.exports = {
        enable: true,
        mode: "random", // random | simplify
        refreshClassConversionJson: false, // recommended set to true if not in production
        allowExtensions: [".jsx", ".tsx", ".js", ".ts", ".html", ".rsc"],
      };

    ```
    ##### Partially obfuscate
    ```javascript
    module.exports = {
        enable: true,
        mode: "random", // random | simplify
        refreshClassConversionJson: false, // recommended set to true if not in production
        allowExtensions: [".jsx", ".tsx", ".js", ".ts", ".html", ".rsc"],

        enableMarkers: true,
      };

    ```

    ##### TypeScript
    ```ts
    import { Options } from "next-css-obfuscator";

    module.exports = {
      // other options ...
    } as Options;
    ```



    Feel free to checkout [📖 PostCSS Options Reference](#-postcss-options-reference) for more options and details.

    > [!NOTE]\
    > The obfuscation will never work as expected, tweak the options with your own needs.

2. Add the following code to `package.json`:

   ```javascript
   "scripts": {
    // other scripts ...
    "obfuscate-build": "next-css-obfuscator"
    },
   ```

   Read [💻 CLI](#-cli) for more details.

### Usage 🎉

1. Run `npm run build` to build the project.
2. Run `npm run obfuscate-build` to obfuscate the css files.

(You may need to delete the `.next/cache` folder before running `npm run start` to make sure the obfuscation takes effect. And don't forget to `shift + F5` refresh the page.`)

> [!WARNING]\
> NEVER run `obfuscate-build` twice in a row. It may mess up the build files and obfuscation convertion table. You can remove the `classConversionJsonFolderPath`(default: `css-obfuscator`) folder to reset the convertion table.

> [!NOTE]\
> For better development experience, it is recommanded to enable `refreshClassConversionJson` option in `next-css-obfuscator.config.cjs` and disable it in production.

For convenience, you may update your build script to:

```javascript
// package.json

"scripts": {
  // other scripts ...
  "build": "next build && npm run obfuscate-build"
},
```

to make sure the build is always obfuscated and no need to run `obfuscate-build` manually.

#### Partially obfuscate
To partially obfuscate your project, you have to add the obfuscate marker class to the components you want to obfuscate.

```diff
// example

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#fac3e3] to-[#5c9cbd] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
          Next14 App Router
        </h1>
      </div>
-     <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
+     <div className="next-css-obfuscation container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
        <span className="text-2xl font-extrabold tracking-tight text-gray-700 border-2 border-blue-950 rounded-lg p-4">
          My classes are obfuscated
        </span>
      </div>
    </main>
  );
}
```

See [Next 14 App Router Partially Obfuscated Demo](https://github.com/soranoo/next-css-obfuscator/tree/main/demo/next14-app-router-partially-obfuscated) for more details.

## 🔧 My Setting

If you are interested in my setting (from my production site), here it is

```javascript
// next-css-obfuscator.config.cjs

module.exports = {
  enable: true,
  mode: "random", // random | simplify
  refreshClassConversionJson: false, // recommended set to true if not in production
  allowExtensions: [".jsx", ".tsx", ".js", ".ts", ".html", ".rsc"],

  blackListedFolderPaths: ["./.next/cache"],
  excludeAnyMatchRegexes: [
    /\.next\/server\/pages\/api/,
    /_document..*js/,
    /_app-.*/,
  ],
  customTailwindDarkModeSelector: "dm",
};
```

It may not be the best setting but it works for me. :)

## 📖 PostCSS Options Reference

| Option                       | Type                                                        | Default                  | Description                                                                                                                     |
| ---------------------------- | ----------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| enable                       | boolean                                                     | true                     | Enable or disable the obfuscation.                                                                                              |
|mode| string| "random" | Obfuscate mode, "random" or "simplify".|
|buildFolderPath|string|"./.next"|The folder path to store the build files built by Next.js.|
|classConversionJsonFolderPath|string|"./css-obfuscator"|The folder path to store the before obfuscate and after obfuscated classes conversion table.|
|refreshClassConversionJson|boolean|false|Refresh the class conversion JSON file(s) at every obfuscation. Good for setting tweaking but not recommended for production.|
|classLength|number|5|The length of the obfuscated class name if in random mode.|
|classPrefix|string|""|The prefix of the obfuscated class name.|
|classSuffix|string|""|The suffix of the obfuscated class name.|
|classIgnore|string[ ]|[ ]|The class names to be ignored during obfuscation.|
|allowExtensions|string[ ]|[".jsx", ".tsx", ".js", ".ts", ".html", ".rsc"]|The file extensions to be processed.|
|whiteListedFolderPaths|string[ ]|[ ]|The folder paths to be processed. Empty array means all folders will be processed.|
|blackListedFolderPaths|string[ ]|[ ]|The folder paths to be ignored.|
|includeAnyMatchRegexes|RegExp[ ]|[ ]|The regexes to match the file/folder paths to be processed.|
|excludeAnyMatchRegex|RegExp[ ]|[ ]|The regexes to match the file/folder paths to be ignored.|
|enableMarkers|boolean|false|Enable or disable the obfuscation markers.|
|markers|string[ ]|[ ]|Classes that indicate component(s) need to obfuscate.|
|removeMarkersAfterObfuscated|boolean|true|Remove the obfuscation markers from HTML elements after obfuscation.|
|customTailwindDarkModeSelector|string \| null|null| [TailwindCSS ONLY] The custom new dark mode selector, e.g. "dark-mode".|
|logLevel|"debug" \| "info" \| "warn" \| "error" \| "success"| "info"|The log level.|

###### All options in one place
```js
module.exports = {
    enable: true, // Enable or disable the plugin.
    mode: "random", // Obfuscate mode, "random" or "simplify".
    buildFolderPath: ".next", // Build folder of your project.
    classConversionJsonFolderPath: "./css-obfuscator", // The folder path to store the before obfuscate and after obfuscated classes conversion table.
    refreshClassConversionJson: false, // Refresh the class conversion JSON file.

    classLength: 5, // Length of the obfuscated class name.
    classPrefix: "", // Prefix of the obfuscated class name.
    classSuffix: "", // Suffix of the obfuscated class name.
    classIgnore: [], // The class names to be ignored during obfuscation.
    allowExtensions: [".jsx", ".tsx", ".js", ".ts", ".html", ".rsc"], // The file extensions to be processed.

    whiteListedFolderPaths: [], // Only obfuscate files in these folders
    blackListedFolderPaths: ["./.next/cache"], // Don't obfuscate files in these folders
    includeAnyMatchRegexes: [], // The regexes to match the file/folder paths to be processed.
    excludeAnyMatchRegexes: [], // The regexes to match the file/folder paths to be ignored.
    enableMarkers: false, // Enable or disable the obfuscate marker classes.
    markers: ["next-css-obfuscation"], // Classes that indicate component(s) need to obfuscate.
    removeMarkersAfterObfuscated: true, // Remove the obfuscation markers from HTML elements after obfuscation.
    customTailwindDarkModeSelector: null, // [TailwindCSS ONLY] The custom new dark mode selector, e.g. "dark-mode".

    logLevel: "info", // Log level
};
```

## 💻 CLI

```bash
next-css-obfuscator --config ./path/to/your/config/file
```

## 💡 Tips

### 1. Not work at Vercel after updated ?

If you are using this package with Vercel, you may found the package not work as expected after updated. This is because Vercel will cache the last build for a faster build time. To fix this you have to redeploy with the `Use existing build cache` option disabled.

### 2. Lazy Setup - Obfuscate all files

Enable `enableMarkers` and put the obfuscate marker class at every component included the index page. But if you want to set and forget, you must play with the options to ensure the obfuscation works as expected.

### 3. It was working normally just now, but not now?

Your convertion table may be messed up. Try to delete the `classConversionJsonFolderPath`(default: `css-obfuscator`) folder to reset the convertion table.

## 👀 Demos

1. [Next 14 App Router](https://github.com/soranoo/next-css-obfuscator/tree/main/demo/next14-app-router)
2. [Next 14 App Router Partially Obfuscated](https://github.com/soranoo/next-css-obfuscator/tree/main/demo/next14-app-router-partially-obfuscated)

## ⭐ TODO

- [x] Partially obfuscation
- [x] To be a totally independent package (remove dependency on [PostCSS-Obfuscator](https://github.com/n4j1Br4ch1D/postcss-obfuscato))
- [ ] More tests

## 🐛 Known Issues

- N/A

## 💖 Sponsors

#### Organizations (1)
<table>
  <tr>
  <td align="center">
    <a href="https://github.com/tremorlabs">
      <img src="https://avatars.githubusercontent.com/u/97241560?s=200&v=4" width="100" alt=""/>
      <br><sub><b>tremor</b></sub>
    </a>
  </td>
  </tr>
</table>

#### Individuals (0)

## 🤝 Contributing

Contributions are welcome! If you find a bug or have a feature request, please open an issue. If you want to contribute code, please fork the repository and run `npm run test` before submit a pull request.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## ☕ Donation

Love it? Consider a donation to support my work.

[!["Donation"](https://raw.githubusercontent.com/soranoo/Donation/main/resources/image/DonateBtn.png)](https://github.com/soranoo/Donation) <- click me~
