export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  databaseUrl: process.env.DATABASE_URL || "",
  zerodevProjectId: process.env.ZERODEV_PROJECT_ID || "",
  apiKey: process.env.API_KEY || "sigloop-dev-key",
  bundlerUrl: process.env.BUNDLER_URL || "",
  version: "0.1.0",
} as const;
