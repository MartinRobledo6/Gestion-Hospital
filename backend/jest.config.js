module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      { useESM: true, tsconfig: { allowJs: true, module: "ESNext" } },
    ],
  },
  transformIgnorePatterns: ["/node_modules/"],
  testEnvironment: "node",
};
