import { afterAll, beforeAll } from "vitest";

import { setQuiStylesHref } from "./src/utilities/styles.js";
import componentCss from "./styled-system/styles.css?inline";
import themeCss from "./styled-system/theme.css?inline";

const documentStyles = document.createElement("style");
documentStyles.textContent = `${themeCss}\n${componentCss}`;
document.head.append(documentStyles);

// Shadow components link their stylesheet from the document; in tests the
// Panda CSS is injected as a style tag, so expose the same CSS through a stable
// blob URL instead of scraping document.styleSheets.
const shadowStylesUrl = URL.createObjectURL(new Blob([componentCss], { type: "text/css" }));
setQuiStylesHref(shadowStylesUrl);

afterAll(() => {
  URL.revokeObjectURL(shadowStylesUrl);
});

/**
 * `stencil-test` builds the Stencil lazy loader used by the test harness into
 * `.stencil-test`. Import it after Vitest starts so `@stencil/vitest` can
 * instrument component registration.
 */
beforeAll(async () => {
  await import("./.stencil-test/build/qui.esm.js");
});
