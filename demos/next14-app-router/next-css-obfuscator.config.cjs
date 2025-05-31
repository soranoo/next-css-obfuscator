/** @type {import("next-css-obfuscator").Options} */
module.exports = {
    enable: true,
    mode: "random", // random | simplify
    refreshClassConversionJson: false, // recommended set to true if not in production
    allowExtensions: [".jsx", ".tsx", ".js", ".ts", ".html", ".rsc"],
  };