import {
  Mixin,
  resolveVar,
  AttachInternals,
  Component,
  Element,
  Event,
  h,
  Host,
  Method,
  Prop,
  Watch,
  type EventEmitter,
  type VNode,
} from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css, cx } from "#styled-system/css";

import { createListenerStore, FormController, type FormValidity } from "../shared/controllers";
import { dataAttr } from "../shared/helpers/aria/attr";
import { nextId } from "../shared/helpers/dom/id";
import { applyFieldAria, type FieldControlHandle } from "../shared/helpers/field";
import { ControllerHostMixin, FormControlMixin, ShadowStylesMixin } from "../shared/mixins";
import {
  clearRadioGroup,
  provideRadioGroup,
  type RadioGroupContext,
  type RadioItem,
  type RadioItemState,
} from "./context";
import { RadioGroupController } from "./controller";

/** Props that only feed the child context, so the root template ignores them. */
const CONTEXT_ONLY_PROPS = new Set(["value", "name"]);

const styles = {
  host: css({ display: "block" }),
  root: css({
    pos: "relative",
    display: "flex",
    flexDir: "column",
    gap: "2",
  }),
  horizontal: css({ flexDir: "row" }),
};

/**
 * MD3 radio group. Compose with `qui-radio` children.
 *
 * @slot - `qui-radio` items.
 */
@Component({
  tag: "qui-radio-group",
  styleUrl: resolveVar(styleUrls.quiRadioGroup),
  shadow: true,
  formAssociated: true,
})
export class QuiRadioGroup extends Mixin(ControllerHostMixin, FormControlMixin, ShadowStylesMixin) {
  @Element() host!: HTMLQuiRadioGroupElement;
  @AttachInternals() internals!: ElementInternals;

  /** The controlled selected value. */
  @Prop({ mutable: true }) value?: string;
  /** The initial selected value for an uncontrolled group. */
  @Prop() defaultValue?: string;
  /** The form field name shared by the radio inputs. */
  @Prop() name?: string;
  /** Disables the whole group. */
  @Prop() disabled = false;
  /** Marks the whole group invalid. */
  @Prop() invalid = false;
  /** Marks the whole group required. */
  @Prop() required = false;
  /** Makes the whole group read-only. */
  @Prop() readOnly = false;
  /** Layout orientation. */
  @Prop() orientation: "horizontal" | "vertical" = "vertical";
  /** Text direction. */
  @Prop() textDirection?: "ltr" | "rtl";

  /** Emitted whenever the selected value changes. */
  @Event({ eventName: "valuechange", bubbles: true, composed: true })
  valueChange!: EventEmitter<{ value: string | undefined }>;

  private rootEl?: HTMLDivElement;
  private idBase = "";
  private readonly listeners = createListenerStore();
  private readonly generatedId = nextId("qui-radio-group");
  private readonly fieldControl: FieldControlHandle = {
    focus: (options): void => {
      this.controller.focusInput(options);
    },
  };
  private readonly controller = new RadioGroupController(this, {
    getValue: (): string | undefined => this.value,
    getDefaultValue: (): string | undefined => this.defaultValue,
    isDisabled: (): boolean => this.form.isDisabled,
    isReadOnly: (): boolean => this.form.isReadOnly,
    onChange: (value: string | undefined): void => {
      this.valueChange.emit({ value });
      this.form.sync();
    },
  });
  protected readonly form = new FormController(this, {
    getInternals: (): ElementInternals => this.internals,
    getName: (): string | undefined => this.name,
    getMultiple: (): boolean => false,
    getValue: (): readonly string[] => {
      const { value } = this.controller;
      if (value) {
        return [value];
      }
      return [];
    },
    getDisabled: (): boolean => this.disabled,
    getReadOnly: (): boolean => this.readOnly,
    getRequired: (): boolean => this.required,
    getInvalid: (): boolean => this.invalid,
    getValidationElement: (): HTMLElement | undefined => this.rootEl,
    getFormValue: (): string | null => {
      const { value } = this.controller;
      if (value) {
        return value;
      }
      return null;
    },
    getValidity: (): FormValidity => this.validity(),
    getSignature: (): string => this.signature(),
    onReset: (): void => {
      this.value = this.controller.initialValue;
      this.controller.reset();
    },
    onRestore: (values: string[]): void => {
      const restored = values.at(0);
      const value = restored === "" ? undefined : restored;
      this.value = value;
      this.controller.restore(value);
    },
    onChange: (): void => {
      this.listeners.notify();
    },
  });
  private readonly context: RadioGroupContext = {
    value: (): string | undefined => this.controller.value,
    isDisabled: (): boolean => this.form.isDisabled,
    isReadOnly: (): boolean => this.form.isReadOnly,
    isInvalid: (): boolean => this.form.isInvalid,
    isRequired: (): boolean => this.form.isRequired,
    orientation: (): "horizontal" | "vertical" => this.orientation,
    textDirection: (): "ltr" | "rtl" | undefined => this.textDirection,
    itemState: (item: RadioItem): RadioItemState => this.itemState(item),
    select: (value: string): void => {
      this.controller.select(value);
    },
    focus: (value: string, focusVisible: boolean): void => {
      this.controller.focus(value, focusVisible);
    },
    blur: (): void => {
      this.controller.blur();
    },
    registerInput: (value: string, input: HTMLInputElement): (() => void) =>
      this.controller.registerInput(value, input),
    rootId: (): string => this.rootId,
    itemId: (value: string): string => this.itemId(value),
    inputId: (value: string): string => this.inputId(value),
    controlId: (value: string): string => this.controlId(value),
    labelId: (value: string): string => this.labelIdFor(value),
    subscribe: this.listeners.subscribe,
  };

  constructor() {
    super();
    this.form.setControl(this.fieldControl);
  }

  protected onRequestUpdate(keys?: Iterable<string>): void {
    this.listeners.notify(keys);
  }

  connectedCallback(): void {
    super.connectedCallback();
    if (this.idBase === "") {
      this.idBase = this.host.id || this.generatedId;
    }
    provideRadioGroup(this.host, this.context);
  }

  componentWillLoad(): void {
    super.componentWillLoad();
    this.idBase = this.host.id || this.generatedId;
    provideRadioGroup(this.host, this.context);
  }

  componentDidRender(): void {
    super.componentDidRender();
    applyFieldAria(this.rootEl, this.form.fieldApi);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    clearRadioGroup(this.host);
    this.listeners.clear();
  }

  /** Focuses the selected radio, or the first enabled radio as a fallback. */
  @Method()
  async focusControl(options?: FocusOptions): Promise<void> {
    await Promise.resolve();
    this.controller.focusInput(options);
  }

  /** Returns the current selected value, including uncontrolled changes. */
  @Method()
  // oxlint-disable-next-line eslint/require-await, typescript/require-await -- Stencil @Method requires async, but the value is available synchronously.
  async getValue(): Promise<string | undefined> {
    return this.controller.value;
  }

  @Watch("value")
  @Watch("name")
  @Watch("disabled")
  @Watch("invalid")
  @Watch("required")
  @Watch("readOnly")
  @Watch("orientation")
  @Watch("textDirection")
  private syncGroup(): void {
    this.form.sync();
    this.listeners.notify();
  }

  componentShouldUpdate(_newValue: unknown, _oldValue: unknown, propName: string): boolean {
    return !CONTEXT_ONLY_PROPS.has(propName);
  }

  private get rootId(): string {
    return `radio-group:${this.idBase || this.generatedId}`;
  }

  private itemId(value: string): string {
    return `${this.rootId}:radio:${value}`;
  }

  private inputId(value: string): string {
    return `${this.rootId}:radio:input:${value}`;
  }

  private controlId(value: string): string {
    return `${this.rootId}:radio:control:${value}`;
  }

  private labelIdFor(value: string): string {
    return `${this.rootId}:radio:label:${value}`;
  }

  private itemState(item: RadioItem): RadioItemState {
    const checked = this.controller.value === item.value;
    return {
      checked,
      disabled: (item.disabled ?? false) || this.form.isDisabled,
      invalid: (item.invalid ?? false) || this.form.isInvalid,
      focused: this.controller.focusedValue === item.value,
      focusVisible: this.controller.focusVisibleValue === item.value,
    };
  }

  private validity(): FormValidity {
    if (this.form.isRequired && this.controller.value === undefined) {
      return {
        flags: { valueMissing: true },
        message: "Please select an option.",
        element: this.rootEl,
      };
    }
    if (this.form.isInvalid) {
      return {
        flags: { customError: true },
        message: "Invalid value",
        element: this.rootEl,
      };
    }
    return { flags: {} };
  }

  private signature(): string {
    return `${this.name ?? ""}\u0001${this.controller.value ?? ""}\u0001${
      this.form.isRequired ? 1 : 0
    }\u0001${this.form.isInvalid ? 1 : 0}\u0001${this.form.isDisabled ? 1 : 0}`;
  }

  render(): VNode {
    return (
      <Host class={styles.host}>
        <div
          ref={(el) => {
            this.rootEl = el;
          }}
          id={this.rootId}
          role="radiogroup"
          aria-required={this.form.isRequired ? "true" : undefined}
          aria-disabled={this.form.isDisabled ? "true" : undefined}
          aria-readonly={this.form.isReadOnly ? "true" : undefined}
          aria-orientation={this.orientation}
          data-scope="radio-group"
          data-part="root"
          data-orientation={this.orientation}
          data-disabled={dataAttr(this.form.isDisabled)}
          data-invalid={dataAttr(this.form.isInvalid)}
          data-required={dataAttr(this.form.isRequired)}
          dir={this.textDirection}
          class={cx(styles.root, this.orientation === "horizontal" ? styles.horizontal : "")}
          part="root"
        >
          <slot />
        </div>
      </Host>
    );
  }
}
