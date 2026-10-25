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
    {
      files: ["src/**/*.unit.test.{ts,tsx}", "src/**/*.browser.test.{ts,tsx}"],
      rules: {
        // Test files register suites at module scope and use compact helpers.
        "stencil/ban-side-effects": "off",
        "react/jsx-no-literals": "off",
        "typescript/explicit-function-return-type": "off",
        "typescript/no-unsafe-type-assertion": "off",
        "typescript/no-unsafe-member-access": "off",
        "eslint/no-empty-function": "off",
        "eslint/init-declarations": "off",
        "unicorn/no-useless-undefined": "off",
        "promise/avoid-new": "off",
      },
    },
    {
      files: ["src/unplugin/{core,extract}.ts"],
      rules: {
        // Sorting a fresh array is safe; `toSorted` needs an ES2023 lib.
        "unicorn/no-array-sort": "off",
      },
    },
    {
      files: ["src/unplugin/extract.ts"],
      rules: {
        // Parsing runs once per module during a bundler transform; the sync
        // Oxc API avoids thread overhead and is the intended plugin path.
        "node/no-sync": "off",
      },
    },
    {
      files: ["src/unplugin/index.ts"],
      rules: {
        // `unplugin` plugins use a default export so consumers can call
        // `Qui.vite(...)` / `Qui.webpack(...)`.
        "import/no-default-export": "off",
        // Creating the unplugin instance at module scope is the unplugin API.
        "stencil/ban-side-effects": "off",
      },
    },
    {
      files: ["src/components/qui-radio/*.tsx"],
      rules: {
        // The native radio input is the accessible control; `aria-invalid` is
        // valid on it even though the lint rule only maps it to input roles.
        "jsx-a11y/role-supports-aria-props": "off",
        // The checked property is synchronized from group state after click.
        "react/checked-requires-onchange-or-readonly": "off",
      },
    },
    {
      files: ["src/components/qui-accordion/qui-accordion-content.tsx"],
      rules: {
        // A div keeps the grid-row transition; section would be equivalent but
        // the content part is intentionally layout-neutral.
        "jsx-a11y/prefer-tag-over-role": "off",
      },
    },
    {
      files: ["src/components/qui-tabs/*.tsx"],
      rules: {
        // A tablist is a composite widget: focus is owned by its tab triggers,
        // not by the list container itself.
        "jsx-a11y/interactive-supports-focus": "off",
      },
    },
    {
      files: [
        "src/components/qui-combobox/*.tsx",
        "src/components/qui-select/qui-select.tsx",
        "src/components/shared/option/option-list.tsx",
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
