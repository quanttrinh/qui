import {
  resolveVar,
  AttachInternals,
  Component,
  Element,
  Event,
  forceUpdate,
  h,
  Host,
  Prop,
  Watch,
  type EventEmitter,
  type VNode,
} from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css, cx } from "#styled-system/css";

import { dataAttr } from "../../helpers/attr";
import { isHTMLDivElement } from "../../helpers/dom";
import { nextId } from "../../helpers/id";
import { FormControlBase } from "../shared/form-control/component-base";
import { FormController, type FormValidity } from "../shared/form-control/controller";
import {
  clearRadioGroup,
  provideRadioGroup,
  type RadioGroupContext,
  type RadioItem,
  type RadioItemState,
} from "./context";
import { RadioGroupController } from "./controller";

const styles = {
  host: css({ display: "block" }),
  root: css({
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: "2",
  }),
  horizontal: css({ flexDirection: "row" }),
};

/**
 * MD3 radio group. Compose with `qui-radio` children.
 *
 * @slot - `qui-radio` items.
 */
@Component({
  tag: "qui-radio-group",
  styleUrl: resolveVar(styleUrls.quiRadioGroup),
  scoped: true,
  formAssociated: true,
})
export class QuiRadioGroup extends FormControlBase {
  @Element() host!: HTMLQuiRadioGroupElement;
  @AttachInternals() internals!: ElementInternals;

  /** The controlled selected value. */
  @Prop() value?: string;
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
  /** Additional class applied to the root element. */
  @Prop() innerClass?: string;

  /** Emitted whenever the selected value changes. */
  @Event({ eventName: "valuechange", bubbles: true, composed: true })
  valueChange!: EventEmitter<{ value: string | undefined }>;

  private rootEl?: HTMLDivElement;
  private idBase = "";
  private readonly listeners = new Set<() => void>();
  private readonly generatedId = nextId("qui-radio-group");
  private readonly controller = new RadioGroupController({
    getValue: (): string | undefined => this.value,
    getDefaultValue: (): string | undefined => this.defaultValue,
    isDisabled: (): boolean => this.form.isDisabled,
    isReadOnly: (): boolean => this.form.isReadOnly,
    onChange: (value: string | undefined): void => {
      this.valueChange.emit({ value });
      this.form.sync();
    },
    requestUpdate: (): void => {
      forceUpdate(this.host);
      this.notifyListeners();
    },
  });
  private readonly form = new FormController({
    getHost: (): HTMLElement => this.host,
    getInternals: (): ElementInternals => this.internals,
    getName: (): string | undefined => this.name,
    getMultiple: (): boolean => false,
    getValue: (): readonly string[] => {
      const { value } = this.controller;
      return value === undefined || value === "" ? [] : [value];
    },
    getDisabled: (): boolean => this.disabled,
    getReadOnly: (): boolean => this.readOnly,
    getRequired: (): boolean => this.required,
    getInvalid: (): boolean => this.invalid,
    getValidationElement: (): HTMLElement | undefined => this.rootEl,
    getFormValue: (): string | null => {
      const { value } = this.controller;
      // oxlint-disable-next-line unicorn/no-null
      return value === undefined || value === "" ? null : value;
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
    requestUpdate: (): void => {
      forceUpdate(this.host);
    },
    onChange: (): void => {
      this.notifyListeners();
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
    rootId: (): string => this.rootId,
    itemId: (value: string): string => this.itemId(value),
    inputId: (value: string): string => this.inputId(value),
    controlId: (value: string): string => this.controlId(value),
    labelId: (value: string): string => this.labelIdFor(value),
    subscribe: (listener: () => void): (() => void) => {
      this.listeners.add(listener);
      return (): void => {
        this.listeners.delete(listener);
      };
    },
  };

  constructor() {
    super();
    this.addController(this.controller);
    this.addController(this.form);
  }

  protected get formController(): FormController {
    return this.form;
  }

  public connectedCallback(): void {
    super.connectedCallback();
    if (this.idBase === "") {
      this.idBase = this.host.id || this.generatedId;
    }
    provideRadioGroup(this.host, this.context);
  }

  public componentWillLoad(): void {
    super.componentWillLoad();
    this.idBase = this.host.id || this.generatedId;
    provideRadioGroup(this.host, this.context);
  }

  public componentDidLoad(): void {
    super.componentDidLoad();
  }

  public componentDidRender(): void {
    super.componentDidRender();
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback();
    clearRadioGroup(this.host);
    this.listeners.clear();
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
    this.notifyListeners();
  }

  private get rootId(): string {
    return `radio-group:${this.idBase || this.generatedId}`;
  }

  private get labelId(): string {
    return `${this.rootId}:label`;
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

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  public render(): VNode {
    const field = this.form.fieldApi;
    const fieldInput = field?.getInputProps();

    return (
      <Host class={styles.host}>
        <div
          ref={(el) => {
            if (isHTMLDivElement(el)) {
              this.rootEl = el;
            }
          }}
          id={this.rootId}
          role="radiogroup"
          aria-labelledby={field?.ids.label ?? this.labelId}
          aria-describedby={fieldInput?.["aria-describedby"]}
          aria-errormessage={fieldInput?.["aria-errormessage"]}
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
          class={cx(
            styles.root,
            this.orientation === "horizontal" ? styles.horizontal : "",
            this.innerClass,
          )}
          part="root"
        >
          <slot />
        </div>
      </Host>
    );
  }
}
