import Add from "@iconify-solid/material-symbols/add";
import Remove from "@iconify-solid/material-symbols/remove";
import Visibility from "@iconify-solid/material-symbols/visibility";
import VisibilityOff from "@iconify-solid/material-symbols/visibility-off";
import {
  type JSX,
  Show,
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  onCleanup,
  onMount,
  splitProps,
  untrack,
} from "solid-js";

import { css, cx } from "../../../../styled-system/css";
import { center, flex } from "../../../../styled-system/patterns";
import { ariaAttr, dataAttr } from "../../../utilities/attr";
import { useFieldContext } from "../Field/useFieldContext";
import { applyMask, formatMask, unmask } from "./mask";

/** The input types `Input` can render. */
type InputType = "text" | "email" | "tel" | "search" | "password" | "number";

/**
 * A character mask for text-like inputs. `#` matches a digit, `a` a letter and
 * `*` a letter or digit; any other character is a literal that is inserted
 * automatically.
 *
 * @example { pattern: "#### #### #### ####" } // credit card
 * @example { pattern: "aa-######-a" } // alphanumeric id
 */
interface InputMask {
  /** The pattern to apply, e.g. `"### ###-####"` or `"aa-######-a"`. */
  pattern: string;
}

/** The values handed to `onValueChange` after every edit. */
interface InputValueDetails {
  /** The value shown in the input, including mask literals. */
  value: string;
  /** The value with every mask literal removed. */
  unmaskedValue: string;
}

interface InputBaseProps extends Omit<
  JSX.InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "defaultValue" | "onInput" | "onChange" | "children" | "prefix"
> {
  class?: string;
  /** Whether the input is invalid. Ignored while nested in a `Field`. */
  invalid?: boolean;
  /** Content rendered at the start of the control. */
  prefix?: JSX.Element;
  /** Content rendered at the end of the control. */
  suffix?: JSX.Element;
  value?: string | number;
  defaultValue?: string | number;
  onInput?: JSX.InputHTMLAttributes<HTMLInputElement>["onInput"];
  onChange?: JSX.InputHTMLAttributes<HTMLInputElement>["onChange"];
  /** Called with the display value and its mask-stripped counterpart. */
  onValueChange?: (details: InputValueDetails) => void;
}

interface TextLikeInputProps extends InputBaseProps {
  inputType?: "text" | "email" | "tel" | "search";
  mask?: InputMask;
}

interface PasswordInputProps extends InputBaseProps {
  inputType: "password";
  mask?: never;
}

interface NumberInputProps extends InputBaseProps {
  inputType: "number";
  mask?: never;
  /** Amount the increment/decrement triggers add or remove. Defaults to `1`. */
  step?: number;
  /** Lower bound enforced while stepping. */
  min?: number;
  /** Upper bound enforced while stepping. */
  max?: number;
}

/**
 * Props for `Input`. The options that are accepted depend on `inputType`:
 * text-like inputs take a `mask`, number inputs take `step`/`min`/`max`, and
 * password inputs take neither.
 */
type InputProps = TextLikeInputProps | PasswordInputProps | NumberInputProps;

interface InputControlProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
  "data-invalid"?: "";
  "data-required"?: "";
  "data-readonly"?: "";
}

const styles = {
  root: css({ width: "full" }),
  control: flex({
    align: "center",
    width: "full",
    height: "10",
    backgroundColor: "surface",
    borderWidth: "1px",
    borderColor: "outlineVariant",
    rounded: "lg",
    overflow: "hidden",
    transition: "border-color 150ms, outline-color 150ms",
    _hover: { borderColor: "outline" },
    _focusWithin: {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary",
      outlineOffset: "0",
      borderColor: "primary",
    },
    "&[data-invalid]": { borderColor: "error" },
    "&[data-readonly]": { backgroundColor: "surfaceContainerLow" },
    "&[data-disabled]": { opacity: 0.38, cursor: "not-allowed" },
  }),
  input: css({
    flex: "1",
    minWidth: "0",
    height: "full",
    paddingX: "3",
    fontSize: "sm",
    color: "onSurface",
    backgroundColor: "transparent",
    outlineStyle: "none",
    outlineWidth: "0",
    _placeholder: { color: "onSurfaceVariant" },
    _disabled: { cursor: "not-allowed" },
    "&[type=number]": { appearance: "textfield" },
    "&[type=number]::-webkit-outer-spin-button, &[type=number]::-webkit-inner-spin-button": {
      appearance: "none",
      margin: "0",
    },
  }),
  affix: css({
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
    fontSize: "sm",
    color: "onSurfaceVariant",
  }),
  affixStart: css({ paddingInlineStart: "3" }),
  affixEnd: css({ paddingInlineEnd: "3" }),
  numberTriggers: css({
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    alignSelf: "stretch",
    marginBlock: "1.5",
    marginInlineEnd: "2",
    rounded: "sm",
    overflow: "hidden",
    backgroundColor: "surfaceContainerHighest",
    boxShadow: "sm",
  }),
  stepper: center({
    flex: "1",
    minHeight: "0",
    paddingX: "1",
    color: "onSurfaceVariant",
    cursor: "pointer",
    fontSize: "sm",
    "& svg": { boxSize: "2.5" },
    _hover: { color: "onSurface", backgroundColor: "surfaceContainerHighest" },
    _focusVisible: {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary",
      outlineOffset: "-2px",
    },
    _disabled: { opacity: 0.38, cursor: "not-allowed" },
  }),
  trigger: center({
    flexShrink: 0,
    width: "10",
    height: "full",
    color: "onSurfaceVariant",
    cursor: "pointer",
    fontSize: "md",
    "& svg": { boxSize: "5" },
    _hover: { color: "onSurface" },
    _focusVisible: {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary",
      outlineOffset: "-2px",
    },
    _disabled: { opacity: 0.38, cursor: "not-allowed" },
  }),
};

/** Whether an optional piece of content should render. */
function isVisible(element: JSX.Element | undefined): boolean {
  return element !== undefined && element !== null;
}

/**
 * A single text field that adapts to `inputType`. Number inputs add
 * `step`/`min`/`max` stepping triggers, password inputs add a visibility
 * toggle, and text-like inputs accept a `mask` pattern.
 */
function Input(props: InputProps): JSX.Element {
  const field = useFieldContext();
  const generatedId = createUniqueId();
  const [local, rest] = splitProps(props, [
    "inputType",
    "mask",
    "prefix",
    "suffix",
    "class",
    "invalid",
    "id",
    "disabled",
    "readOnly",
    "required",
    "value",
    "defaultValue",
    "onValueChange",
  ]);

  let inputEl: HTMLInputElement | undefined = undefined;
  let holdDelay: ReturnType<typeof setTimeout> | undefined = undefined;
  let holdRepeat: ReturnType<typeof setInterval> | undefined = undefined;
  const [passwordVisible, setPasswordVisible] = createSignal(false);
  // Mirrors the DOM value so the steppers can disable at their limits.
  const [currentValue, setCurrentValue] = createSignal<string>(
    untrack(() => {
      if (local.value === undefined && local.defaultValue === undefined) {
        return "";
      }
      return String(local.value ?? local.defaultValue);
    }),
  );

  const type = (): InputType => local.inputType ?? "text";
  // Primitive memo so an inline `mask` object identity doesn't invalidate work.
  const pattern = createMemo(() => local.mask?.pattern);
  const isNumber = createMemo(() => type() === "number");
  const invalid = (): boolean => field?.invalid() ?? local.invalid ?? false;
  const disabled = (): boolean => field?.disabled() ?? local.disabled ?? false;
  const readOnly = (): boolean => field?.readOnly() ?? local.readOnly ?? false;
  const required = (): boolean => field?.required() ?? local.required ?? false;

  const step = (): number | undefined => (props.inputType === "number" ? props.step : undefined);
  const min = (): number | undefined => (props.inputType === "number" ? props.min : undefined);
  const max = (): number | undefined => (props.inputType === "number" ? props.max : undefined);

  /** Whether the value can still move one `step` in the given direction. */
  const canStep = (direction: 1 | -1): boolean => {
    const parsed = currentValue() === "" ? 0 : Number(currentValue());
    if (!Number.isFinite(parsed)) {
      return true;
    }
    const limit = direction > 0 ? max() : min();
    if (typeof limit !== "number") {
      return true;
    }
    return direction > 0 ? parsed < limit : parsed > limit;
  };

  const resolvedType = (): string => {
    if (type() === "password") {
      return passwordVisible() ? "text" : "password";
    }
    return type();
  };

  const inputProps = (): InputControlProps => {
    if (field) {
      return field.getInputProps();
    }
    return {
      id: local.id ?? generatedId,
      disabled: disabled(),
      required: required(),
      readOnly: readOnly() || undefined,
      "aria-invalid": ariaAttr(invalid()),
      "data-invalid": dataAttr(invalid()),
      "data-required": dataAttr(required()),
      "data-readonly": dataAttr(readOnly()),
    };
  };

  /** Re-formats the typed value and reports the masked/unmasked pair. */
  const handleInput = (): void => {
    const el = inputEl;
    if (!el) {
      return;
    }
    const current = pattern();
    if (current === undefined) {
      if (isNumber()) {
        setCurrentValue(el.value);
      }
      local.onValueChange?.({ value: el.value, unmaskedValue: el.value });
      return;
    }
    const caret = el.selectionStart ?? el.value.length;
    const next = formatMask(el.value, current, caret);
    if (next.value !== el.value) {
      el.value = next.value;
      el.setSelectionRange(next.caret, next.caret);
    }
    local.onValueChange?.({ value: next.value, unmaskedValue: unmask(next.value) });
  };

  /** Enforces `min`/`max` around the current value by `step`. */
  const nudge = (direction: 1 | -1): void => {
    const el = inputEl;
    if (!el) {
      return;
    }
    const parsed = el.value === "" ? 0 : Number(el.value);
    let next = (Number.isFinite(parsed) ? parsed : 0) + direction * (step() ?? 1);
    const lower = min();
    const upper = max();
    if (typeof lower === "number") {
      next = Math.max(lower, next);
    }
    if (typeof upper === "number") {
      next = Math.min(upper, next);
    }
    const value = String(Number.parseFloat(next.toFixed(10)));
    if (value === el.value) {
      return;
    }
    el.value = value;
    setCurrentValue(value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  };

  /** Stops any in-flight press-and-hold repeat. */
  const clearHold = (): void => {
    if (holdDelay !== undefined) {
      clearTimeout(holdDelay);
      holdDelay = undefined;
    }
    if (holdRepeat !== undefined) {
      clearInterval(holdRepeat);
      holdRepeat = undefined;
    }
  };

  /** Nudges once, then keeps nudging while the trigger stays pressed. */
  const startHold = (direction: 1 | -1): void => {
    clearHold();
    nudge(direction);
    holdDelay = setTimeout(() => {
      holdRepeat = setInterval(() => {
        if (!canStep(direction)) {
          clearHold();
          return;
        }
        nudge(direction);
      }, 80);
    }, 400);
  };

  onCleanup(clearHold);

  const togglePassword = (): void => {
    setPasswordVisible((visible) => !visible);
  };

  onMount(() => {
    const el = inputEl;
    if (!el) {
      return;
    }

    if (local.value === undefined && local.defaultValue !== undefined) {
      const raw = String(local.defaultValue);
      const current = pattern();
      el.value = current === undefined ? raw : applyMask(raw, current);
    }
    if (isNumber()) {
      setCurrentValue(el.value);
    }

    el.addEventListener("input", handleInput);
    onCleanup(() => {
      el.removeEventListener("input", handleInput);
    });
  });

  // Keep the DOM in sync when a controlled `value` changes from the outside.
  // The equality guard preserves the caret while the user is typing.
  createEffect(() => {
    const el = inputEl;
    const controlled = local.value;
    if (!el || controlled === undefined) {
      return;
    }
    const raw = String(controlled);
    const current = pattern();
    const next = current === undefined ? raw : applyMask(raw, current);
    if (isNumber()) {
      setCurrentValue(next);
    }
    if (el.value !== next) {
      el.value = next;
    }
  });

  return (
    <div data-scope="input" data-part="root" class={cx(styles.root, local.class)}>
      <div
        data-scope="input"
        data-part="control"
        data-invalid={dataAttr(invalid())}
        data-disabled={dataAttr(disabled())}
        data-readonly={dataAttr(readOnly())}
        class={styles.control}
      >
        <Show when={isVisible(local.prefix)}>
          <span data-part="prefix" class={cx(styles.affix, styles.affixStart)}>
            {local.prefix}
          </span>
        </Show>

        <input
          {...inputProps()}
          {...rest}
          ref={(el) => {
            inputEl = el;
          }}
          type={resolvedType()}
          class={styles.input}
        />

        <Show when={isVisible(local.suffix)}>
          <span data-part="suffix" class={cx(styles.affix, styles.affixEnd)}>
            {local.suffix}
          </span>
        </Show>

        <Show when={isNumber()}>
          <div data-part="number-triggers" class={styles.numberTriggers}>
            <button
              type="button"
              data-part="increment-trigger"
              aria-label="Increment"
              class={styles.stepper}
              disabled={disabled() || readOnly() || !canStep(1)}
              onPointerDown={() => {
                startHold(1);
              }}
              onPointerUp={clearHold}
              onPointerCancel={clearHold}
              onPointerLeave={clearHold}
              onMouseDown={(event) => {
                event.preventDefault();
              }}
              onClick={(event) => {
                if (event.detail === 0) {
                  nudge(1);
                }
              }}
            >
              <Add />
            </button>
            <button
              type="button"
              data-part="decrement-trigger"
              aria-label="Decrement"
              class={styles.stepper}
              disabled={disabled() || readOnly() || !canStep(-1)}
              onPointerDown={() => {
                startHold(-1);
              }}
              onPointerUp={clearHold}
              onPointerCancel={clearHold}
              onPointerLeave={clearHold}
              onMouseDown={(event) => {
                event.preventDefault();
              }}
              onClick={(event) => {
                if (event.detail === 0) {
                  nudge(-1);
                }
              }}
            >
              <Remove />
            </button>
          </div>
        </Show>

        <Show when={type() === "password"}>
          <button
            type="button"
            data-part="visibility-trigger"
            aria-label={passwordVisible() ? "Hide password" : "Show password"}
            aria-pressed={passwordVisible()}
            class={styles.trigger}
            disabled={disabled() || readOnly()}
            onMouseDown={(event) => {
              event.preventDefault();
            }}
            onClick={togglePassword}
          >
            <Show when={passwordVisible()} fallback={<VisibilityOff />}>
              <Visibility />
            </Show>
          </button>
        </Show>
      </div>
    </div>
  );
}

export { Input };
export type {
  InputBaseProps,
  InputMask,
  InputProps,
  InputType,
  InputValueDetails,
  NumberInputProps,
  PasswordInputProps,
  TextLikeInputProps,
};
