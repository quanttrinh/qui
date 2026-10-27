import {
  resolveVar,
  AttachInternals,
  Build,
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

import { ariaAttr, dataAttr } from "../../helpers/attr";
import { isHTMLTextAreaElement } from "../../helpers/dom";
import { nextId } from "../../helpers/id";
import { ensureShadowStylesheet } from "../../utilities/styles";
import { applyFieldAria } from "../shared/field/aria";
import { createFieldControl, focusElement } from "../shared/field/control";
import { FormControlBase } from "../shared/form-control/component-base";
import { FormController, type FormValidity } from "../shared/form-control/controller";
import { styles } from "./styles";

function pixels(value: string): number {
  // oxlint-disable-next-line unicorn/prefer-number-coercion
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** How the native textarea can be resized. */
export type TextareaResize = "none" | "vertical" | "auto";

/** The value handed to `valuechange` after every edit. */
export interface TextareaValueDetails {
  /** The current textarea value. */
  value: string;
}

/**
 * A multi-line text input with optional auto-growth and a character counter.
 * When nested in `qui-field`, it inherits the field ids and state.
 */
@Component({
  tag: "qui-textarea",
  styleUrl: resolveVar(styleUrls.quiTextarea),
  shadow: true,
  formAssociated: true,
})
export class QuiTextarea extends FormControlBase {
  @Element() host!: HTMLQuiTextareaElement;
  @AttachInternals() internals!: ElementInternals;

  /** The controlled value. */
  @Prop({ mutable: true }) value?: string;
  /** The initial value for an uncontrolled textarea. */
  @Prop() defaultValue?: string;
  /** The form field name. */
  @Prop({ reflect: true }) name?: string;
  /** Overrides the generated textarea id. */
  @Prop() inputId?: string;
  /** Placeholder text. */
  @Prop() placeholder?: string;
  /** Initial number of visible rows; the minimum when `resize` is `"auto"`. */
  @Prop() rows = 4;
  /** How the textarea can be resized. */
  @Prop() resize: TextareaResize = "vertical";
  /** Maximum number of rows when `resize` is `"auto"`. */
  @Prop() maxRows?: number;
  /** Shows a character counter. */
  @Prop() showCount = false;
  /** Maximum number of characters. */
  @Prop() maxLength?: number;
  /** Minimum number of characters. */
  @Prop() minLength?: number;
  /** Autocomplete hint. */
  @Prop() autocomplete?: string;
  /** Whether the browser can spellcheck the value. */
  @Prop() spellcheckHint?: boolean;
  /** Marks the textarea invalid. Ignored while nested in a `qui-field`. */
  @Prop() invalid = false;
  /** Disables the textarea. Ignored while nested in a `qui-field`. */
  @Prop() disabled = false;
  /** Makes the textarea read-only. Ignored while nested in a `qui-field`. */
  @Prop() readOnly = false;
  /** Marks the textarea required. Ignored while nested in a `qui-field`. */
  @Prop() required = false;

  /** Emitted after every edit. */
  @StencilEvent({ eventName: "valuechange", bubbles: true, composed: true })
  private readonly valueChange!: EventEmitter<TextareaValueDetails>;

  @State() private currentValue = "";

  private textareaEl?: HTMLTextAreaElement;
  private counterEl?: HTMLElement;
  private initialValue = "";
  private autoResizeFrame?: number;
  private resizeObserver?: ResizeObserver;
  private lastWidth = 0;
  private wasAutoResize = false;
  private readonly generatedId = nextId("qui-textarea");
  private readonly counterId = nextId("qui-textarea-counter");
  private readonly fieldControl = createFieldControl(() => this.textareaEl);
  private readonly form = new FormController({
    getHost: (): HTMLElement => this.host,
    getInternals: (): ElementInternals => this.internals,
    getName: (): string | undefined => this.name,
    getMultiple: (): boolean => false,
    getValue: (): readonly string[] => {
      const value = this.textareaEl?.value;
      return value === undefined ? [] : [value];
    },
    getDisabled: (): boolean => this.disabled,
    getReadOnly: (): boolean => this.readOnly,
    getRequired: (): boolean => this.required,
    getInvalid: (): boolean => this.invalid,
    getValidationElement: (): HTMLElement | undefined => this.textareaEl,
    getFormValue: (): string => this.textareaEl?.value ?? "",
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

  public componentWillLoad(): void {
    super.componentWillLoad();
    this.initialValue = this.defaultValue ?? this.value ?? "";
    this.currentValue = this.initialValue;
    this.syncInitialValue();
  }

  public componentDidLoad(): void {
    super.componentDidLoad();
    this.syncInitialValue();
    this.syncAutoResize();
    this.form.sync();
  }

  public connectedCallback(): void {
    super.connectedCallback();
    this.syncAutoResize();
    ensureShadowStylesheet(this.host);
  }

  public componentDidRender(): void {
    super.componentDidRender();
    applyFieldAria(this.textareaEl, this.form.fieldApi, {
      describedBy: this.counterEl === undefined ? [] : [this.counterEl],
    });
    this.scheduleAutoResize();
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback();
    this.stopAutoResize();
  }

  /** Moves focus to the internal native textarea. */
  @Method()
  public async focusControl(options?: FocusOptions): Promise<void> {
    await focusElement(this.textareaEl, options);
  }

  @Watch("value")
  private syncControlledValue(): void {
    if (this.value === undefined) {
      return;
    }
    this.applyValue(this.value);
  }

  @Watch("rows")
  @Watch("resize")
  @Watch("maxRows")
  private syncResizeMode(): void {
    this.syncAutoResize();
  }

  @Watch("required")
  @Watch("invalid")
  @Watch("maxLength")
  private syncFormValidity(): void {
    this.form.sync();
  }

  @Watch("showCount")
  private syncCounterValue(): void {
    if (this.showCount && this.textareaEl !== undefined) {
      this.currentValue = this.textareaEl.value;
    }
  }

  private get controlProps(): Record<string, string | number | boolean | undefined> {
    const props: Record<string, unknown> =
      this.form.fieldApi === undefined
        ? {
            id: this.inputId ?? (this.host.id || this.generatedId),
            disabled: this.form.isDisabled,
            readOnly: this.form.isReadOnly || undefined,
            "aria-invalid": ariaAttr(this.form.isInvalid),
            "data-scope": "textarea",
            "data-part": "input",
            "data-invalid": dataAttr(this.form.isInvalid),
            "data-required": dataAttr(this.form.isRequired),
            "data-readonly": dataAttr(this.form.isReadOnly),
          }
        : { ...this.form.fieldApi.getInputProps() };
    delete props.required;
    if (this.form.isRequired) {
      props["aria-required"] = "true";
    }
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    return props as Record<string, string | number | boolean | undefined>;
  }

  private get counterText(): string {
    const { length } = this.currentValue;
    return this.maxLength === undefined ? String(length) : `${length}/${this.maxLength}`;
  }

  private syncInitialValue(): void {
    if (this.value !== undefined) {
      this.applyValue(this.value);
      return;
    }
    if (this.defaultValue !== undefined) {
      this.applyValue(this.defaultValue);
    }
  }

  private applyValue(value: string): void {
    if (this.textareaEl !== undefined && this.textareaEl.value !== value) {
      this.textareaEl.value = value;
    }
    this.currentValue = value;
    this.form.sync();
    this.scheduleAutoResize();
  }

  private validity(): FormValidity {
    const element = this.textareaEl;
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
    const element = this.textareaEl;
    return `${element?.value ?? ""}\u0001${this.form.isRequired ? 1 : 0}\u0001${
      this.form.isInvalid ? 1 : 0
    }\u0001${element?.validity.valid === true ? 1 : 0}\u0001${element?.validationMessage ?? ""}`;
  }

  private readonly handleInput = (event: Event): void => {
    const el = event.target;
    if (!isHTMLTextAreaElement(el)) {
      return;
    }
    if (this.showCount) {
      this.currentValue = el.value;
    }
    this.valueChange.emit({ value: el.value });
    this.form.sync();
    this.scheduleAutoResize();
  };

  private get autoResize(): boolean {
    return this.resize === "auto";
  }

  private syncAutoResize(): void {
    if (!Build.isBrowser) {
      return;
    }
    if (!this.autoResize) {
      this.stopAutoResize();
      if (this.wasAutoResize) {
        this.clearAutoHeight();
        this.wasAutoResize = false;
      }
      return;
    }
    this.wasAutoResize = true;
    this.observeWidth();
    this.scheduleAutoResize();
  }

  private observeWidth(): void {
    if (this.resizeObserver !== undefined || typeof ResizeObserver === "undefined") {
      return;
    }
    this.resizeObserver = new ResizeObserver((entries) => {
      const [entry] = entries;
      const { width } = entry.contentRect;
      if (width === this.lastWidth) {
        return;
      }
      this.lastWidth = width;
      this.scheduleAutoResize();
    });
    this.resizeObserver.observe(this.host);
  }

  private stopAutoResize(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    this.lastWidth = 0;
    if (this.autoResizeFrame !== undefined) {
      cancelAnimationFrame(this.autoResizeFrame);
      this.autoResizeFrame = undefined;
    }
  }

  private clearAutoHeight(): void {
    if (this.textareaEl === undefined) {
      return;
    }
    this.textareaEl.style.height = "";
    this.textareaEl.style.overflowY = "";
  }

  private scheduleAutoResize(): void {
    if (!Build.isBrowser || !this.autoResize || this.autoResizeFrame !== undefined) {
      return;
    }
    this.autoResizeFrame = requestAnimationFrame(() => {
      this.autoResizeFrame = undefined;
      this.autoResizeNow();
    });
  }

  private autoResizeNow(): void {
    const el = this.textareaEl;
    if (el === undefined || !this.autoResize) {
      return;
    }
    el.style.height = "auto";
    const computed = getComputedStyle(el);
    const lineHeight = pixels(computed.lineHeight) || 20;
    const padding = pixels(computed.paddingTop) + pixels(computed.paddingBottom);
    const border = pixels(computed.borderTopWidth) + pixels(computed.borderBottomWidth);
    const minHeight = this.rows * lineHeight + padding + border;
    const maxRows = this.maxRows === undefined ? undefined : Math.max(this.rows, this.maxRows);
    const maxHeight = maxRows === undefined ? Infinity : maxRows * lineHeight + padding + border;
    const contentHeight = el.scrollHeight;
    const requiredHeight = contentHeight + border;
    const nextHeight = Math.min(Math.max(requiredHeight, minHeight), maxHeight);

    el.style.height = `${nextHeight}px`;
    el.style.overflowY = requiredHeight > maxHeight ? "auto" : "hidden";
  }

  public render(): VNode {
    return (
      <Host class={styles.host}>
        <div data-scope="textarea" data-part="root" part="root" class={styles.root}>
          <div
            data-scope="textarea"
            data-part="control"
            data-invalid={dataAttr(this.form.isInvalid)}
            data-disabled={dataAttr(this.form.isDisabled)}
            data-readonly={dataAttr(this.form.isReadOnly)}
            class={styles.control}
            part="control"
          >
            <textarea
              {...this.controlProps}
              ref={(el) => {
                this.textareaEl = el;
              }}
              rows={this.rows}
              placeholder={this.placeholder}
              autocomplete={this.autocomplete}
              spellcheck={this.spellcheckHint}
              maxLength={this.maxLength}
              minLength={this.minLength}
              data-resize={this.resize}
              class={styles.textarea}
              part="textarea"
              onInput={this.handleInput}
            />
            {this.showCount ? (
              <span
                ref={(el) => {
                  this.counterEl = el ?? undefined;
                }}
                id={this.counterId}
                data-part="counter"
                part="counter"
                class={styles.counter}
              >
                {this.counterText}
              </span>
            ) : undefined}
          </div>
        </div>
      </Host>
    );
  }
}
