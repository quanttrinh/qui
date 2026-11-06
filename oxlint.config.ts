import { defineConfig } from "oxlint";

import { toolIgnorePatterns } from "./tooling/ignore";

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
  ignorePatterns: [...toolIgnorePatterns],
  options: {
    typeAware: true,
    typeCheck: true,
  },
  overrides: [
    {
      files: ["**/*.test.{ts,tsx}"],
      rules: {
        // Test files use compact helpers and intentionally cast fakes.
        "typescript/explicit-function-return-type": "off",
        "typescript/no-unsafe-type-assertion": "off",
      },
    },
  ],
  rules: {
    // --- ESLint ------------------------------------------------------------
    "eslint/class-methods-use-this": ["error", { exceptMethods: ["render"] }],
    "eslint/complexity": ["warn", 20],
    // Allow nullish comparisons (`== null`) while keeping strict equality for
    // all other comparisons.
    "eslint/eqeqeq": ["error", "smart"],
    // The project mixes class methods and arrow callbacks on purpose.
    "eslint/func-style": "off",
    "eslint/id-length": ["error", { min: 2, exceptions: ["h", "M"], properties: "never" }],
    "eslint/init-declarations": "off",
    "eslint/max-lines": ["warn", { max: 600, skipBlankLines: true, skipComments: true }],
    // Browser integration suites are long by nature; report them without
    // failing the build.
    "eslint/max-lines-per-function": [
      "warn",
      { max: 160, skipBlankLines: true, skipComments: true },
    ],
    "eslint/max-statements": ["warn", 20],
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
          "Mixin",
          "Prop",
          "State",
          "StencilEvent",
          "Watch",
        ],
      },
    ],
    "eslint/no-eq-null": "off",
    // UI code has many intentional numeric values (timings, opacities, sizes).
    "eslint/no-magic-numbers": "off",
    // Ternaries are used for concise JSX and prop resolution.
    "eslint/no-ternary": "off",
    // `undefined` is the deliberate "attribute absent" value for Stencil props.
    "eslint/no-undefined": "off",
    // One declaration per variable is the project style.
    "eslint/one-var": "off",
    // oxfmt already owns import ordering and grouping.
    "eslint/sort-imports": "off",
    // Object key order is semantic in CSS objects and component style maps.
    "eslint/sort-keys": "off",

    // --- Import ------------------------------------------------------------
    // Keep type specifiers inline so each module has one import statement.
    "import/consistent-type-specifier-style": ["error", "prefer-inline"],
    // This is a named-export library with intentional package-internal imports.
    "import/exports-last": "off",
    "import/group-exports": "off",
    "import/max-dependencies": ["error", { max: 20 }],
    "import/no-duplicates": ["error", { preferInline: true }],
    "import/no-named-export": "off",
    "import/no-relative-parent-imports": "off",
    "import/prefer-default-export": "off",

    // --- oxc ---------------------------------------------------------------
    // These restriction rules predate optional chaining and object spread,
    // which are used pervasively and are well supported.
    "oxc/no-async-await": "off",
    "oxc/no-optional-chaining": "off",
    "oxc/no-rest-spread-properties": "off",

    // --- TypeScript --------------------------------------------------------
    "typescript/consistent-type-imports": [
      "error",
      { prefer: "type-imports", fixStyle: "inline-type-imports" },
    ],
    "typescript/explicit-function-return-type": [
      "error",
      {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
        allowHigherOrderFunctions: true,
        allowConciseArrowFunctionExpressionsStartingWithVoid: true,
      },
    ],
    "typescript/explicit-member-accessibility": [
      "error",
      {
        accessibility: "no-public",
        overrides: {
          constructors: "no-public",
          properties: "no-public",
        },
      },
    ],
    // Inline type specifiers are the chosen style; this rule requires the
    // opposite top-level `import type` form.
    "typescript/no-import-type-side-effects": "off",
    // oxlint-tsgolint resolves Stencil's JSX return type as `error`; `tsc`
    // performs the real JSX/type check.
    "typescript/no-unsafe-return": "off",
    "typescript/no-unsafe-type-assertion": "warn",
    // DOM objects and events are mutable by design.
    "typescript/prefer-readonly-parameter-types": "off",
    "typescript/strict-boolean-expressions": [
      "error",
      {
        allowString: true,
        allowNumber: true,
        allowNullableObject: true,
        allowNullableBoolean: true,
        allowNullableString: true,
        allowNullableNumber: true,
        allowNullableEnum: true,
        allowAny: false,
      },
    ],

    // Null is required by DOM APIs and is the intentional sentinel for
    // nullish comparisons (`== null`).
    "unicorn/no-null": "off",
    // Explicit `undefined` is often the clearest way to signal an absent value.
    "unicorn/no-useless-undefined": "off",
  },
});
