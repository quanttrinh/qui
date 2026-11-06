import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@quanttrinh/qui/internal": fileURLToPath(
        new URL("../qui/src/utilities/internal/index.ts", import.meta.url),
      ),
    },
  },
  test: {
    include: ["src/**/*.unit.test.{ts,tsx}"],
    environment: "node",
  },
});
