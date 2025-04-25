module.exports = {
  branches: [{ name: "main" }, { name: "beta", prerelease: true }],
  plugins: [
    "@semantic-release/commit-analyzer",
    [
      "@semantic-release/release-notes-generator",
      {
        preset: "conventionalcommits",
        releaseRules: [
          { type: "feat", release: "major" },
          { type: "fix", release: "major" },
          { type: "perf", release: "patch" },
          { type: "BREAKING CHANGE", release: "major" },
        ],
      },
    ],
    "@semantic-release/npm",
    [
      "@semantic-release/git",
      {
        message:
          "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
        assets: ["package.json", "CHANGELOG.md"],
      },
    ],
    "@semantic-release/github",
  ],
};
