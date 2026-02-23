const { TsJestTransformer } = require("ts-jest");

const baseTransformer = new TsJestTransformer({
  tsconfig: {
    jsx: "react-jsx",
    module: "CommonJS",
    moduleResolution: "node",
    target: "ES2022",
    esModuleInterop: true,
    allowImportingTsExtensions: false,
    verbatimModuleSyntax: false,
    types: ["jest", "@testing-library/jest-dom"],
  },
  diagnostics: false,
});

class ImportMetaTransformer extends TsJestTransformer {
  constructor() {
    super({
      tsconfig: {
        jsx: "react-jsx",
        module: "CommonJS",
        moduleResolution: "node",
        target: "ES2022",
        esModuleInterop: true,
        allowImportingTsExtensions: false,
        verbatimModuleSyntax: false,
        types: ["jest", "@testing-library/jest-dom"],
      },
      diagnostics: false,
    });
  }

  process(sourceText, sourcePath, transformOptions) {
    const replaced = sourceText
      .replace(/import\.meta\.env\.(\w+)/g, '(process.env["$1"] || "")')
      .replace(/import\.meta\.env/g, "process.env");
    return super.process(replaced, sourcePath, transformOptions);
  }
}

module.exports = new ImportMetaTransformer();
