import { Maskito, maskitoTransform, type MaskitoOptions } from "@maskito/core";
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
import { FormController, type FormValidity } from "../shared/controllers";
import { ariaAttr, dataAttr } from "../shared/helpers/aria/attr";
import { isHTMLInputElement, isHTMLSlotElement } from "../shared/helpers/dom/dom";
import { focusElement } from "../shared/helpers/dom/focus";
import { nextId } from "../shared/helpers/dom/id";
import { applyFieldAria, createFieldControl } from "../shared/helpers/field";
import { ControllerHostMixin, FormControlMixin } from "../shared/mixins";
import { type TextCase } from "./case";
import { renderNumberStepper, renderPasswordToggle } from "./input-controls";
import { filterNumericOrDecimalInput } from "./input-filter";
import { resolveInputFormSignature, resolveInputValidity } from "./input-validity";
import { resolveInputMaskConfig, type InputMaskConfig } from "./mask-config";
import { NumberStepper, type NumberConstraints } from "./number-stepper";
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

/** The values handed to `valuechange` after every edit. */
export interface InputValueDetails {
  /** The value shown in the input, including mask literals. */
  value: string;
  /** The value with every mask literal removed. */
  unmaskedValue: string;
}

const SELECTABLE_INPUT_TYPES = new Set<InputType>([
  "text",
  "search",
  "tel",
  "password",
  "url",
  "number",
]);

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
   * A compact mask for text-like inputs. Tokens: `#` digit, `A` letter, `W`
   * word character, and `?` any character. `[a-z]` defines a character class,
   * `{n}` repeats the previous token, and `\` displays the next character
   * literally. Variable-width repeats (`*`, `+`, `{n,}`, and `{n,m}`) are not
   * supported yet.
   */
  @Prop() mask?: string;
  /**
   * A native Maskito mask for advanced JavaScript usage. Takes precedence over
   * `mask`. This is property-only and is not exposed as an HTML attribute.
   */
  @Prop({ attribute: null }) maskExpression?: MaskitoOptions["mask"];
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
  @State() private canIncrement = true;
  @State() private canDecrement = true;
  @State() private hasPrefix = false;
  @State() private hasSuffix = false;

  private inputEl?: HTMLInputElement;
  private maskito?: Maskito;
  private maskitoElement?: HTMLInputElement;
  private maskitoOptions?: MaskitoOptions;
  private maskConfig?: InputMaskConfig;
  private validityKey = "";
  private validityResult?: FormValidity;
  private initialValue = "";
  private canonicalValue = "";
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
    getValidity: (): FormValidity => this.inputValidity,
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
  private readonly numberStepper = new NumberStepper({
    getInput: () => this.inputEl,
    getConstraints: () => this.numberConstraints,
    getDisabled: () => this.form.isDisabled,
    getReadOnly: () => this.form.isReadOnly,
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
    this.applyInitialValue();
  }

  componentDidLoad(): void {
    super.componentDidLoad();
    // Apply the initial value to the native input; state is already seeded.
    this.applyInitialValue();
    this.form.sync();
  }

  componentDidRender(): void {
    super.componentDidRender();
    applyFieldAria(this.inputEl, this.form.fieldApi);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.destroyMaskito();
    this.numberStepper.stop();
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
  @Watch("maskExpression")
  @Watch("textCase")
  @Watch("inputModeHint")
  @Watch("inputType")
  @Watch("min")
  private reformatValue(): void {
    const el = this.inputEl;
    if (el === undefined) {
      return;
    }
    const caret = el.selectionStart ?? el.value.length;
    this.syncMaskito();
    this.applyValue(this.canonicalValue);
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
  @Watch("inputPattern")
  @Watch("minLength")
  @Watch("maxLength")
  private syncFormValidity(): void {
    this.form.sync();
    this.syncStepperAvailability();
  }

  private get inputMaskConfig(): InputMaskConfig {
    const mode = this.effectiveInputMode;
    const filterMode = mode === "numeric" || mode === "decimal" ? mode : undefined;
    this.maskConfig = resolveInputMaskConfig(this.maskConfig, {
      isNumber: this.isNumber,
      mask: this.mask,
      maskExpression: this.maskExpression,
      textCase: this.textCase,
      filterMode,
      allowNegative: this.allowNegative,
      numberDecimal: this.numberFilterMode === "decimal",
    });
    return this.maskConfig;
  }

  private syncMaskito(): void {
    const el = this.inputEl;
    if (!Build.isBrowser || el === undefined) {
      this.destroyMaskito();
      return;
    }

    const { options } = this.inputMaskConfig;
    if (
      this.maskito !== undefined &&
      this.maskitoElement === el &&
      this.maskitoOptions === options
    ) {
      return;
    }

    this.destroyMaskito();
    this.maskito = new Maskito(el, options);
    this.maskitoElement = el;
    this.maskitoOptions = options;
    // This runs after Maskito's listener so the caret reflects the pre-mask selection.
    el.addEventListener("input", this.handleInput);
  }

  private destroyMaskito(): void {
    this.maskito?.destroy();
    this.maskito = undefined;
    this.maskitoElement?.removeEventListener("input", this.handleInput);
    this.maskitoElement = undefined;
    this.maskitoOptions = undefined;
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

  private applyInitialValue(): void {
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

  private sanitizeValue(raw: string): string {
    if (this.isNumber) {
      return raw;
    }
    const mode = this.effectiveInputMode;
    if (mode !== "numeric" && mode !== "decimal") {
      return raw;
    }
    return filterNumericOrDecimalInput(raw, { allowNegative: this.allowNegative, mode });
  }

  private applyValue(value: string): void {
    const sanitized = this.sanitizeValue(value);
    const mask = this.maskConfig ?? this.inputMaskConfig;
    const masked = maskitoTransform(sanitized, mask.options);
    const canonical = this.isNumber ? masked : sanitized;
    const changed = this.value !== undefined && String(this.value) !== canonical;

    if (changed) {
      this.value = canonical;
    }
    this.canonicalValue = canonical;

    if (this.inputEl !== undefined && this.inputEl.value !== masked) {
      this.inputEl.value = masked;
    }
    this.syncStepperAvailability();
    if (changed) {
      this.emitValue(masked, this.isNumber ? masked : sanitized);
    }
    this.form.sync();
  }

  private get inputValidity(): FormValidity {
    const element = this.inputEl;
    const native = element?.validity;
    const nativeFlags =
      native === undefined
        ? ""
        : [
            native.badInput,
            native.customError,
            native.patternMismatch,
            native.rangeOverflow,
            native.rangeUnderflow,
            native.stepMismatch,
            native.tooLong,
            native.tooShort,
            native.typeMismatch,
            native.valid,
            native.valueMissing,
          ]
            .map((value) => (value ? "1" : "0"))
            .join("");
    const nativeKey = `${nativeFlags}\u0000${element?.validationMessage ?? ""}`;
    const key = [
      element?.value ?? "",
      nativeKey,
      this.inputType,
      this.inputPattern ?? "",
      String(this.minLength ?? ""),
      String(this.maxLength ?? ""),
      this.form.isInvalid ? "1" : "0",
      this.form.isRequired ? "1" : "0",
      this.isNumber ? String(this.min ?? "") : "",
      this.isNumber ? String(this.max ?? "") : "",
      this.isNumber ? String(this.numericStep ?? "") : "",
    ].join("\u0000");

    if (this.validityResult !== undefined && this.validityKey === key) {
      return this.validityResult;
    }

    const validity = resolveInputValidity({
      element,
      invalid: this.form.isInvalid,
      required: this.form.isRequired,
      numberConstraints: this.isNumber ? this.numberConstraints : undefined,
    });
    this.validityKey = key;
    this.validityResult = validity;
    return validity;
  }

  private formSignature(): string {
    return resolveInputFormSignature({
      element: this.inputEl,
      required: this.form.isRequired,
      invalid: this.form.isInvalid,
      validity: this.inputValidity,
    });
  }

  private readonly handleInput = (event: Event): void => {
    const element = event.target;
    if (!isHTMLInputElement(element)) {
      return;
    }

    const mask = this.maskConfig ?? this.inputMaskConfig;
    const masked = element.value;
    this.syncStepperAvailability();

    const unmasked = mask.rawFromMasked(masked);
    this.canonicalValue = unmasked;
    this.emitValue(masked, unmasked);
    this.form.sync();
  };

  private emitValue(value: string, unmaskedValue: string): void {
    this.valueChange.emit({ value, unmaskedValue });
  }

  private syncStepperAvailability(): void {
    if (!this.isNumber) {
      return;
    }

    const { canIncrement, canDecrement } = this.numberStepper.getAvailability();
    if (this.canIncrement !== canIncrement) {
      this.canIncrement = canIncrement;
    }
    if (this.canDecrement !== canDecrement) {
      this.canDecrement = canDecrement;
    }
  }

  private get numberConstraints(): NumberConstraints {
    return { min: this.min, max: this.max, step: this.numericStep };
  }

  private readonly handleTogglePassword = (): void => {
    this.passwordVisible = !this.passwordVisible;
  };

  private readonly handleStartHold = (direction: 1 | -1): void => {
    this.numberStepper.startHold(direction);
  };

  private readonly handleStopHold = (): void => {
    this.numberStepper.stop();
  };

  private readonly handleStep = (direction: 1 | -1): void => {
    this.numberStepper.stepOnce(direction);
  };

  private readonly setInputElement = (element?: HTMLInputElement): void => {
    if (this.inputEl === element) {
      return;
    }
    this.inputEl = element;
    this.syncMaskito();
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
              ref={this.setInputElement}
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

            {this.isNumber
              ? renderNumberStepper({
                  canIncrement: !this.form.isDisabled && !this.form.isReadOnly && this.canIncrement,
                  canDecrement: !this.form.isDisabled && !this.form.isReadOnly && this.canDecrement,
                  onStartHold: this.handleStartHold,
                  onStopHold: this.handleStopHold,
                  onStep: this.handleStep,
                })
              : undefined}

            {this.inputType === "password"
              ? renderPasswordToggle({
                  visible: this.passwordVisible,
                  disabled: this.form.isDisabled || this.form.isReadOnly,
                  onToggle: this.handleTogglePassword,
                })
              : undefined}
          </div>
        </div>
      </Host>
    );
  }
}
