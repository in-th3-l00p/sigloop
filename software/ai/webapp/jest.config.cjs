module.exports = {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.tsx?$": "<rootDir>/jest-transform.cjs",
  },
  moduleNameMapper: {
    "\\.(css|less)$": "identity-obj-proxy",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFiles: ["<rootDir>/src/test-env-setup.ts"],
  setupFilesAfterEnv: ["<rootDir>/src/test-setup.ts"],
};
