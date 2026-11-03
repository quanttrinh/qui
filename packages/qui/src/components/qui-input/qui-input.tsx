// oxlint-disable max-lines -- the input component owns its formatting, sanitization, and form logic.
import {
  resolveVar,
  AttachInternals,
  Component,
  Element,
  Event as StencilEvent,
  forceUpdate,
  h,
  Host,
  Method,
  Prop,
  State,
  Watch,
  type EventEmitter,
  type VNode,
} from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { cx } from "#styled-system/css";

import { ariaAttr, dataAttr } from "../../helpers/attr";
import { applyTextCase, type TextCase } from "../../helpers/case";
import { isHTMLInputElement } from "../../helpers/dom";
import { nextId } from "../../helpers/id";
import { applyMask, formatMask, rawFromMasked, unmask } from "../../helpers/mask";
import { ensureShadowStylesheet } from "../../utilities/styles";
import { AddIcon, RemoveIcon, VisibilityIcon, VisibilityOffIcon } from "../qui-icon/icons";
import { applyFieldAria } from "../shared/field/aria";
import { createFieldControl, focusElement } from "../shared/field/control";
import { FormControlBase } from "../shared/form-control/component-base";
import { FormController, type FormValidity } from "../shared/form-control/controller";
import { styles } from "./styles";

/** The input types `qui-input` can render. */
export type InputType = "text" | "email" | "tel" | "search" | "password" | "number" | "url";

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

/** How the input normalizes the value's case. */
export type InputTextCase = TextCase;

/** The native `autocapitalize` hints supported by the inner input. */
export type InputAutocapitalize = "none" | "off" | "sentences" | "on" | "words" | "characters";

/** The native `enterkeyhint` hints supported by the inner input. */
export type InputEnterKeyHint = "enter" | "done" | "go" | "next" | "previous" | "search" | "send";

const SELECTABLE_INPUT_TYPES = new Set<InputType>(["text", "search", "tel", "password", "url"]);

/** The values handed to `valuechange` after every edit. */
export interface InputValueDetails {
  /** The value shown in the input, including mask literals. */
  value: string;
  /** The value with every mask literal removed. */
  unmaskedValue: string;
}

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
  shadow: true,
  formAssociated: true,
})
export class QuiInput extends FormControlBase {
  @Element() host!: HTMLQuiInputElement;
  @AttachInternals() internals!: ElementInternals;

  /** The input type to render. */
  @Prop() inputType: InputType = "text";
  /**
   * A character mask for text-like inputs. `#` matches a digit, `a` a letter and
   * `*` a letter or digit; any other character is a literal that is inserted
   * automatically.
   */
  @Prop() maskPattern?: string;
  /** Normalizes the value's case before masking. Ignored for number inputs. */
  @Prop() textCase: InputTextCase = "none";
  /**
   * Native `autocapitalize` hint for the inner input. When omitted, derives
   * from `textCase`: `characters` for uppercase and `none` for lowercase.
   */
  @Prop() autocapitalizeHint?: InputAutocapitalize;
  /** The controlled value. */
  @Prop({ mutable: true }) value?: string | number;
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
  /** Allows multiple comma-separated values. Only applies to `email` inputs. */
  @Prop() multiple = false;
  /** Native `enterkeyhint` hint for the virtual keyboard. */
  @Prop() keyboardHint: InputEnterKeyHint | "" = "";
  /** Native `spellcheck` hint for text and search inputs. */
  @Prop() spellcheckHint?: boolean;
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
  /** Amount the number triggers add or remove, or `any` for arbitrary values. Defaults to `1`. */
  @Prop({ mutable: true }) step?: number | "any";
  /** Lower bound enforced while stepping. */
  @Prop() min?: number;
  /** Upper bound enforced while stepping. */
  @Prop() max?: number;

  /** Emitted after every edit with the masked and unmasked values. */
  @StencilEvent({ eventName: "valuechange", bubbles: true, composed: true })
  private readonly valueChange!: EventEmitter<InputValueDetails>;

  @State() private passwordVisible = false;
  @State() private currentValue = "";

  private inputEl?: HTMLInputElement;
  private holdDelay?: ReturnType<typeof setTimeout>;
  private holdRepeat?: ReturnType<typeof setInterval>;
  private initialValue = "";
  private rawValue = "";
  private readonly generatedId = nextId("qui-input");
  private readonly fieldControl = createFieldControl(() => this.inputEl);
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
    this.form.setControl(this.fieldControl);
  }

  protected get formController(): FormController {
    return this.form;
  }

  public connectedCallback(): void {
    super.connectedCallback();
    ensureShadowStylesheet(this.host);
  }

  public componentWillLoad(): void {
    super.componentWillLoad();
    this.normalizeStep();
    this.initialValue = String(this.defaultValue ?? this.value ?? "");
    this.syncInitialValue();
  }

  public componentDidLoad(): void {
    super.componentDidLoad();
    // Applies the initial value to the native input; state is already seeded.
    this.syncInitialValue();
    this.form.sync();
  }

  public componentDidRender(): void {
    super.componentDidRender();
    applyFieldAria(this.inputEl, this.form.fieldApi);
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback();
    this.inputEl?.removeEventListener("beforeinput", this.handleBeforeInput);
    this.clearHold();
  }

  /** Moves focus to the internal native input. */
  @Method()
  public async focusControl(options?: FocusOptions): Promise<void> {
    await focusElement(this.inputEl, options);
  }

  @Watch("value")
  private syncControlledValue(): void {
    if (this.value === undefined) {
      return;
    }
    this.applyValue(String(this.value));
  }

  @Watch("step")
  private normalizeStep(): void {
    const step: unknown = this.step;
    if (typeof step !== "string" || step === "any") {
      return;
    }
    if (step.trim() === "") {
      this.step = undefined;
      return;
    }
    const value = Number(step);
    this.step = Number.isFinite(value) ? value : undefined;
  }

  @Watch("maskPattern")
  @Watch("textCase")
  @Watch("inputModeHint")
  @Watch("inputType")
  private resyncFormattedValue(): void {
    const el = this.inputEl;
    if (el === undefined) {
      return;
    }
    const caret = el.selectionStart ?? el.value.length;
    this.applyValue(this.rawValue);
    if (this.supportsSelection && el.ownerDocument.activeElement === el) {
      const position = Math.min(caret, el.value.length);
      el.setSelectionRange(position, position);
    }
  }

  @Watch("required")
  @Watch("invalid")
  private syncFormValidity(): void {
    this.form.sync();
  }

  private get pattern(): string | undefined {
    return this.maskPattern;
  }

  private get isNumber(): boolean {
    return this.inputType === "number";
  }

  private get supportsSelection(): boolean {
    return SELECTABLE_INPUT_TYPES.has(this.inputType);
  }

  private get supportsSpellcheck(): boolean {
    return this.inputType === "text" || this.inputType === "search";
  }

  private get numericStep(): number | undefined {
    const step: unknown = this.step;
    if (typeof step !== "number" || !Number.isFinite(step) || step <= 0) {
      return undefined;
    }
    return step;
  }

  private get effectiveInputMode(): InputMode | undefined {
    if (this.inputModeHint !== undefined) {
      return this.inputModeHint;
    }
    return this.isNumber ? "numeric" : undefined;
  }

  private get resolvedType(): string {
    if (this.inputType === "password") {
      return this.passwordVisible ? "text" : "password";
    }
    return this.inputType;
  }

  private get resolvedAutocapitalize(): InputAutocapitalize | undefined {
    if (this.autocapitalizeHint !== undefined) {
      return this.autocapitalizeHint;
    }
    if (this.isNumber) {
      return undefined;
    }
    if (this.textCase === "uppercase") {
      return "characters";
    }
    if (this.textCase === "lowercase") {
      return "none";
    }
    return undefined;
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

  private get allowNegative(): boolean {
    return this.min === undefined || this.min < 0;
  }

  private filterNumeric(raw: string): string {
    let result = "";
    for (const char of raw) {
      if (char >= "0" && char <= "9") {
        result += char;
      } else if (this.allowNegative && char === "-" && result.length === 0) {
        result = "-";
      }
    }
    return result;
  }

  private filterDecimalCharacters(raw: string): string {
    let result = "";
    for (const char of raw) {
      if (
        (char >= "0" && char <= "9") ||
        char === "." ||
        char === "," ||
        (this.allowNegative && char === "-")
      ) {
        result += char;
      }
    }
    return result;
  }

  private sanitizeValue(raw: string): string {
    const mode = this.effectiveInputMode;
    if (mode !== "numeric" && mode !== "decimal") {
      return raw;
    }
    return mode === "numeric" ? this.filterNumeric(raw) : this.filterDecimalCharacters(raw);
  }

  private applyValue(raw: string): void {
    const sanitized = this.sanitizeValue(raw);
    const normalized = this.value !== undefined && String(this.value) !== sanitized;
    if (normalized) {
      this.value = sanitized;
    }
    this.rawValue = sanitized;
    const { pattern } = this;
    const cased = this.isNumber ? sanitized : applyTextCase(sanitized, this.textCase);
    const next = pattern === undefined ? cased : applyMask(cased, pattern);
    if (this.inputEl !== undefined && this.inputEl.value !== next) {
      this.inputEl.value = next;
    }
    if (this.isNumber) {
      this.currentValue = next;
    }
    if (normalized) {
      this.emitValue(next, sanitized);
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

  private caseAtCaret(value: string, caret: number): { caret: number; value: string } {
    if (this.isNumber) {
      return { caret, value };
    }
    const cased = applyTextCase(value, this.textCase);
    if (cased === value) {
      return { caret, value };
    }
    return { caret: applyTextCase(value.slice(0, caret), this.textCase).length, value: cased };
  }

  private commitInput(
    el: HTMLInputElement,
    result: { caret: number; unmaskedValue: string; value: string },
  ): void {
    if (result.value !== el.value) {
      el.value = result.value;
      if (this.supportsSelection) {
        el.setSelectionRange(result.caret, result.caret);
      }
    }
    if (this.isNumber) {
      this.currentValue = result.value;
    }
    this.emitValue(result.value, result.unmaskedValue);
    this.form.sync();
  }

  private isAllowedCharacter(char: string): boolean {
    if (char >= "0" && char <= "9") {
      return true;
    }
    if (this.allowNegative && char === "-") {
      return true;
    }
    return this.effectiveInputMode === "decimal" && (char === "." || char === ",");
  }

  private readonly handleBeforeInput = (event: InputEvent): void => {
    const mode = this.effectiveInputMode;
    if ((mode !== "numeric" && mode !== "decimal") || event.isComposing) {
      return;
    }
    const el = event.target;
    if (!isHTMLInputElement(el)) {
      return;
    }
    const data = event.data ?? event.dataTransfer?.getData("text") ?? "";
    for (const char of data) {
      if (!this.isAllowedCharacter(char)) {
        event.preventDefault();
        return;
      }
    }
  };

  private readonly handleInput = (event: Event): void => {
    const el = event.target;
    if (!isHTMLInputElement(el)) {
      return;
    }
    const { pattern } = this;
    const caret = el.selectionStart ?? el.value.length;
    const rawBeforeCaret =
      pattern === undefined
        ? el.value.slice(0, caret)
        : rawFromMasked(el.value.slice(0, caret), pattern);
    const raw = this.sanitizeValue(
      pattern === undefined ? el.value : rawFromMasked(el.value, pattern),
    );
    const rawCaret = this.sanitizeValue(rawBeforeCaret).length;
    this.rawValue = raw;
    const cased = this.caseAtCaret(raw, rawCaret);

    if (pattern === undefined) {
      this.commitInput(el, { ...cased, unmaskedValue: cased.value });
      return;
    }

    const next = formatMask(cased.value, pattern, cased.caret);
    this.commitInput(el, { ...next, unmaskedValue: unmask(next.value) });
  };

  private emitValue(value: string, unmaskedValue: string): void {
    this.valueChange.emit({ value, unmaskedValue });
  }

  /** Whether the value can still move one `step` in the given direction. */
  private canStep(direction: 1 | -1): boolean {
    const parsed = this.inputEl?.valueAsNumber;
    if (parsed === undefined || !Number.isFinite(parsed)) {
      return true;
    }
    const limit = direction > 0 ? this.max : this.min;
    if (typeof limit !== "number") {
      return true;
    }
    return direction > 0 ? parsed < limit : parsed > limit;
  }

  private steppedValue(current: number, direction: 1 | -1): number {
    const step = this.numericStep;
    if (step === undefined) {
      return current + direction;
    }
    const base = typeof this.min === "number" ? this.min : 0;
    const steps = (current - base) / step;
    const nextSteps = direction > 0 ? Math.floor(steps) + 1 : Math.ceil(steps) - 1;
    return base + nextSteps * step;
  }

  /** Snaps one step in the given direction, respecting `min`/`max`. */
  private nudge(direction: 1 | -1): void {
    const el = this.inputEl;
    if (el === undefined) {
      return;
    }
    const parsed = el.valueAsNumber;
    const current = Number.isFinite(parsed) ? parsed : 0;
    let next = this.steppedValue(current, direction);

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
        <div data-scope="input" data-part="root" part="root" class={styles.root}>
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
                if (this.inputEl === el) {
                  return;
                }
                this.inputEl?.removeEventListener("beforeinput", this.handleBeforeInput);
                this.inputEl = el;
                el?.addEventListener("beforeinput", this.handleBeforeInput);
              }}
              type={this.resolvedType}
              placeholder={this.placeholder}
              autocomplete={this.autocomplete}
              multiple={this.inputType === "email" && this.multiple ? true : undefined}
              enterKeyHint={this.keyboardHint === "" ? undefined : this.keyboardHint}
              spellcheck={this.supportsSpellcheck ? this.spellcheckHint : undefined}
              autocapitalize={this.resolvedAutocapitalize}
              inputMode={this.effectiveInputMode}
              maxLength={this.maxLength}
              minLength={this.minLength}
              pattern={this.inputPattern}
              min={this.isNumber ? this.min : undefined}
              max={this.isNumber ? this.max : undefined}
              step={this.isNumber ? this.step : undefined}
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
