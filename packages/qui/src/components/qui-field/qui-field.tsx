import {
  Mixin,
  resolveVar,
  Component,
  Element,
  h,
  Host,
  Prop,
  Watch,
  type VNode,
} from "@stencil/core";

import { styleUrls } from "#qui-style-url";

import { FieldController } from "../shared/controllers";
import { dataAttr } from "../shared/helpers/aria/attr";
import { ControllerHostMixin, ShadowStylesMixin } from "../shared/mixins";
import { fieldStyles } from "./styles";

/** Props that only feed the field context; the template ignores them. */
const RENDER_INDEPENDENT_PROPS = new Set(["required"]);

/**
 * Groups a control with its label, helper text, and error text.
 *
 * Descendant `qui-input`, `qui-textarea`, `qui-checkbox`, `qui-switch`, and
 * `qui-radio-group` read the field state through a DOM context instead of
 * duplicating it.
 *
 * @slot - Field label, control, helper text, and error text.
 */
@Component({
  tag: "qui-field",
  styleUrl: resolveVar(styleUrls.quiField),
  shadow: true,
})
export class QuiField extends Mixin(ShadowStylesMixin, ControllerHostMixin) {
  @Element() host!: HTMLQuiFieldElement;

  /** Base id used to derive the field part ids. Defaults to the host id. */
  @Prop() fieldId?: string;
  /** Overrides the generated root id. */
  @Prop() rootId?: string;
  /** Overrides the generated control id. */
  @Prop() controlId?: string;
  /** Overrides the generated label id. */
  @Prop() labelId?: string;
  /** Overrides the generated error-text id. */
  @Prop() errorTextId?: string;
  /** Overrides the generated helper-text id. */
  @Prop() helperTextId?: string;
  /** Marks the field invalid. */
  @Prop() invalid = false;
  /** Disables the field and its controls. */
  @Prop() disabled = false;
  /** Makes the field and its controls read-only. */
  @Prop() readOnly = false;
  /** Marks the field required. */
  @Prop() required = false;

  private readonly field = new FieldController(this, {
    getFieldId: () => this.fieldId,
    getElementIds: () => ({
      root: this.rootId,
      control: this.controlId,
      label: this.labelId,
      errorText: this.errorTextId,
      helperText: this.helperTextId,
    }),
    isInvalid: () => this.invalid,
    isDisabled: () => this.disabled,
    isReadOnly: () => this.readOnly,
    isRequired: () => this.required,
  });

  @Watch("fieldId")
  @Watch("rootId")
  @Watch("controlId")
  @Watch("labelId")
  @Watch("errorTextId")
  @Watch("helperTextId")
  @Watch("invalid")
  @Watch("disabled")
  @Watch("readOnly")
  @Watch("required")
  private notify(): void {
    this.field.notify();
  }

  componentShouldUpdate(_newValue: unknown, _oldValue: unknown, propName: string): boolean {
    // `required` only feeds the field context; the field template ignores it.
    return !RENDER_INDEPENDENT_PROPS.has(propName);
  }

  render(): VNode {
    const { ids } = this.field;
    return (
      <Host
        id={ids.root}
        data-scope="field"
        data-part="root"
        data-disabled={dataAttr(this.disabled)}
        data-invalid={dataAttr(this.invalid)}
        data-readonly={dataAttr(this.readOnly)}
        class={fieldStyles.host}
      >
        <div
          class={fieldStyles.root}
          part="root"
          data-scope="field"
          data-part="root"
          data-disabled={dataAttr(this.disabled)}
          data-invalid={dataAttr(this.invalid)}
          data-readonly={dataAttr(this.readOnly)}
        >
          <slot />
        </div>
      </Host>
    );
  }
}
