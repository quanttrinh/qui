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
        "react/jsx-filename-extension": "off",
        "react/react-in-jsx-scope": "off",
        // oxlint-tsgolint resolves Stencil's JSX return type as `error`.
        // `tsc` performs the real JSX/type check.
        "typescript/no-unsafe-return": "off",
      },
    },
  ],
  rules: {
    ...stencil.configs.oxlint,

    // --- Framework incompatibilities ---------------------------------------
    // Stencil components are class-based and render custom elements. These
    // React rules assume a React component model and produce false positives.
    "react/no-unknown-property": "off",
    "react/prefer-function-component": "off",
    // `type` is a typed Stencil prop; the rule only accepts literal values.
    "react/button-has-type": "off",
    "react/jsx-props-no-spreading": "off",

    // Slot content is resolved at runtime, so static label inspection cannot
    // see the accessible name. The labels are native <label> elements with
    // either wrapping controls or `for`/`id` wiring.
    "jsx-a11y/label-has-associated-control": "off",
    "jsx-a11y/control-has-associated-label": "off",

    // Panda's `css()` is a pure build-time helper. The rule accepts a list of
    // top-level function names to allow, so permit only that helper.
    "stencil/ban-side-effects": ["error", ["css"]],

    // --- Style rules that conflict with the codebase -----------------------
    // Object key order is semantic in CSS objects and component style maps.
    "eslint/sort-keys": "off",
    // `undefined` is the deliberate "attribute absent" value for Stencil props.
    "eslint/no-undefined": "off",
    // Optional chaining and object spread are used pervasively and are well
    // supported; the restriction rules predate both syntax forms.
    "oxc/no-optional-chaining": "off",
    // Stencil `@Method()` handlers are async by contract.
    "oxc/no-async-await": "off",
    "oxc/no-rest-spread-properties": "off",
    // This is a named-export library; Stencil also requires one component class
    // export per module.
    "import/exports-last": "off",
    "import/group-exports": "off",
    "import/no-named-export": "off",
    "import/prefer-default-export": "off",
    // Package-internal relative imports are intentional.
    "import/no-relative-parent-imports": "off",
    // oxfmt already owns import ordering and grouping.
    "eslint/sort-imports": "off",
    // Keep type specifiers inline so each module has one import statement.
    "import/consistent-type-specifier-style": ["error", "prefer-inline"],
    "import/no-duplicates": ["error", { preferInline: true }],
    // Inline type specifiers are the chosen style; this rule requires the
    // opposite top-level `import type` form.
    "typescript/no-import-type-side-effects": "off",
    // One declaration per variable is the project style.
    "eslint/one-var": "off",
    // Ternaries are used for concise JSX and prop resolution.
    "eslint/no-ternary": "off",
    // The project mixes class methods and arrow callbacks on purpose.
    "eslint/func-style": "off",
    // UI code has many intentional numeric values (timings, opacities, sizes).
    "eslint/no-magic-numbers": "off",
    "eslint/id-length": ["error", { min: 2, exceptions: ["h", "M"], properties: "never" }],
    // DOM objects and events are mutable by design.
    "typescript/prefer-readonly-parameter-types": "off",

    // --- Configured, not disabled ------------------------------------------
    "eslint/new-cap": [
      "error",
      {
        capIsNewExceptions: [
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
    "eslint/max-lines": ["error", { max: 600, skipBlankLines: true, skipComments: true }],
    "eslint/max-lines-per-function": [
      "error",
      { max: 160, skipBlankLines: true, skipComments: true },
    ],
    "eslint/class-methods-use-this": ["error", { exceptMethods: ["render"] }],
    "import/max-dependencies": ["error", { max: 15 }],
    "eslint/max-statements": ["error", 20],
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
    "react/jsx-max-depth": ["error", { max: 8 }],
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
});
