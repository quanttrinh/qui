# `qui-tabs`

MD3 tabs composed from a tabs root, tab list, tab trigger, and tab panel.

## Tags

| Tag               | Summary                                                |
| ----------------- | ------------------------------------------------------ |
| `qui-tabs`        | Root: selected value, orientation, activation, variant |
| `qui-tab-list`    | Container for triggers; owns tablist keyboard handling |
| `qui-tab-trigger` | Button for one tab                                     |
| `qui-tab-panel`   | Content region for one tab                             |

## Usage

```html
<qui-tabs defaultValue="overview">
    <qui-tab-list>
        <qui-tab-trigger value="overview">Overview</qui-tab-trigger>
        <qui-tab-trigger value="activity">Activity</qui-tab-trigger>
    </qui-tab-list>
    <qui-tab-panel value="overview">Overview panel</qui-tab-panel>
    <qui-tab-panel value="activity">Activity panel</qui-tab-panel>
</qui-tabs>
```

## Properties

| Tag               | Property         | Attribute         | Type                         | Default        | Description                                |
| ----------------- | ---------------- | ----------------- | ---------------------------- | -------------- | ------------------------------------------ |
| `qui-tabs`        | `value`          | `value`           | `string`                     | —              | Controlled selected tab                    |
| `qui-tabs`        | `defaultValue`   | `default-value`   | `string`                     | —              | Initial selected tab                       |
| `qui-tabs`        | `orientation`    | `orientation`     | `"horizontal" \| "vertical"` | `"horizontal"` | Tab layout                                 |
| `qui-tabs`        | `activationMode` | `activation-mode` | `"manual" \| "automatic"`    | `"automatic"`  | Focus activates or requires Enter/Space    |
| `qui-tabs`        | `loopFocus`      | `loop-focus`      | `boolean`                    | `true`         | Wrap arrow navigation                      |
| `qui-tabs`        | `deselectable`   | `deselectable`    | `boolean`                    | `false`        | Clicking the active tab clears selection   |
| `qui-tabs`        | `textDirection`  | `text-direction`  | `"ltr" \| "rtl"`             | `"ltr"`        | Text direction                             |
| `qui-tabs`        | `variant`        | `variant`         | `TabsVariant`                | `"primary"`    | MD3 tab style: `primary` or `secondary`    |
| `qui-tab-trigger` | `value`          | `value`           | `string`                     | —              | Value linking trigger and panel (required) |
| `qui-tab-trigger` | `disabled`       | `disabled`        | `boolean`                    | `false`        | Disables the tab                           |
| `qui-tab-panel`   | `value`          | `value`           | `string`                     | —              | Value linking panel and trigger (required) |

## Events

| Tag        | Event         | Detail                           | Description                               |
| ---------- | ------------- | -------------------------------- | ----------------------------------------- |
| `qui-tabs` | `valuechange` | `{ value: string \| undefined }` | Emitted whenever the selected tab changes |

## Methods

None.

## Slots

| Tag               | Slot        | Description         |
| ----------------- | ----------- | ------------------- |
| `qui-tabs`        | _(default)_ | Tab list and panels |
| `qui-tab-list`    | _(default)_ | Tab triggers        |
| `qui-tab-trigger` | _(default)_ | Tab label or icon   |
| `qui-tab-panel`   | _(default)_ | Panel content       |

## CSS parts

| Tag               | Part        | Description      |
| ----------------- | ----------- | ---------------- |
| `qui-tabs`        | `root`      | Tabs root        |
| `qui-tab-list`    | `list`      | Tablist element  |
| `qui-tab-trigger` | `trigger`   | Internal button  |
| `qui-tab-trigger` | `indicator` | Active indicator |
| `qui-tab-panel`   | `panel`     | Panel element    |

## CSS custom properties

| Property                          | Default                             | Description      |
| --------------------------------- | ----------------------------------- | ---------------- |
| `--qui-tabs-label-color`          | `--md-sys-color-on-surface-variant` | Unselected label |
| `--qui-tabs-label-hover-color`    | `--md-sys-color-on-surface`         | Hovered label    |
| `--qui-tabs-label-selected-color` | `--md-sys-color-primary`            | Selected label   |
| `--qui-tabs-indicator-color`      | `--md-sys-color-primary`            | Active indicator |
| `--qui-tabs-list-border-color`    | `--md-sys-color-outline-variant`    | Tab list divider |
| `--qui-tabs-panel-text-color`     | `--md-sys-color-on-surface-variant` | Panel text       |
| `--qui-tabs-focus-ring-color`     | `--md-sys-color-primary`            | Focus ring       |

## Behavior

- `activationMode="automatic"` selects on arrow-key focus; `"manual"` requires
  Enter or Space.
- `deselectable` clears the selection when the active trigger is clicked.
- Arrow/Home/End navigation moves focus; `loopFocus` controls wrapping.
- Panels are hidden when not selected; the selected panel receives a tab stop
  when it contains no focusable content.
- ARIA (`aria-controls`, `aria-labelledby`, `aria-selected`) is wired across
  shadow roots.

## Related

- [`TabsController`](./controller.md)
