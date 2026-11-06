import stencil from "@stencil/eslint-plugin";
import { defineConfig } from "oxlint";

import baseConfig from "../../oxlint.config.ts";
import { createConfig } from "./tooling/config";

const config = createConfig(__dirname);

// Oxlint registers JS plugins by path, so the plugin module builds itself from
// the resolved config path when Oxlint loads it.
process.env.PANDA_CONFIG_PATH = config.file.pandaConfig;

export default defineConfig({
  // `extends` only inherits rules, plugins, and overrides, so carry the
  // remaining shared settings over explicitly. `options` stays root-only.
  categories: baseConfig.categories,
  env: {
    builtin: true,
    browser: true,
    node: true,
  },
  extends: [baseConfig],
  ignorePatterns: [
    "node_modules/",
    "dist/",
    "styled-system/",
    "www/",
    ".stencil/",
    ".stencil-test/",
    "loader/",
    "docs/",
  ],
  jsPlugins: [
    { name: "stencil", specifier: "@stencil/eslint-plugin" },
    "./tooling/plugins/pandacss/oxlint.mjs",
  ],
  rules: {
    ...stencil.configs.oxlint,

    // --- JSX A11y ------------------------------------------------------
    // The ARIA combobox/tab/radio patterns intentionally manage focus and
    // interactivity on wrapper elements.
    "jsx-a11y/click-events-have-key-events": "off",
    "jsx-a11y/interactive-supports-focus": "off",
    "jsx-a11y/prefer-tag-over-role": "off",
    "jsx-a11y/role-supports-aria-props": "off",

    // --- React / JSX ---------------------------------------------------
    // The button type is a constrained dynamic prop; the rule only
    // recognizes a literal attribute.
    "react/button-has-type": "off",
    // Stencil compiles JSX with its own `h` factory, so there is no React
    // runtime to put in scope and .tsx is the correct extension.
    "react/jsx-filename-extension": ["error", { extensions: [".tsx"] }],
    "react/jsx-max-depth": ["error", { max: 8 }],
    "react/jsx-no-literals": "off",
    // Form controls spread precomputed Stencil prop and state attributes.
    "react/jsx-props-no-spreading": "off",
    // Stencil attributes such as `part` and `data-*` are unknown to React.
    "react/no-unknown-property": "off",
    // Stencil components are class-based and use their own JSX factory.
    "react/prefer-function-component": "off",
    "react/react-in-jsx-scope": "off",

    // --- Panda CSS -----------------------------------------------------
    // Catch styles that the compiler silently drops or renders without
    // the theme's tokens.
    "@pandacss/extraction-diagnostics": "error",
    "@pandacss/file-not-included": "error",
    "@pandacss/no-debug": "error",
    "@pandacss/no-deprecated": "error",
    "@pandacss/no-dynamic-styling": "error",
    "@pandacss/no-invalid-nesting": "error",
    "@pandacss/no-invalid-token-paths": "error",
    "@pandacss/prefer-token": [
      "error",
      {
        // Raw values that have no equivalent token in the theme.
        allow: [
          "0",
          "1px",
          "-1px",
          "3px",
          "1em",
          "1.25em",
          "1.5em",
          "50%",
          "calc(100% - 1.65rem)",
          "calc(100dvh - 2rem)",
          "0 auto 0 0",
          "3px 0 0 3px",
        ],
      },
    ],
    "@pandacss/consistent-property-style": ["error", { style: "shorthand" }],
    "@pandacss/no-descendant-selectors": "error",
    "@pandacss/no-important": "error",
    "@pandacss/no-margin-properties": "error",
    "@pandacss/no-physical-properties": "error",
    "@pandacss/no-primitive-token": "error",
    "@pandacss/no-shorthand-longhand-mix": "error",
    "@pandacss/prefer-text-style": "error",

    // --- Stencil -------------------------------------------------------
    // Panda's `css()` is a pure build-time helper, and the other entries
    // are pure factory/lookup helpers.
    "stencil/ban-side-effects": ["error", ["css", "createContextStore", "createGlobalHrefKey"]],
    "stencil/decorators-style": [
      "error",
      {
        prop: "inline",
        state: "inline",
        element: "inline",
        event: "multiline",
        method: "multiline",
        watch: "multiline",
        listen: "multiline",
      },
    ],
  },
  overrides: [
    {
      files: [
        "src/components/qui-button/qui-button.tsx",
        "src/components/qui-checkbox/qui-checkbox.tsx",
        "src/components/qui-radio/qui-radio.tsx",
        "src/components/qui-switch/qui-switch.tsx",
        "src/components/qui-tabs/qui-tab-trigger.tsx",
      ],
      rules: {
        // These components style mutually exclusive `data-*` state selectors.
        // Panda orders equal-specificity selectors by text and warns about
        // overrides that can never meet on the same element.
        "@pandacss/extraction-diagnostics": "off",
      },
    },
    {
      files: [
        "src/components/qui-select/qui-select.tsx",
        "src/components/qui-combobox/qui-combobox.tsx",
      ],
      rules: {
        // These watches target props supplied by OptionControlMixin, which the
        // Stencil lint plugin cannot associate with the component class.
        "stencil/no-unused-watch": "off",
      },
    },
    {
      files: ["src/utilities/ssr/ssr.hydration.integration.test.ts"],
      rules: {
        // This test starts a local HTTP server and drives real browsers.
        "import/no-nodejs-modules": "off",
      },
    },
  ],
});
