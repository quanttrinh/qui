# FocusState

Focused-value, focus-within, and focus-visible bookkeeping for composite widgets.

## Role

Support utility. Not a reactive controller and has no host.

## Options

None.

## API

| Member                                 | Description                                            |
| -------------------------------------- | ------------------------------------------------------ |
| `focusedValue`                         | Value of the focused item, or `undefined`              |
| `focusVisibleValue`                    | Focused value when focus came from the keyboard        |
| `hasFocus`                             | Whether focus is within the widget                     |
| `focus(value, within?, focusVisible?)` | Records focus; returns whether state changed           |
| `blur()`                               | Clears focus; returns whether state changed            |
| `reset(value?)`                        | Restores an initial focused value without focus-within |

## Lifecycle

None — a plain state holder.

## Notes

- The boolean return values let callers skip renders and notify only the old and
  new values.
- `reset()` is used by tabs in `hostWillLoad` so the initial tab is the focus
  target without claiming focus-within.
- Used by `AccordionController`, `TabsController`, and `RadioGroupController`.
