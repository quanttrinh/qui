import {
  Maskito,
  maskitoChangeEventPlugin,
  maskitoInitialCalibrationPlugin,
  maskitoTransform,
  type MaskitoOptions,
  type MaskitoPreprocessor,
} from "@maskito/core";
import {
  Mixin,
  Build,
  resolveVar,
  AttachInternals,
  Component,
  Element,
  Event as StencilEvent,
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

import { ensureShadowStylesheet } from "../../utilities/styles";
import { AddIcon, RemoveIcon, VisibilityIcon, VisibilityOffIcon } from "../qui-icon/icons";
import { FormController, type FormValidity } from "../shared/controllers";
import { ariaAttr, dataAttr } from "../shared/helpers/aria/attr";
import { isHTMLInputElement, isHTMLSlotElement } from "../shared/helpers/dom/dom";
import { focusElement } from "../shared/helpers/dom/focus";
import { nextId } from "../shared/helpers/dom/id";
import { applyFieldAria, createFieldControl } from "../shared/helpers/field";
import { ControllerHostMixin, FormControlMixin } from "../shared/mixins";
import { applyTextCase, type TextCase } from "./case";
import { filterNumericOrDecimalInput } from "./input-filter";
import { compileMask } from "./mask";
import {
  canStepNumber,
  compileNumberMask,
  formatNumber,
  numberValidity,
  parseNumber,
  stepNumber,
} from "./number-mask";
import { styles } from "./styles";

/** The input types `qui-input` can render. */
export type InputType = "text" | "tel" | "search" | "password" | "number" | "url";

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

const SELECTABLE_INPUT_TYPES = new Set<InputType>([
  "text",
  "search",
  "tel",
  "password",
  "url",
  "number",
]);

/** The values handed to `valuechange` after every edit. */
export interface InputValueDetails {
  /** The value shown in the input, including mask literals. */
  value: string;
  /** The value with every mask literal removed. */
  unmaskedValue: string;
}

interface InputMaskConfig {
  options: MaskitoOptions;
  rawFromMasked: (value: string) => string;
  caretForRaw?: (value: string, rawCount: number) => number;
}

const PASS_THROUGH_MASK = /^[\s\S]*$/u;
const identity = (value: string): string => value;

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
export class QuiInput extends Mixin(ControllerHostMixin, FormControlMixin) {
  @Element() host!: HTMLQuiInputElement;
  @AttachInternals() internals!: ElementInternals;

  /** The input type to render. */
  @Prop() inputType: InputType = "text";
  /**
   * A mask for text-like inputs. Use `\d`, `\w`, `\s` (and their negations) for
   * matching tokens, `[a-z]` for character classes, and `{n}` for a fixed
   * repetition count. Escape literals with `\`; every other character is
   * literal. Variable-width quantifiers are not supported yet.
   */
  @Prop() mask?: string;
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
  @State() private hasPrefix = false;
  @State() private hasSuffix = false;

  private inputEl?: HTMLInputElement;
  private maskito?: Maskito;
  private inputMask?: InputMaskConfig;
  private inputMaskKey = "";
  private holdDelay?: ReturnType<typeof setTimeout>;
  private holdRepeat?: ReturnType<typeof setInterval>;
  private initialValue = "";
  private rawValue = "";
  private readonly generatedId = nextId("qui-input");
  private readonly fieldControl = createFieldControl(() => this.inputEl);
  protected readonly form = new FormController(this, {
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
  });

  constructor() {
    super();
    this.form.setControl(this.fieldControl);
  }

  connectedCallback(): void {
    super.connectedCallback();
    ensureShadowStylesheet(this.host);
  }

  componentWillLoad(): void {
    super.componentWillLoad();
    this.normalizeStep();
    this.initialValue = String(this.defaultValue ?? this.value ?? "");
    this.syncInitialValue();
  }

  componentDidLoad(): void {
    super.componentDidLoad();
    // Applies the initial value to the native input; state is already seeded.
    this.syncInitialValue();
    this.form.sync();
  }

  componentDidRender(): void {
    super.componentDidRender();
    applyFieldAria(this.inputEl, this.form.fieldApi);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.maskito?.destroy();
    this.maskito = undefined;
    this.inputEl?.removeEventListener("input", this.handleMaskInput);
    this.clearHold();
  }

  /** Moves focus to the internal native input. */
  @Method()
  async focusControl(options?: FocusOptions): Promise<void> {
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

  @Watch("mask")
  @Watch("textCase")
  @Watch("inputModeHint")
  @Watch("inputType")
  @Watch("min")
  @Watch("max")
  private resyncFormattedValue(): void {
    const el = this.inputEl;
    if (el === undefined) {
      return;
    }
    const caret = el.selectionStart ?? el.value.length;
    this.syncMaskito();
    this.applyValue(this.rawValue);
    if (this.supportsSelection && el.ownerDocument.activeElement === el) {
      const position = Math.min(caret, el.value.length);
      el.setSelectionRange(position, position);
    }
  }

  @Watch("required")
  @Watch("invalid")
  @Watch("min")
  @Watch("max")
  @Watch("step")
  private syncFormValidity(): void {
    this.form.sync();
  }

  private get inputMaskConfig(): InputMaskConfig | undefined {
    const mode = this.effectiveInputMode;
    if (this.isNumber) {
      const numberMode = this.numberFilterMode;
      const key = `number\u0000${numberMode}\u0000${this.allowNegative ? 1 : 0}`;
      if (this.inputMask !== undefined && this.inputMaskKey === key) {
        return this.inputMask;
      }
      this.inputMask = {
        options: compileNumberMask({
          allowNegative: this.allowNegative,
          decimal: numberMode === "decimal",
        }),
        rawFromMasked: (value: string): string => value,
      };
      this.inputMaskKey = key;
      return this.inputMask;
    }

    const key = `${this.mask ?? ""}\u0000${this.textCase}\u0000${mode ?? ""}\u0000${this.allowNegative}`;
    if (this.inputMask !== undefined && this.inputMaskKey === key) {
      return this.inputMask;
    }

    let maskExpression: MaskitoOptions["mask"] = PASS_THROUGH_MASK;
    let rawFromMasked = identity;
    let caretForRaw: ((value: string, rawCount: number) => number) | undefined;
    if (this.mask !== undefined && this.mask.length > 0) {
      const compiled = compileMask(this.mask);
      const { options, rawFromMasked: compiledRaw, caretForRaw: compiledCaret } = compiled;
      maskExpression = options.mask;
      rawFromMasked = compiledRaw;
      caretForRaw = compiledCaret;
    }

    const { textCase } = this;
    const preprocessors: MaskitoPreprocessor[] = [
      ({ elementState, data }) => ({
        elementState: {
          ...elementState,
          value: applyTextCase(elementState.value, textCase),
        },
        data,
      }),
    ];
    if (
      (mode === "numeric" || mode === "decimal") &&
      (this.mask === undefined || this.mask.length === 0)
    ) {
      const inputMode = mode;
      const { allowNegative } = this;
      preprocessors.push(({ elementState, data }) => ({
        elementState: {
          ...elementState,
          value: filterNumericOrDecimalInput(elementState.value, {
            allowNegative,
            mode: inputMode,
          }),
        },
        data,
      }));
    }

    this.inputMask = {
      options: {
        mask: maskExpression,
        preprocessors,
        plugins: [maskitoInitialCalibrationPlugin(), maskitoChangeEventPlugin()],
      },
      rawFromMasked,
      caretForRaw,
    };
    this.inputMaskKey = key;
    return this.inputMask;
  }

  private syncMaskito(): void {
    this.maskito?.destroy();
    this.maskito = undefined;
    this.inputEl?.removeEventListener("input", this.handleMaskInput);
    if (!Build.isBrowser) {
      return;
    }
    const el = this.inputEl;
    const config = this.inputMaskConfig;
    if (el !== undefined && config !== undefined) {
      this.maskito = new Maskito(el, config.options);
      // This runs after Maskito's listener so the caret reflects the pre-mask selection.
      el.addEventListener("input", this.handleMaskInput);
    }
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
    if (this.isNumber) {
      return "text";
    }
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
    const props: Record<string, string | number | boolean | undefined> =
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
    return props;
  }

  private syncInitialValue(): void {
    if (this.value !== undefined) {
      this.applyValue(String(this.value));
    } else if (this.defaultValue !== undefined) {
      this.applyValue(String(this.defaultValue));
    }
  }

  private get allowNegative(): boolean {
    return this.min == null || this.min < 0;
  }

  /** Number inputs accept decimals unless the numeric hint is explicit. */
  private get numberFilterMode(): "numeric" | "decimal" {
    return this.inputModeHint === "numeric" ? "numeric" : "decimal";
  }

  private normalizeInputValue(raw: string): string {
    if (this.isNumber) {
      return raw;
    }
    const mode = this.effectiveInputMode;
    if (mode !== "numeric" && mode !== "decimal") {
      return raw;
    }
    return filterNumericOrDecimalInput(raw, { allowNegative: this.allowNegative, mode });
  }

  private applyValue(raw: string): void {
    const rawValue = this.normalizeInputValue(raw);
    const config = this.inputMaskConfig;
    const next = config === undefined ? rawValue : maskitoTransform(rawValue, config.options);
    const canonical = this.isNumber ? next : rawValue;
    const changed = this.value !== undefined && String(this.value) !== canonical;
    if (changed) {
      this.value = canonical;
    }
    this.rawValue = canonical;
    if (this.inputEl !== undefined && this.inputEl.value !== next) {
      this.inputEl.value = next;
    }
    if (this.isNumber) {
      this.currentValue = next;
    }
    if (changed) {
      this.emitValue(next, this.isNumber ? next : rawValue);
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

    const native = element.validity;
    const number = this.isNumber
      ? numberValidity(element.value, this.numberConstraints)
      : undefined;
    const flags = {
      badInput: native.badInput || number?.flags.badInput,
      customError: native.customError || number?.flags.customError,
      patternMismatch: native.patternMismatch,
      rangeOverflow: native.rangeOverflow || number?.flags.rangeOverflow,
      rangeUnderflow: native.rangeUnderflow || number?.flags.rangeUnderflow,
      stepMismatch: native.stepMismatch || number?.flags.stepMismatch,
      tooLong: native.tooLong,
      tooShort: native.tooShort,
      typeMismatch: native.typeMismatch,
      valueMissing: native.valueMissing,
    };
    if (Object.values(flags).some((value) => value === true)) {
      return {
        flags,
        message: number?.message ?? element.validationMessage,
        element,
      };
    }
    return { flags: {} };
  }

  private formSignature(): string {
    const element = this.inputEl;
    const validity = this.validity();
    const activeFlags = Object.entries(validity.flags)
      .filter(([, value]) => value === true)
      .map(([flag]) => flag)
      .toSorted()
      .join(",");
    return `${element?.value ?? ""}\u0001${this.form.isRequired ? 1 : 0}\u0001${
      this.form.isInvalid ? 1 : 0
    }\u0001${activeFlags}\u0001${validity.message ?? ""}`;
  }

  private readonly handleMaskInput = (event: Event): void => {
    const element = event.target;
    const mask = this.inputMaskConfig;
    if (!isHTMLInputElement(element) || mask === undefined) {
      return;
    }

    const caret = element.selectionStart ?? element.value.length;
    const rawBeforeCaret = mask.rawFromMasked(element.value.slice(0, caret));
    const next = maskitoTransform(element.value, mask.options);
    if (element.value !== next) {
      element.value = next;
    }
    if (
      mask.caretForRaw !== undefined &&
      this.supportsSelection &&
      element.ownerDocument.activeElement === element
    ) {
      const position = mask.caretForRaw(next, rawBeforeCaret.length);
      element.setSelectionRange(position, position);
    }
    if (this.isNumber) {
      this.currentValue = next;
    }
    const unmasked = mask.rawFromMasked(next);
    this.rawValue = unmasked;
    this.emitValue(next, unmasked);
    this.form.sync();
  };

  private emitValue(value: string, unmaskedValue: string): void {
    this.valueChange.emit({ value, unmaskedValue });
  }

  /** Whether the value can still move one `step` in the given direction. */
  private get numberConstraints(): { min?: number; max?: number; step?: number } {
    return { min: this.min, max: this.max, step: this.numericStep };
  }

  private canStep(direction: 1 | -1): boolean {
    return canStepNumber(this.inputEl?.value ?? "", direction, this.numberConstraints);
  }

  /** Snaps one step in the given direction, respecting `min`/`max`. */
  private nudge(direction: 1 | -1): void {
    const el = this.inputEl;
    if (el === undefined) {
      return;
    }
    const parsed = parseNumber(el.value);
    const next = stepNumber(Number.isNaN(parsed) ? 0 : parsed, direction, this.numberConstraints);
    const value = formatNumber(next);
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

  /** Slot contents are invisible to `:empty`, so track them for affix padding. */
  private readonly handleSlotChange = (event: Event): void => {
    const slot = event.target;
    if (!isHTMLSlotElement(slot)) {
      return;
    }
    const filled = slot
      .assignedNodes()
      .some((node) => node.nodeType === 1 || (node.textContent ?? "").trim() !== "");
    if (slot.name === "prefix") {
      this.hasPrefix = filled;
    } else if (slot.name === "suffix") {
      this.hasSuffix = filled;
    }
  };

  render(): VNode {
    return (
      <Host class={styles.host}>
        <div data-scope="input" data-part="root" part="root" class={styles.root}>
          <div
            data-scope="input"
            data-part="control"
            data-invalid={dataAttr(this.form.isInvalid)}
            data-disabled={dataAttr(this.form.isDisabled)}
            data-readonly={dataAttr(this.form.isReadOnly)}
            data-number={dataAttr(this.isNumber)}
            class={styles.control}
            part="control"
          >
            <span data-part="prefix" class={cx(styles.affix, this.hasPrefix && styles.affixStart)}>
              <slot name="prefix" onSlotchange={this.handleSlotChange} />
            </span>

            <input
              {...this.inputProps}
              ref={(el) => {
                if (this.inputEl === el) {
                  return;
                }
                this.inputEl?.removeEventListener("input", this.handleMaskInput);
                this.inputEl = el;
                this.syncMaskito();
              }}
              type={this.resolvedType}
              placeholder={this.placeholder}
              autocomplete={this.autocomplete}
              enterKeyHint={this.keyboardHint === "" ? undefined : this.keyboardHint}
              spellcheck={this.supportsSpellcheck ? this.spellcheckHint : undefined}
              autocapitalize={this.resolvedAutocapitalize}
              inputMode={this.effectiveInputMode}
              maxLength={this.maxLength}
              minLength={this.minLength}
              pattern={this.inputPattern}
              class={styles.input}
              part="input"
            />

            <span data-part="suffix" class={cx(styles.affix, this.hasSuffix && styles.affixEnd)}>
              <slot name="suffix" onSlotchange={this.handleSlotChange} />
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
                  <AddIcon class={styles.stepperIcon} />
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
                  <RemoveIcon class={styles.stepperIcon} />
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
                {this.passwordVisible ? (
                  <VisibilityIcon class={styles.triggerIcon} />
                ) : (
                  <VisibilityOffIcon class={styles.triggerIcon} />
                )}
              </button>
            ) : undefined}
          </div>
        </div>
      </Host>
    );
  }
}
