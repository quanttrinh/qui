# Option controllers

Shared behavior for `qui-select` and `qui-combobox`. All three controllers work
with `OptionItem` (`value`, `label`, `disabled`, optional `keywords`).

| Controller                                                                        | Responsibility                                                  |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| [`OptionSourceController`](./option-source-controller/README.md)                  | Where options come from: `items` prop or observed DOM children  |
| [`OptionSelectionController`](./option-selection-controller/README.md)            | Controlled/uncontrolled selection, single/multiple/deselectable |
| [`OptionListNavigationController`](./option-list-navigation-controller/README.md) | Open state, active item, keyboard navigation, reveal            |

Typical wiring:

```ts
private readonly source = new OptionSourceController(this, {
  getItems: () => this.items,
  getRenderedRoot: () => this.rootEl,
  adapter: quiOptionSource,
  // Optional: combobox uses this to invalidate its filter.
  onInvalidate: () => {
    this.invalidateFilter();
  },
});

private readonly selection = new OptionSelectionController(this, {
  getValue: () => this.value,
  getDefaultValue: () => this.defaultValue,
  getItems: () => this.source.items,
  getMultiple: () => this.multiple,
  getDeselectable: () => this.deselectable,
  isReadOnly: () => this.form.isReadOnly,
  onChange: ({ value }) => this.valueChange.emit({ value }),
});

private readonly navigation = new OptionListNavigationController(this, {
  getItems: () => this.source.items,
  getInitialActive: () => this.selection.selected.at(0) ?? this.source.items.at(0)?.value,
  getOpen: () => this.open,
  getDefaultOpen: () => this.defaultOpen,
  isDisabled: () => this.form.isDisabled,
  isReadOnly: () => this.form.isReadOnly,
  isLooping: () => this.loopFocus,
  onOpenChange: (open, reason) => this.openChange.emit({ open, reason }),
  onReveal: (index) => this.window.revealIndex(index),
});
```

## Interaction notes

- Selection and navigation both call `requestUpdate()` because the option list
  template reads open/active/selected state.
- When `items` is a property, the source returns it directly. With DOM children
  it caches the read and invalidates through a `MutationObserver`.
- `OptionListNavigationController.hostDidRender` clears an active value that
  disappeared from the item list and reveals the active row when it changes.
