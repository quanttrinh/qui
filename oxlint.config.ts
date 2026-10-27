import stencil from "@stencil/eslint-plugin";
import { defineConfig } from "oxlint";

export default defineConfig({
  categories: {
    correctness: "error",
    nursery: "error",
    pedantic: "error",
    perf: "error",
    restriction: "error",
    style: "error",
    suspicious: "error",
  },
  plugins: [
    "eslint",
    "import",
    "jsx-a11y",
    "node",
    "oxc",
    "promise",
    "react",
    "typescript",
    "unicorn",
  ],
  env: {
    builtin: true,
    browser: true,
  },
  ignorePatterns: ["dist/", "www/", "loader/", ".stencil/", "node_modules/", "styled-system/"],
  jsPlugins: [{ name: "stencil", specifier: "@stencil/eslint-plugin" }],
  options: {
    typeAware: true,
  },
  overrides: [
    {
      files: ["*.tsx", "*.jsx"],
      rules: {
        // Stencil compiles JSX with its own `h` factory, so there is no React
        // runtime to put in scope and .tsx is the correct extension.
        "react/jsx-filename-extension": ["error", { extensions: [".tsx"] }],
        "react/react-in-jsx-scope": "off",
        // oxlint-tsgolint resolves Stencil's JSX return type as `error`.
        // `tsc` performs the real JSX/type check.
        "typescript/no-unsafe-return": "off",
      },
    },
    {
      files: [
        "packages/qui/src/**/*.unit.test.{ts,tsx}",
        "packages/qui/src/**/*.browser.test.{ts,tsx}",
        "packages/qui/src/**/*.integration.test.ts",
        "packages/**/*.unit.test.ts",
      ],
      rules: {
        // Test files register suites at module scope and use compact helpers.
        "stencil/ban-side-effects": "off",
        "react/jsx-no-literals": "off",
        "typescript/explicit-function-return-type": "off",
        "typescript/no-unsafe-type-assertion": "off",
        "eslint/no-empty-function": "off",
        "eslint/init-declarations": "off",
        "unicorn/no-useless-undefined": "off",
      },
    },
    {
      files: ["packages/unplugin/src/*.unit.test.ts"],
      env: { node: true },
      rules: {
        "import/no-nodejs-modules": "off",
        "node/no-process-env": "off",
      },
    },
    {
      files: ["packages/qui/src/utilities/ssr.hydration.integration.test.ts"],
      env: { node: true },
      rules: {
        // This test starts a local HTTP server and drives real browsers with Node.
        "import/no-nodejs-modules": "off",
        "node/no-sync": "off",
        "eslint/require-await": "off",
        "eslint/init-declarations": "off",
        "promise/avoid-new": "off",
        "typescript/strict-boolean-expressions": "off",
        "typescript/no-unnecessary-condition": "off",
        "typescript/no-confusing-void-expression": "off",
      },
    },
    {
      files: ["packages/unplugin/src/{core,extract}.ts"],
      rules: {
        // Sorting a fresh array is safe; `toSorted` needs an ES2023 lib.
        "unicorn/no-array-sort": "off",
      },
    },
    {
      files: ["packages/unplugin/src/extract.ts"],
      rules: {
        // Parsing runs once per module during a bundler transform; the sync
        // Oxc API avoids thread overhead and is the intended plugin path.
        "node/no-sync": "off",
      },
    },
    {
      files: ["packages/unplugin/src/resolve-styles.ts"],
      env: { node: true },
      rules: {
        "import/no-nodejs-modules": "off",
        "stencil/ban-side-effects": "off",
      },
    },
    {
      files: ["packages/unplugin/src/index.ts"],
      env: { node: true },
      rules: {
        "node/no-process-env": "off",
        // `unplugin` plugins use a default export so consumers can call
        // `Qui.vite(...)` / `Qui.webpack(...)`.
        "import/no-default-export": "off",
        // Creating the unplugin instance at module scope is the unplugin API.
        "stencil/ban-side-effects": "off",
        // The plugin reads the package stylesheet once at build time.
        "import/no-nodejs-modules": "off",
      },
    },
    {
      files: ["packages/qui/src/components/qui-radio/*.tsx"],
      rules: {
        // The native radio input is the accessible control; `aria-invalid` is
        // valid on it even though the lint rule only maps it to input roles.
        "jsx-a11y/role-supports-aria-props": "off",
        // The checked property is synchronized from group state after click.
        "react/checked-requires-onchange-or-readonly": "off",
      },
    },
    {
      files: ["packages/qui/src/components/qui-tabs/*.tsx"],
      rules: {
        // A tablist is a composite widget: focus is owned by its tab triggers,
        // not by the list container itself.
        "jsx-a11y/interactive-supports-focus": "off",
      },
    },
    {
      files: [
        "packages/qui/src/components/qui-combobox/*.tsx",
        "packages/qui/src/components/qui-select/qui-select.tsx",
        "packages/qui/src/components/shared/option/option-list.tsx",
      ],
      rules: {
        // The ARIA combobox pattern keeps focus in the input and points at the
        // active option with aria-activedescendant, so options are intentionally
        // not focusable and the list is a div-based listbox, not a <select>.
        "jsx-a11y/click-events-have-key-events": "off",
        "jsx-a11y/interactive-supports-focus": "off",
        "jsx-a11y/prefer-tag-over-role": "off",
        // Props inherited from OptionControlBase are not visible to the
        // Stencil lint plugin, so watches on those props look unused.
        "stencil/no-unused-watch": "off",
        // The shared option controller and DOM guards are separate small
        // modules, keeping each concern independently testable.
        "import/max-dependencies": "off",
      },
    },
  ],
  rules: {
    ...stencil.configs.oxlint,

    // --- Stencil ------------------------------------------------------------
    // Panda's `css()` is a pure build-time helper. Only that top-level helper is
    // allowed by the side-effect rule.
    "stencil/ban-side-effects": ["error", ["css"]],
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

    // --- React / JSX --------------------------------------------------------
    // Stencil components are class-based and use their own JSX factory. These
    // React component-model rules do not apply.
    "react/no-unknown-property": "off",
    "react/prefer-function-component": "off",
    "react/button-has-type": "off",
    "react/jsx-props-no-spreading": "off",
    "react/jsx-max-depth": ["error", { max: 8 }],

    // --- oxc ---------------------------------------------------------------
    // These restriction rules predate optional chaining and object spread,
    // which are used pervasively and are well supported.
    "oxc/no-optional-chaining": "off",
    "oxc/no-async-await": "off",
    "oxc/no-rest-spread-properties": "off",

    // --- Import ------------------------------------------------------------
    // This is a named-export library with intentional package-internal imports.
    "import/exports-last": "off",
    "import/group-exports": "off",
    "import/no-named-export": "off",
    "import/prefer-default-export": "off",
    "import/no-relative-parent-imports": "off",
    // Keep type specifiers inline so each module has one import statement.
    "import/consistent-type-specifier-style": ["error", "prefer-inline"],
    "import/no-duplicates": ["error", { preferInline: true }],
    "import/max-dependencies": ["error", { max: 15 }],

    // --- ESLint ------------------------------------------------------------
    // Object key order is semantic in CSS objects and component style maps.
    "eslint/sort-keys": "off",
    // `undefined` is the deliberate "attribute absent" value for Stencil props.
    "eslint/no-undefined": "off",
    // oxfmt already owns import ordering and grouping.
    "eslint/sort-imports": "off",
    // One declaration per variable is the project style.
    "eslint/one-var": "off",
    // Ternaries are used for concise JSX and prop resolution.
    "eslint/no-ternary": "off",
    // The project mixes class methods and arrow callbacks on purpose.
    "eslint/func-style": "off",
    // UI code has many intentional numeric values (timings, opacities, sizes).
    "eslint/no-magic-numbers": "off",
    "eslint/id-length": ["error", { min: 2, exceptions: ["h", "M"], properties: "never" }],
    "eslint/new-cap": [
      "error",
      {
        capIsNewExceptions: [
          "AttachInternals",
          "Component",
          "Element",
          "Event",
          "Listen",
          "Method",
          "Prop",
          "State",
          "StencilEvent",
          "Watch",
        ],
      },
    ],
    "eslint/class-methods-use-this": ["error", { exceptMethods: ["render"] }],
    "eslint/max-lines": ["error", { max: 600, skipBlankLines: true, skipComments: true }],
    "eslint/max-lines-per-function": [
      "error",
      { max: 160, skipBlankLines: true, skipComments: true },
    ],
    "eslint/max-statements": ["error", 20],

    // --- TypeScript --------------------------------------------------------
    // Inline type specifiers are the chosen style; this rule requires the
    // opposite top-level `import type` form.
    "typescript/no-import-type-side-effects": "off",
    // DOM objects and events are mutable by design.
    "typescript/prefer-readonly-parameter-types": "off",
    "typescript/consistent-type-imports": [
      "error",
      { prefer: "type-imports", fixStyle: "inline-type-imports" },
    ],
    "typescript/explicit-member-accessibility": [
      "error",
      {
        accessibility: "explicit",
        overrides: {
          constructors: "no-public",
          properties: "no-public",
        },
      },
    ],
  },
});
