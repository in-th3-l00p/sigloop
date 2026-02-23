export default {
  testEnvironment: "jsdom",
  transform: { "^.+\\.tsx?$": "ts-jest" },
  moduleNameMapper: {
    "\\.(css|less)$": "identity-obj-proxy",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFilesAfterSetup: ["@testing-library/jest-dom"],
};
