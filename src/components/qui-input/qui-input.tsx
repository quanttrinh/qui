import {
  resolveVar,
  AttachInternals,
  Component,
  Element,
  Event as StencilEvent,
  forceUpdate,
  h,
  Host,
  Prop,
  State,
  Watch,
  type EventEmitter,
  type VNode,
} from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css, cx } from "#styled-system/css";

import { ariaAttr, dataAttr } from "../../helpers/attr";
import { isHTMLInputElement } from "../../helpers/dom";
import { nextId } from "../../helpers/id";
import { applyMask, formatMask, unmask } from "../../helpers/mask";
import { AddIcon, RemoveIcon, VisibilityIcon, VisibilityOffIcon } from "../qui-icon/icons";
import { FormControlBase } from "../shared/form-control/component-base";
import { FormController, type FormValidity } from "../shared/form-control/controller";

/** The input types `qui-input` can render. */
export type InputType = "text" | "email" | "tel" | "search" | "password" | "number";

/** The `inputmode` hints supported by the native input. */
export type InputMode =
  | "none"
  | "text"
  | "tel"
  | "url"
  | "email"
  | "numeric"
  | "decimal"
  | "search";

/**
 * A character mask for text-like inputs. `#` matches a digit, `a` a letter and
 * `*` a letter or digit; any other character is a literal that is inserted
 * automatically.
 */
export interface InputMask {
  /** The pattern to apply, e.g. `"### ###-####"` or `"aa-######-a"`. */
  pattern: string;
}

/** The values handed to `valuechange` after every edit. */
export interface InputValueDetails {
  /** The value shown in the input, including mask literals. */
  value: string;
  /** The value with every mask literal removed. */
  unmaskedValue: string;
}

const styles = {
  host: css({ display: "block" }),
  root: css({ width: "full" }),
  control: css({
    display: "flex",
    alignItems: "center",
    width: "full",
    height: "10",
    backgroundColor: "surface",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "outlineVariant",
    rounded: "lg",
    overflow: "hidden",
    transition: "border-color 150ms, outline-color 150ms",
    "&:hover": { borderColor: "outline" },
    "&:focus-within": {
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
    borderWidth: "0",
    "&::placeholder": { color: "onSurfaceVariant" },
    "&:disabled": { cursor: "not-allowed" },
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
    "&:empty": { display: "none" },
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
  stepper: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: "1",
    minHeight: "0",
    paddingX: "1",
    color: "onSurfaceVariant",
    cursor: "pointer",
    fontSize: "sm",
    backgroundColor: "transparent",
    borderWidth: "0",
    "& svg": { width: "10px", height: "10px" },
    "&:hover": { color: "onSurface", backgroundColor: "surfaceContainerHighest" },
    "&:focus-visible": {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary",
      outlineOffset: "-2px",
    },
    "&:disabled": { opacity: 0.38, cursor: "not-allowed" },
  }),
  trigger: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    width: "10",
    height: "full",
    color: "onSurfaceVariant",
    cursor: "pointer",
    fontSize: "md",
    backgroundColor: "transparent",
    borderWidth: "0",
    "& svg": { width: "20px", height: "20px" },
    "&:hover": { color: "onSurface" },
    "&:focus-visible": {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary",
      outlineOffset: "-2px",
    },
    "&:disabled": { opacity: 0.38, cursor: "not-allowed" },
  }),
};

/**
 * A single-line input with optional masks, number stepping, and a password
 * visibility toggle. When nested in `qui-field`, it inherits the field ids and
 * state.
 *
 * @slot prefix - Content rendered at the start of the control.
 * @slot suffix - Content rendered at the end of the control.
 */
@Component({
  tag: "qui-input",
  styleUrl: resolveVar(styleUrls.quiInput),
  scoped: true,
  formAssociated: true,
})
export class QuiInput extends FormControlBase {
  @Element() host!: HTMLQuiInputElement;
  @AttachInternals() internals!: ElementInternals;

  /** The input type to render. */
  @Prop() inputType: InputType = "text";
  /** A mask object. Property-only; use `maskPattern` from HTML. */
  @Prop() mask?: InputMask;
  /** A mask pattern, e.g. `"### ###-####"`. */
  @Prop() maskPattern?: string;
  /** The controlled value. */
  @Prop() value?: string | number;
  /** The initial value for an uncontrolled input. */
  @Prop() defaultValue?: string | number;
  /** Overrides the generated input id. */
  @Prop() inputId?: string;
  /** The form field name. */
  @Prop() name?: string;
  /** Placeholder text. */
  @Prop() placeholder?: string;
  /** Autocomplete hint. */
  @Prop() autocomplete?: string;
  /** Input mode hint. */
  @Prop() inputModeHint?: InputMode;
  /** Maximum number of characters. */
  @Prop() maxLength?: number;
  /** Minimum number of characters. */
  @Prop() minLength?: number;
  /** Native validation pattern. */
  @Prop() inputPattern?: string;
  /** Marks the input invalid. Ignored while nested in a `qui-field`. */
  @Prop() invalid = false;
  /** Disables the input. Ignored while nested in a `qui-field`. */
  @Prop() disabled = false;
  /** Makes the input read-only. Ignored while nested in a `qui-field`. */
  @Prop() readOnly = false;
  /** Marks the input required. Ignored while nested in a `qui-field`. */
  @Prop() required = false;
  /** Amount the number triggers add or remove. Defaults to `1`. */
  @Prop() step?: number;
  /** Lower bound enforced while stepping. */
  @Prop() min?: number;
  /** Upper bound enforced while stepping. */
  @Prop() max?: number;
  /** Additional class applied to the root element. */
  @Prop() innerClass?: string;

  /** Emitted after every edit with the masked and unmasked values. */
  @StencilEvent({ eventName: "valuechange", bubbles: true, composed: true })
  private readonly valueChange!: EventEmitter<InputValueDetails>;

  @State() private passwordVisible = false;
  @State() private currentValue = "";

  private inputEl?: HTMLInputElement;
  private holdDelay?: ReturnType<typeof setTimeout>;
  private holdRepeat?: ReturnType<typeof setInterval>;
  private initialValue = "";
  private readonly generatedId = nextId("qui-input");
  private readonly form = new FormController({
    getHost: (): HTMLElement => this.host,
    getInternals: (): ElementInternals => this.internals,
    getName: (): string | undefined => this.name,
    getMultiple: (): boolean => false,
    getValue: (): readonly string[] => {
      const value = this.inputEl?.value;
      return value === undefined ? [] : [value];
    },
    getDisabled: (): boolean => this.disabled,
    getReadOnly: (): boolean => this.readOnly,
    getRequired: (): boolean => this.required,
    getInvalid: (): boolean => this.invalid,
    getValidationElement: (): HTMLElement | undefined => this.inputEl,
    getFormValue: (): string => this.inputEl?.value ?? "",
    getValidity: (): FormValidity => this.validity(),
    getSignature: (): string => this.formSignature(),
    onReset: (): void => {
      this.value = this.initialValue;
      this.applyValue(this.initialValue);
    },
    onRestore: (values: string[]): void => {
      const value = values.at(0) ?? "";
      this.value = value;
      this.applyValue(value);
    },
    requestUpdate: (): void => {
      forceUpdate(this.host);
    },
  });

  constructor() {
    super();
    this.addController(this.form);
  }

  protected get formController(): FormController {
    return this.form;
  }

  public componentWillLoad(): void {
    super.componentWillLoad();
    this.initialValue = String(this.defaultValue ?? this.value ?? "");
    this.syncInitialValue();
  }

  public componentDidLoad(): void {
    super.componentDidLoad();
    // Applies the initial value to the native input; state is already seeded.
    this.syncInitialValue();
    this.form.sync();
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback();
    this.clearHold();
  }

  @Watch("value")
  private syncControlledValue(): void {
    if (this.value === undefined) {
      return;
    }
    this.applyValue(String(this.value));
  }

  @Watch("mask")
  @Watch("maskPattern")
  private resyncMaskedValue(): void {
    if (this.inputEl === undefined) {
      return;
    }
    this.applyValue(this.inputEl.value);
  }

  @Watch("required")
  @Watch("invalid")
  private syncFormValidity(): void {
    this.form.sync();
  }

  private get pattern(): string | undefined {
    return this.mask?.pattern ?? this.maskPattern;
  }

  private get isNumber(): boolean {
    return this.inputType === "number";
  }

  private get resolvedType(): string {
    if (this.inputType === "password") {
      return this.passwordVisible ? "text" : "password";
    }
    return this.inputType;
  }

  private get inputProps(): Record<string, string | number | boolean | undefined> {
    const props: Record<string, unknown> =
      this.form.fieldApi === undefined
        ? {
            id: this.inputId ?? (this.host.id || this.generatedId),
            disabled: this.form.isDisabled,
            readOnly: this.form.isReadOnly || undefined,
            "aria-invalid": ariaAttr(this.form.isInvalid),
            "data-scope": "input",
            "data-part": "input",
            "data-invalid": dataAttr(this.form.isInvalid),
            "data-required": dataAttr(this.form.isRequired),
            "data-readonly": dataAttr(this.form.isReadOnly),
          }
        : { ...this.form.fieldApi.getInputProps() };
    delete props.required;
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    return props as Record<string, string | number | boolean | undefined>;
  }

  private syncInitialValue(): void {
    if (this.value !== undefined) {
      this.applyValue(String(this.value));
    } else if (this.defaultValue !== undefined) {
      this.applyValue(String(this.defaultValue));
    }
  }

  private applyValue(raw: string): void {
    const { pattern } = this;
    const next = pattern === undefined ? raw : applyMask(raw, pattern);
    if (this.inputEl !== undefined && this.inputEl.value !== next) {
      this.inputEl.value = next;
    }
    if (this.isNumber) {
      this.currentValue = next;
    }
    this.form.sync();
  }

  private validity(): FormValidity {
    const element = this.inputEl;
    if (element === undefined) {
      return { flags: {} };
    }
    if (this.form.isInvalid) {
      return { flags: { customError: true }, message: "Invalid value", element };
    }
    if (this.form.isRequired && element.value === "") {
      return {
        flags: { valueMissing: true },
        message: "Please fill out this field.",
        element,
      };
    }
    const { validity } = element;
    if (validity.valid) {
      return { flags: {} };
    }
    return {
      flags: {
        badInput: validity.badInput,
        customError: validity.customError,
        patternMismatch: validity.patternMismatch,
        rangeOverflow: validity.rangeOverflow,
        rangeUnderflow: validity.rangeUnderflow,
        stepMismatch: validity.stepMismatch,
        tooLong: validity.tooLong,
        tooShort: validity.tooShort,
        typeMismatch: validity.typeMismatch,
        valueMissing: validity.valueMissing,
      },
      message: element.validationMessage,
      element,
    };
  }

  private formSignature(): string {
    const element = this.inputEl;
    return `${element?.value ?? ""}\u0001${this.form.isRequired ? 1 : 0}\u0001${
      this.form.isInvalid ? 1 : 0
    }\u0001${element?.validity.valid === true ? 1 : 0}\u0001${element?.validationMessage ?? ""}`;
  }

  private readonly handleInput = (event: Event): void => {
    const el = event.target;
    if (!isHTMLInputElement(el)) {
      return;
    }
    const { pattern } = this;
    if (pattern === undefined) {
      if (this.isNumber) {
        this.currentValue = el.value;
      }
      this.emitValue(el.value, el.value);
      this.form.sync();
      return;
    }

    const caret = el.selectionStart ?? el.value.length;
    const next = formatMask(el.value, pattern, caret);
    if (next.value !== el.value) {
      el.value = next.value;
      el.setSelectionRange(next.caret, next.caret);
    }
    if (this.isNumber) {
      this.currentValue = next.value;
    }
    this.emitValue(next.value, unmask(next.value));
    this.form.sync();
  };

  private emitValue(value: string, unmaskedValue: string): void {
    this.valueChange.emit({ value, unmaskedValue });
  }

  /** Whether the value can still move one `step` in the given direction. */
  private canStep(direction: 1 | -1): boolean {
    const parsed = this.currentValue === "" ? 0 : Number(this.currentValue);
    if (!Number.isFinite(parsed)) {
      return true;
    }
    const limit = direction > 0 ? this.max : this.min;
    if (typeof limit !== "number") {
      return true;
    }
    return direction > 0 ? parsed < limit : parsed > limit;
  }

  /** Enforces `min`/`max` around the current value by `step`. */
  private nudge(direction: 1 | -1): void {
    const el = this.inputEl;
    if (el === undefined) {
      return;
    }
    const parsed = el.value === "" ? 0 : Number(el.value);
    let next = (Number.isFinite(parsed) ? parsed : 0) + direction * (this.step ?? 1);
    if (typeof this.min === "number") {
      next = Math.max(this.min, next);
    }
    if (typeof this.max === "number") {
      next = Math.min(this.max, next);
    }
    const value = String(Number(next.toFixed(10)));
    if (value === el.value) {
      return;
    }
    el.value = value;
    this.currentValue = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  private clearHold(): void {
    if (this.holdDelay !== undefined) {
      clearTimeout(this.holdDelay);
      this.holdDelay = undefined;
    }
    if (this.holdRepeat !== undefined) {
      clearInterval(this.holdRepeat);
      this.holdRepeat = undefined;
    }
  }

  /** Nudges once, then keeps nudging while the trigger stays pressed. */
  private startHold(direction: 1 | -1): void {
    this.clearHold();
    this.nudge(direction);
    this.holdDelay = setTimeout(() => {
      this.holdRepeat = setInterval(() => {
        if (!this.canStep(direction)) {
          this.clearHold();
          return;
        }
        this.nudge(direction);
      }, 80);
    }, 400);
  }

  private readonly handleTogglePassword = (): void => {
    this.passwordVisible = !this.passwordVisible;
  };

  public render(): VNode {
    return (
      <Host class={styles.host}>
        <div data-scope="input" data-part="root" class={cx(styles.root, this.innerClass)}>
          <div
            data-scope="input"
            data-part="control"
            data-invalid={dataAttr(this.form.isInvalid)}
            data-disabled={dataAttr(this.form.isDisabled)}
            data-readonly={dataAttr(this.form.isReadOnly)}
            class={styles.control}
            part="control"
          >
            <span data-part="prefix" class={cx(styles.affix, styles.affixStart)}>
              <slot name="prefix" />
            </span>

            <input
              {...this.inputProps}
              ref={(el) => {
                if (isHTMLInputElement(el)) {
                  this.inputEl = el;
                }
              }}
              type={this.resolvedType}
              placeholder={this.placeholder}
              autocomplete={this.autocomplete}
              inputMode={this.inputModeHint}
              maxLength={this.maxLength}
              minLength={this.minLength}
              pattern={this.inputPattern}
              class={styles.input}
              part="input"
              onInput={this.handleInput}
            />

            <span data-part="suffix" class={cx(styles.affix, styles.affixEnd)}>
              <slot name="suffix" />
            </span>

            {this.isNumber ? (
              <div data-part="number-triggers" class={styles.numberTriggers}>
                <button
                  type="button"
                  data-part="increment-trigger"
                  aria-label="Increment"
                  class={styles.stepper}
                  disabled={this.form.isDisabled || this.form.isReadOnly || !this.canStep(1)}
                  onPointerDown={() => {
                    this.startHold(1);
                  }}
                  onPointerUp={() => {
                    this.clearHold();
                  }}
                  onPointerCancel={() => {
                    this.clearHold();
                  }}
                  onPointerLeave={() => {
                    this.clearHold();
                  }}
                  onMouseDown={(event) => {
                    event.preventDefault();
                  }}
                  onClick={(event) => {
                    if (event.detail === 0) {
                      this.nudge(1);
                    }
                  }}
                >
                  <AddIcon />
                </button>
                <button
                  type="button"
                  data-part="decrement-trigger"
                  aria-label="Decrement"
                  class={styles.stepper}
                  disabled={this.form.isDisabled || this.form.isReadOnly || !this.canStep(-1)}
                  onPointerDown={() => {
                    this.startHold(-1);
                  }}
                  onPointerUp={() => {
                    this.clearHold();
                  }}
                  onPointerCancel={() => {
                    this.clearHold();
                  }}
                  onPointerLeave={() => {
                    this.clearHold();
                  }}
                  onMouseDown={(event) => {
                    event.preventDefault();
                  }}
                  onClick={(event) => {
                    if (event.detail === 0) {
                      this.nudge(-1);
                    }
                  }}
                >
                  <RemoveIcon />
                </button>
              </div>
            ) : undefined}

            {this.inputType === "password" ? (
              <button
                type="button"
                data-part="visibility-trigger"
                aria-label={this.passwordVisible ? "Hide password" : "Show password"}
                aria-pressed={this.passwordVisible ? "true" : "false"}
                class={styles.trigger}
                disabled={this.form.isDisabled || this.form.isReadOnly}
                onMouseDown={(event) => {
                  event.preventDefault();
                }}
                onClick={this.handleTogglePassword}
              >
                {this.passwordVisible ? <VisibilityIcon /> : <VisibilityOffIcon />}
              </button>
            ) : undefined}
          </div>
        </div>
      </Host>
    );
  }
}
