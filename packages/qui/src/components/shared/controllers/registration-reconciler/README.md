# RegistrationReconciler

Keeps a context-dependent registration stable across renders.

## Role

Support utility. Not a reactive controller.

## Options

None.

## API

| Member                           | Description                                      |
| -------------------------------- | ------------------------------------------------ |
| `reconcile(signature, register)` | Re-runs `register` only when `signature` changed |
| `clear()`                        | Unregisters and forgets the signature            |

## Lifecycle

None — called from the owner's `componentDidRender` and `disconnectedCallback`.

## Notes

- Signatures compare by length and `Object.is` per entry.
- On a change, the old registration is torn down before the new one is created.
- Include everything the registration depends on: the context object, the part
  value, and the DOM element being registered.
- Used by trigger, panel, content, and tab-list components.
