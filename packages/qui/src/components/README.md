# Components

Every component lives in its own folder with a README covering tags, usage,
properties, events, methods, slots, CSS parts, CSS custom properties, and
behavior. Composite widgets keep related tags in the same folder.

## Index

| Folder                                       | Tags                                                                                 | Summary                                   |
| -------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------- |
| [`qui-accordion`](./qui-accordion/README.md) | `qui-accordion`, `-item`, `-trigger`, `-content`                                     | Expandable sections                       |
| [`qui-button`](./qui-button/README.md)       | `qui-button`                                                                         | MD3 button and anchor                     |
| [`qui-card`](./qui-card/README.md)           | `qui-card`                                                                           | MD3 card container                        |
| [`qui-checkbox`](./qui-checkbox/README.md)   | `qui-checkbox`                                                                       | Form-associated checkbox                  |
| [`qui-combobox`](./qui-combobox/README.md)   | `qui-combobox`                                                                       | Filterable, virtualized option list       |
| [`qui-dialog`](./qui-dialog/README.md)       | `qui-dialog`, `-trigger`, `-content`, `-title`, `-description`, `-actions`, `-close` | Native dialog composition                 |
| [`qui-field`](./qui-field/README.md)         | `qui-field`, `-label`, `-helper-text`, `-error-text`, `-required-indicator`          | Label/validation composition              |
| [`qui-icon`](./qui-icon/README.md)           | `qui-icon`                                                                           | Inline SVG icon                           |
| [`qui-input`](./qui-input/README.md)         | `qui-input`                                                                          | Single-line input, masks, number stepping |
| [`qui-option`](./qui-option/README.md)       | `qui-option`                                                                         | Option data for select/combobox           |
| [`qui-popover`](./qui-popover/README.md)     | `qui-popover`                                                                        | Controlled top-layer popover              |
| [`qui-radio`](./qui-radio/README.md)         | `qui-radio-group`, `qui-radio`                                                       | Radio group                               |
| [`qui-select`](./qui-select/README.md)       | `qui-select`                                                                         | Virtualized select                        |
| [`qui-switch`](./qui-switch/README.md)       | `qui-switch`                                                                         | Form-associated switch                    |
| [`qui-tabs`](./qui-tabs/README.md)           | `qui-tabs`, `-list`, `-trigger`, `-panel`                                            | Tabs composition                          |
| [`qui-textarea`](./qui-textarea/README.md)   | `qui-textarea`                                                                       | Multi-line input, auto-growth, counter    |

Controller documentation lives in
[`shared/controllers`](./shared/controllers/README.md).

## Theming

There are three styling layers, from broadest to narrowest:

1. **Material tokens** — set `--md-sys-color-*` properties on `:root` or a
   themed subtree (`.dark` flips the palette). They inherit into every shadow
   root.

    ```css
    .brand {
        --md-sys-color-primary: #006a6a;
        --md-sys-color-on-primary: #fff;
    }
    ```

2. **Component custom properties** — per-instance or per-subtree hooks
   documented in each component README. For example, `qui-button` exposes
   `--qui-button-container-color`, `--qui-button-label-color`,
   `--qui-button-outline-color`, `--qui-button-state-layer-color`, and
   `--qui-button-focus-ring-color`.

    ```css
    .danger {
        --qui-button-container-color: #b3261e;
        --qui-button-label-color: #fff;
    }
    ```

    In CSS, use emitted variables such as `var(--md-sys-color-primary)`. In
    JavaScript/TypeScript, resolve Panda token keys with
    `import { token } from "@quanttrinh/qui/tokens"` and
    `token("colors.primary")`.

    The field family shares `--qui-field-*` properties across `qui-input`,
    `qui-textarea`, `qui-select`, `qui-combobox`, and `qui-field`, so a form or
    field wrapper can theme all of its controls at once.

3. **CSS parts** — target an internal element directly with `::part(name)`.
   Direct declarations work; attribute selectors after `::part()` are not
   matched, so use custom properties for variant-specific theming.

    ```css
    qui-button::part(button) {
        letter-spacing: 0.02em;
    }
    ```

Panda’s internal `--colors-*` aliases are implementation details. Set the
Material tokens for app theming and the documented component properties for
per-instance colors.

## Reading current values

Controlled `value` / `checked` props stay unset for uncontrolled controls, so
read the live value with component methods instead of reaching into shadow DOM:

```ts
const input = document.querySelector("qui-input");
await input.getValue(); // current native input value

const checkbox = document.querySelector("qui-checkbox");
await checkbox.getChecked(); // true | false | "indeterminate"
```

| Method         | Components                                                                   |
| -------------- | ---------------------------------------------------------------------------- |
| `getValue()`   | `qui-input`, `qui-textarea`, `qui-select`, `qui-combobox`, `qui-radio-group` |
| `getChecked()` | `qui-checkbox`, `qui-switch`                                                 |

Both read the live control state, including uncontrolled edits. `getValue()`
returns the value used for form submission.

## Forms

`qui-checkbox`, `qui-switch`, `qui-radio-group`, `qui-input`, `qui-textarea`,
`qui-select`, and `qui-combobox` are form-associated custom elements. They
support:

- form values and reset
- `required`, `invalid`, `disabled`, and `readOnly`
- `qui-field` inheritance
- state restoration
- native form validation hooks

Register every tag used by the form. Composite components need all tags in their
composition registered; a dialog page, for example, needs the root, trigger,
content, title, description, actions, and close definitions.

## Field composition

`qui-field` owns ids, label wiring, validation, and disabled/read-only state.
Descendant controls consume the field through a DOM context:

```html
<qui-field id="email" required>
    <qui-field-label>Email</qui-field-label>
    <qui-input autocomplete="email" placeholder="you@example.com"></qui-input>
    <qui-field-helper-text>We never share it.</qui-field-helper-text>
</qui-field>
```

Use one field per control. See [`qui-field`](./qui-field/README.md) for the part
components and id overrides.
