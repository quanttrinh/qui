# `qui-dialog`

MD3 dialog built on the native `<dialog>` element, composed from a provider root
and trigger, content, title, description, actions, and close parts.

## Tags

| Tag                      | Summary                                             |
| ------------------------ | --------------------------------------------------- |
| `qui-dialog`             | Root: open state, modality, scroll lock, role/label |
| `qui-dialog-trigger`     | Opens the dialog                                    |
| `qui-dialog-content`     | Native dialog surface                               |
| `qui-dialog-title`       | Title; becomes the accessible name                  |
| `qui-dialog-description` | Description                                         |
| `qui-dialog-actions`     | Right-aligned action row                            |
| `qui-dialog-close`       | Button that closes the dialog                       |

## Usage

```html
<qui-dialog>
    <qui-dialog-trigger>Open</qui-dialog-trigger>
    <qui-dialog-content>
        <qui-dialog-title>Delete project?</qui-dialog-title>
        <qui-dialog-description>This cannot be undone.</qui-dialog-description>
        <qui-dialog-actions>
            <qui-dialog-close>Cancel</qui-dialog-close>
            <qui-button>Delete</qui-button>
        </qui-dialog-actions>
    </qui-dialog-content>
</qui-dialog>
```

## Properties

| Tag                  | Property                 | Attribute                   | Type                        | Default    | Description                                  |
| -------------------- | ------------------------ | --------------------------- | --------------------------- | ---------- | -------------------------------------------- |
| `qui-dialog`         | `open`                   | `open`                      | `boolean`                   | —          | Controlled open state                        |
| `qui-dialog`         | `defaultOpen`            | `default-open`              | `boolean`                   | `false`    | Initial open state                           |
| `qui-dialog`         | `modal`                  | `modal`                     | `boolean`                   | `true`     | Use `showModal()` instead of `show()`        |
| `qui-dialog`         | `closeOnEscape`          | `close-on-escape`           | `boolean`                   | `true`     | Escape closes the dialog                     |
| `qui-dialog`         | `closeOnInteractOutside` | `close-on-interact-outside` | `boolean`                   | `true`     | Outside interaction closes the dialog        |
| `qui-dialog`         | `preventScroll`          | `prevent-scroll`            | `boolean`                   | —          | Prevent page scrolling while a modal is open |
| `qui-dialog`         | `dialogRole`             | `dialog-role`               | `"dialog" \| "alertdialog"` | `"dialog"` | ARIA role                                    |
| `qui-dialog`         | `dialogLabel`            | `dialog-label`              | `string`                    | —          | Accessible label when no title is rendered   |
| `qui-dialog-trigger` | `disabled`               | `disabled`                  | `boolean`                   | `false`    | Disables the trigger                         |

## Events

| Tag          | Event          | Detail                                   | Description                                   |
| ------------ | -------------- | ---------------------------------------- | --------------------------------------------- |
| `qui-dialog` | `openchange`   | `{ open: boolean; returnValue: string }` | Emitted whenever the open state changes       |
| `qui-dialog` | `dialogcancel` | `void`                                   | Emitted when the native dialog fires `cancel` |

## Methods

| Tag          | Method                    | Returns            | Description                |
| ------------ | ------------------------- | ------------------ | -------------------------- |
| `qui-dialog` | `show()`                  | `Promise<void>`    | Opens the dialog           |
| `qui-dialog` | `close(returnValue = "")` | `Promise<void>`    | Closes the dialog          |
| `qui-dialog` | `isDialogOpen()`          | `Promise<boolean>` | Whether the dialog is open |

## Slots

| Tag                      | Slot        | Description                           |
| ------------------------ | ----------- | ------------------------------------- |
| `qui-dialog`             | _(default)_ | Trigger and content                   |
| `qui-dialog-trigger`     | _(default)_ | Trigger label                         |
| `qui-dialog-content`     | _(default)_ | Title, description, body, and actions |
| `qui-dialog-title`       | _(default)_ | Title text                            |
| `qui-dialog-description` | _(default)_ | Description text                      |
| `qui-dialog-actions`     | _(default)_ | Action buttons                        |
| `qui-dialog-close`       | _(default)_ | Close button label                    |

## CSS parts

| Tag                      | Part          | Description           |
| ------------------------ | ------------- | --------------------- |
| `qui-dialog-content`     | `dialog`      | Native dialog element |
| `qui-dialog-content`     | `content`     | Surface wrapper       |
| `qui-dialog-title`       | `title`       | Title element         |
| `qui-dialog-description` | `description` | Description element   |
| `qui-dialog-actions`     | `actions`     | Action row            |
| `qui-dialog-close`       | `close`       | Close button          |
| `qui-dialog-trigger`     | `trigger`     | Trigger button        |

## CSS custom properties

| Property                               | Default                                 | Description                    |
| -------------------------------------- | --------------------------------------- | ------------------------------ |
| `--qui-dialog-surface-color`           | `--md-sys-color-surface-container-high` | Dialog surface                 |
| `--qui-dialog-text-color`              | `--md-sys-color-on-surface`             | Dialog body text               |
| `--qui-dialog-title-color`             | `--md-sys-color-on-surface`             | Title text                     |
| `--qui-dialog-description-color`       | `--md-sys-color-on-surface-variant`     | Description text               |
| `--qui-dialog-backdrop-color`          | `--md-sys-color-scrim`                  | Modal backdrop                 |
| `--qui-dialog-action-color`            | `--md-sys-color-primary`                | Trigger/close button text      |
| `--qui-dialog-action-hover-color`      | `--md-sys-color-surface-container-high` | Trigger/close hover background |
| `--qui-dialog-action-focus-ring-color` | `--md-sys-color-primary`                | Trigger/close focus ring       |

## Behavior

- Changing `modal` while open reopens the dialog because the native API requires
  it.
- `preventScroll` participates in a shared scroll lock; the page stays locked
  until every open modal dialog closes.
- Escape and outside interaction emit `openchange` and/or `dialogcancel` only
  when the corresponding `closeOn*` option allows it.
- Title and description are wired to the native dialog's accessible name and
  description across shadow roots.
- The root template renders only a slot, so prop changes do not re-render it;
  content parts update through context.

## Related

- [`qui-button`](../qui-button/README.md)
