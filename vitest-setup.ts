import "./www/theme.css";
import "./www/styles.css";
import { beforeAll } from "vitest";

// The `stencil-test` CLI builds the www lazy loader before Vitest runs. Load it
// after the test framework is initialized so component registration can be
// instrumented by @stencil/vitest.
beforeAll(async () => {
  await import("./www/build/qui.esm.js");
});
