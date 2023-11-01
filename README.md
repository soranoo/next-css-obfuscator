# NEXT-CSS-OBFUSCATOR

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)&nbsp;&nbsp;&nbsp;[![Donation](https://img.shields.io/static/v1?label=Donation&message=❤️&style=social)](https://github.com/soranoo/Donation)

A temporary solution for using [postcss-obfuscator](https://github.com/n4j1Br4ch1D/postcss-obfuscato) in Next.js.

Give me a ⭐ if you like it.

## 🤔 Why this?

Because in the current version of [postcss-obfuscator](https://github.com/n4j1Br4ch1D/postcss-obfuscato) does not work with Next.js. (see [this issue](https://github.com/n4j1Br4ch1D/postcss-obfuscator/issues/15) for more details) 

By the way, many thanks to [n4j1Br4ch1D](https://github.com/n4j1Br4ch1D) for creating such a great package.

> This repository will be archived once the issue is fixed.

## 💡 How does it work?

### Where is issue in postcss-obfuscator?

`postcss-obfuscator` will not edit the build files instead it will create a new folder and put the obfuscated source code files in it. This is where the issue is. Next.js will not recognize the obfuscated files and will not include them in the build. I tried to point Nextjs to build the obfuscated files (by simply change the obfuscated source code folder to `src`) but it didn't work.

### How does this package solve the issue?

Edit the build files directly. (It may not be the best solution but it works.)

### How does this package work?

1. Extract the css files from the build files and put them in a temporary folder.
2. Obfuscate the css files in the temporary folder.
3. Replace the css files in the build files with the obfuscated css files in the temporary folder. And the obfuscate map json generated in this step.
4. Extract all `".jsx", ".tsx", ".js", ".ts", ".html"` files from the build files and replace the css keys according to the obfuscate map json.
   > You can specify the file extensions to be processed in the `extensions` option in `postcss.config.cjs`.
5. Delete the temporary folder.

## 🗝️ Features

- WORK WITH NEXT.JS !!!!!!!!!!!!!!!!!!!
- Zero Dependencies

> ⚠️ This package is NOT guaranteed to work with EVERYONE. Check the site carefully before using it in production.

## 🛠️ Development Environment

| Environment        | Version                   |
| ------------------ | ------------------------- |
| OS                 | Windows 11 & Ubuntu 22.04 |
| Node.js            | v.18.17.1                 |
| NPM                | v.10.1.0                  |
| Next.js            | v.13.5.4 & v.13.4.1       |
| postcss-obfuscator | v.1.6.0                   |
| tailwindcss        | v.3.3.3                   |

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
npm install -D cross-env postcss-obfuscator next-css-obfuscator
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
       "postcss-obfuscator": {
         enable: isObfscMode,
         extensions: [".jsx", ".tsx", ".js", ".ts", ".html"],
         formatJson: true, // 👈 must be true
         fresh: true, // 👈 must be true
         keepData: true, // 👈 must be true
         callBack: function () {
           // @ts-ignore
           process.env.NODE_ENV = "production"; // to make sure postcss-obfuscator doesn't re-run.
         },
       },
     },
   };
   ```

   Feel to checkout [this-link](https://github.com/n4j1Br4ch1D/postcss-obfuscator#configuartion) for more configuration options.

   > ⚠️ `formatJson`, `fresh` and `keepData` must be `true` to make sure the obfuscation works properly.

   NEW Configuration Options:
   | Option | Type | Default | Description |
    | --- | --- | --- | --- |
    | whiteListedPaths | string[] | [".next/server/pages", ".next/static/chunks/pages"] | All files in these paths will be obfuscated. Set to `[]` to obfuscate all files. |

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

> ⚠️ NEVER run `obfuscate-build` twice in a row. It will mess up the build files.

You may update your build script to:

```javascript
// package.json

"scripts": {
  // other scripts ...
  "build": "next build && npm run obfuscate-build"
},
```

to make sure the build is always obfuscated and no need to run `obfuscate-build` manually.

## 🐛 Known Issues

> If there are no serious issues, I tend to leave them alone.

## 🤝 Contributing

Contributions are welcome! If you find a bug or have a feature request, please open an issue. If you want to contribute code, please fork the repository and submit a pull request.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## ☕ Donation

Love it? Consider a donation to support my work.

[!["Donation"](https://raw.githubusercontent.com/soranoo/Donation/main/resources/image/DonateBtn.png)](https://github.com/soranoo/Donation) <- click me~
