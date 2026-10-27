import { defineVitestConfig } from "@stencil/vitest/config";
import { playwright } from "@vitest/browser-playwright";

export default defineVitestConfig({
  stencilConfig: "./stencil.config.ts",
  test: {
    projects: [
      {
        test: {
          name: "unit",
          include: ["src/**/*.unit.test.{ts,tsx}", "build/**/*.unit.test.{ts,tsx}"],
          environment: "node",
        },
      },
      {
        test: {
          name: "integration",
          include: ["src/**/*.integration.test.ts"],
          environment: "node",
        },
      },
      {
        test: {
          name: "browser",
          include: ["src/**/*.browser.test.{ts,tsx}"],
          exclude: ["src/**/*.smoke.browser.test.{ts,tsx}"],
          setupFiles: ["./vitest.setup.ts"],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: "chromium" }],
          },
        },
      },
      {
        test: {
          name: "smoke",
          include: ["src/**/*.smoke.browser.test.{ts,tsx}"],
          setupFiles: ["./vitest.setup.ts"],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: "chromium" }, { browser: "firefox" }, { browser: "webkit" }],
          },
        },
      },
    ],
  },
});
