# NEXT-CSS-OBFUSCATOR

Project start on 30-10-2023

![Weekly Download](https://img.shields.io/npm/dw/next-css-obfuscator?color=0066cc&style=flat) [![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)&nbsp;&nbsp;&nbsp;[![Donation](https://img.shields.io/static/v1?label=Donation&message=❤️&style=social)](https://github.com/soranoo/Donation)

A temporary solution for using [PostCSS-Obfuscator](https://github.com/n4j1Br4ch1D/postcss-obfuscato) in Next.js.

Give me a ⭐ if you like it.

## 📖 Table of Contents

- [🤔 Why this?](#-why-this)
- [💡 How does it work?](#-how-does-it-work)
  - [Where is issue in PostCSS-Obfuscator?](#where-is-issue-in-postcss-obfuscator)
  - [How does this package solve the issue?](#how-does-this-package-solve-the-issue)
  - [How does this package work?](#how-does-this-package-work)
  - [Why I have to patch `PostCSS-Obfuscator`?](#why-i-have-to-patch-postcss-obfuscator)
- [🗝️ Features](#️-features)
- [🛠️ Development Environment](#️-development-environment)
- [🚀 Getting Started](#-getting-started)
  - [Installation](#installation)
  - [Setup](#setup)
  - [Usage 🎉](#usage-)
- [🔧 My Setting](#-my-setting)
- [📖 PostCSS Options Reference](#-postcss-options-reference)
- [🐛 Known Issues](#-known-issues)
- [🤝 Contributing](#-contributing)
- [📝 License](#-license)
- [☕ Donation](#-donation)

## 🤔 Why this?

Because in the current version of [PostCSS-Obfuscator](https://github.com/n4j1Br4ch1D/postcss-obfuscato) does not work with Next.js. (see [this issue](https://github.com/n4j1Br4ch1D/postcss-obfuscator/issues/15) for more details)

By the way, many thanks to [n4j1Br4ch1D](https://github.com/n4j1Br4ch1D) for creating such a great package.

> This repository will be archived once the issue is fixed.

## 💡 How does it work?

### Where is issue in PostCSS-Obfuscator?

`PostCSS-Obfuscator` will not edit the build files instead it will create a new folder and put the obfuscated source code files in it. This is where the issue is. Next.js will not recognize the obfuscated files and will not include them in the build. I tried to point Nextjs to build the obfuscated files (by simply change the obfuscated source code folder to `src`) but it didn't work.

### How does this package solve the issue?

Edit the build files directly. (It may not be the best solution but it works.)

### How does this package work?

1. Extract the css files from the build files and put them in a temporary folder.
2. Obfuscate the css files in the temporary folder using `Patched-PostCSS-Obfuscator`.
3. Replace the css files in the build files with the obfuscated css files in the temporary folder. And the obfuscate map json generated in this step.
4. Extract all `".jsx", ".tsx", ".js", ".ts", ".html"` files from the build files and replace the css keys according to the obfuscate map json.
   > You can specify the file extensions to be processed in the `extensions` option in `postcss.config.cjs`.
5. Delete the temporary folder.

### Why I have to patch `PostCSS-Obfuscator`?

I found `fresh` option not working properly in `PostCSS-Obfuscator`. When `fresh` is false new random class names will be generated every time PostCSS processes CSS but none of these new class names will be put into the conversion table for the coming HTML-related content process. As a result, the HTML content never gets the correct obfuscated class names. So I decided to patch it. You can find the patched code within the `//! Patch - Start` and `//! Patch - End` block.

You may ask why I have split the project to patched PostCSS-Obfuscator and the Next.js specific part instead of mixing them together. The reason is that I am not a big fan of javascript so you can see the Next.js specific part is written in typescript. Keeping the patch to a minimum scale can make it easier to upgrade the PostCSS-Obfuscator to the latest version.

## 🗝️ Features

- WORK WITH NEXT.JS !!!!!!!!!!!!!!!!!!!
- Zero Dependencies

> ⚠️ This package is NOT guaranteed to work with EVERYONE. Check the site carefully before using it in production.

## 🛠️ Development Environment

| Environment           | Version                   |
| --------------------- | ------------------------- |
| OS                    | Windows 11 & Ubuntu 22.04 |
| Node.js               | v.18.17.1                 |
| NPM                   | v.10.1.0                  |
| Next.js (Page Router) | v.13.5.4 & v.13.4.1       |
| postcss-obfuscator    | v.1.6.0 Beta              |
| tailwindcss           | v.3.3.3                   |

(You can use any css framework you like, but I tested it with tailwindcss)

<!-- ## 📦 Requirements

-  -->

## 🚀 Getting Started

### Installation

1. Install PostCSS

```bash
npm install -D postcss postcss-cli
```

2. Install this package and other required packages

```bash
npm install -D cross-env next-css-obfuscator
```

Visit the [npm](https://www.npmjs.com/package/next-css-obfuscator) page.

### Setup

1. Create / Add the following code to `postcss.config.cjs`:

   ```javascript
   // @ts-ignore
   const isObfscMode = process.env.NODE_ENV === "obfuscation";

   module.exports = {
     plugins: {
       // other plugins ...
       "next-css-obfuscator/patched-postcss-obfuscator": {
         enable: isObfscMode,
         extensions: [".jsx", ".tsx", ".js", ".ts", ".html"],
         formatJson: true, // 👈 must be true
         keepData: true, // 👈 must be true
         blackListedPaths: ["./next/cache"],
         classIgnore: ["static"],
         callBack: function () {
           // @ts-ignore
           process.env.NODE_ENV = "production"; // to make sure postcss-obfuscator doesn't re-run.
         },
       },
     },
   };
   ```

   Feel to checkout [📖 PostCSS Options Reference](#-postcss-options-reference) for more details.

   > ⚠️ `formatJson`, `keepData` must be `true` to make sure the obfuscation works properly.

   > The obfuscation will never work as expected, tweak the options with your own needs.

2. Add the following code to `package.json`:

   ```javascript
   "scripts": {
    // other scripts ...
    "obfuscate-build": "next-css-obfuscator-part1 && cross-env NODE_ENV=obfuscation postcss ./temp-css/*.css --dir ./temp-css && next-css-obfuscator-part2"
    },
   ```

### Usage 🎉

1. Run `npm run build` to build the project.
2. Run `npm run obfuscate-build` to obfuscate the css files.

(You may need to delete the `.next/cache` folder before running `npm run start` to make sure the obfuscation takes effect. And don't forget to `shift + F5` refresh the page.`)

> ⚠️ NEVER run `obfuscate-build` twice in a row. It will mess up the build files and obfuscation convertion table. You can remove the `jsonsPath`(default: `css-obfuscator`) folder to reset the convertion table.

You may update your build script to:

```javascript
// package.json

"scripts": {
  // other scripts ...
  "build": "next build && npm run obfuscate-build"
},
```

to make sure the build is always obfuscated and no need to run `obfuscate-build` manually.

## 🔧 My Setting

If you are interested in my setting (from my production site), here it is

```javascript
// @ts-ignore
const isObfscMode = process.env.NODE_ENV === "obfuscation";

module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    "next-css-obfuscator/patched-postcss-obfuscator": {
      enable: isObfscMode,
      extensions: [".jsx", ".tsx", ".js", ".ts", ".html"],
      formatJson: true, // 👈 must be true
      keepData: true, // 👈 must be true
      whiteListedPaths: [],
      blackListedPaths: ["./next/cache"],
      excludeAnyMatchRegex: [
        /\.next\/server\/pages\/api/,
        /_document..*js/,
        /_app-.*/,
      ],
      classIgnore: ["static"],
      callBack: function () {
        // @ts-ignore
        process.env.NODE_ENV = "production"; // to make sure postcss-obfuscator doesn't re-run.
      },
    },
  },
};
```

It may not be the best setting but it works for me. :)

## 📖 PostCSS Options Reference

| Option               | Type          | Default                 | Description                                                                                                                     |
| -------------------- | ------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| enable               | boolean       | true                    | Enable or disable the obfuscation.                                                                                              |
| length               | number        | 5                       | Random name length.                                                                                                             |
| classMethod          | string        | "random"                | 'random', 'simple', 'none' obfuscation method for classes.                                                                      |
| classPrefix          | string        | ""                      | ClassName prefix.                                                                                                               |
| classSuffix          | string        | ""                      | ClassName suffix.                                                                                                               |
| classIgnore          | string[]      | []                      | Class to ignore from obfuscation.                                                                                               |
| ids                  | boolean       | false                   | Obfuscate #IdNames.                                                                                                             |
| idMethod             | string        | "random"                | 'random', 'simple', 'none' obfuscation method for ids .                                                                         |
| idPrefix             | string        | ""                      | idName Prefix.                                                                                                                  |
| idSuffix             | string        | ""                      | idName suffix.                                                                                                                  |
| idIgnore             | string[]      | []                      | Ids to ignore from obfuscation.                                                                                                 |
| indicatorStart       | string        | null                    | Identify ids & classes by the preceding string.                                                                                 |
| indicatorEnd         | string        | null                    | Identify ids & classes by the following string.                                                                                 |
| jsonsPath            | string        | "css-obfuscator"        | Path and file name where to save obfuscation data.                                                                              |
| srcPath              | string        | "src"                   | Source of your files.                                                                                                           |
| desPath              | string        | "out"                   | Destination for obfuscated html/js/.. files.Be careful using the same directory as your src(you will lose your original files). |
| extensions           | string[]      | [".html"]               | Extesnion of files you want osbfucated [".jsx", ".tsx", ".js", ".ts", ".html"].                                                 |
| fresh                | boolean       | false                   | Create new obfuscation data list or use already existed one (to keep production cache or prevent data scrapping).               |
| formatJson           | boolean       | false                   | Format obfuscation data JSON file.                                                                                              |
| showConfig           | boolean       | false                   | Show config on terminal when runinng.                                                                                           |
| keepData             | boolean       | true                    | Keep or delete Data after obfuscation is finished?                                                                              |
| preRun               | () => Promise | () => Promise.resolve() | do something before the plugin runs.                                                                                            |
| callBack             | () => void    | function () {}          | Callback function to call after obfuscation is done.                                                                            |
| == NEW OPTIONS ==    |               |                         |                                                                                                                                 |
| whiteListedPaths     | string[]      | []                      | All files in these paths will be obfuscated. Set to `[]` to obfuscate all files.                                                |
| blackListedPaths     | string[]      | []                      | All files in these paths will not be obfuscated. (higher priority than others options)                                          |
| excludeAnyMatchRegex | string[]      | []                      | Any file path that matches any of the regex will be excluded from obfuscation.                                                  |

Compared to the original `PostCSS-Obfuscator` options, I have removed some to make the patch work as expected. And I have added some new options to make the obfuscation more flexible.

## 🐛 Known Issues

> If there are no serious issues, I tend to leave them alone.

## 🤝 Contributing

Contributions are welcome! If you find a bug or have a feature request, please open an issue. If you want to contribute code, please fork the repository and submit a pull request.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## ☕ Donation

Love it? Consider a donation to support my work.

[!["Donation"](https://raw.githubusercontent.com/soranoo/Donation/main/resources/image/DonateBtn.png)](https://github.com/soranoo/Donation) <- click me~
