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