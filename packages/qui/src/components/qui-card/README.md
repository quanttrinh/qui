# `qui-card`

MD3 card container with optional title, description, and actions slots.

## Tags

| Tag        | Summary            |
| ---------- | ------------------ |
| `qui-card` | MD3 card container |

## Usage

```html
<qui-card variant="elevated">
    <span slot="title">Trip plan</span>
    <span slot="description">Three days in Kyoto</span>
    <p>Details go in the default slot.</p>
    <div slot="actions">
        <qui-button variant="text">Dismiss</qui-button>
        <qui-button>Open</qui-button>
    </div>
</qui-card>
```

## Properties

| Tag        | Property  | Attribute | Type          | Default      | Description                                    |
| ---------- | --------- | --------- | ------------- | ------------ | ---------------------------------------------- |
| `qui-card` | `variant` | `variant` | `CardVariant` | `"elevated"` | Visual style: `elevated`, `filled`, `outlined` |

## Events

None.

## Methods

None.

## Slots

| Tag        | Slot          | Description              |
| ---------- | ------------- | ------------------------ |
| `qui-card` | `title`       | Optional card title      |
| `qui-card` | `description` | Optional supporting text |
| `qui-card` | `actions`     | Optional action row      |
| `qui-card` | _(default)_   | Card content             |

## CSS parts

| Tag        | Part          | Description            |
| ---------- | ------------- | ---------------------- |
| `qui-card` | `root`        | Card surface           |
| `qui-card` | `title`       | Title region           |
| `qui-card` | `description` | Supporting-text region |
| `qui-card` | `content`     | Default content region |
| `qui-card` | `actions`     | Action row             |

## CSS custom properties

| Property                     | Default                          | Description          |
| ---------------------------- | -------------------------------- | -------------------- |
| `--qui-card-container-color` | variant-dependent                | Card surface         |
| `--qui-card-border-color`    | `--md-sys-color-outline-variant` | Outlined card border |

## Behavior

- Named slots are optional; missing regions are not rendered.
- The card is presentational and does not manage focus or interaction.

## Related

- [`qui-button`](../qui-button/README.md)
