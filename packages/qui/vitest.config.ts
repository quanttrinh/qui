import { defineVitestConfig } from "@stencil/vitest/config";
import { playwright } from "@vitest/browser-playwright";

const testDefaults = {
  testTimeout: 15_000,
  hookTimeout: 30_000,
};

export default defineVitestConfig({
  stencilConfig: "./stencil.config.ts",
  test: {
    projects: [
      {
        test: {
          ...testDefaults,
          name: "unit",
          include: ["src/**/*.unit.test.{ts,tsx}", "tooling/**/*.unit.test.{ts,tsx}"],
          environment: "node",
        },
      },
      {
        test: {
          ...testDefaults,
          name: "integration",
          include: ["src/**/*.integration.test.ts"],
          environment: "node",
        },
      },
      {
        test: {
          ...testDefaults,
          name: "browser",
          include: ["src/**/*.browser.test.{ts,tsx}", "tests/**/*.browser.test.{ts,tsx}"],
          exclude: ["**/*.smoke.browser.test.{ts,tsx}"],
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
          ...testDefaults,
          name: "smoke",
          include: ["tests/**/*.smoke.browser.test.{ts,tsx}"],
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
