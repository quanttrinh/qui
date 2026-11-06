import { Mixin, resolveVar, Component, Element, h, Host, type VNode } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css } from "#styled-system/css";

import { FieldPartController } from "../shared/controllers";
import { isElement } from "../shared/helpers/dom/dom";
import { type FieldApi } from "../shared/helpers/field";
import { ControllerHostMixin } from "../shared/mixins";
import { fieldStyles } from "./styles";

const styles = {
  host: css({ display: "block" }),
};

const INTERACTIVE_DESCENDANT =
  'a[href], button, input, select, textarea, summary, [contenteditable="true"], [role="button"], [tabindex]:not([tabindex="-1"])';

/**
 * The label part of a `qui-field`.
 *
 * @slot - Label content.
 */
@Component({
  tag: "qui-field-label",
  styleUrl: resolveVar(styleUrls.quiFieldLabel),
  shadow: true,
})
export class QuiFieldLabel extends Mixin(ControllerHostMixin) {
  @Element() host!: HTMLQuiFieldLabelElement;

  protected readonly fieldPart = new FieldPartController(this, { part: "label" });

  private get field(): FieldApi | undefined {
    return this.fieldPart.field;
  }

  private readonly handleClick = (event: MouseEvent): void => {
    const { field } = this;
    if (!field || field.disabled()) {
      return;
    }

    const { currentTarget } = event;
    const path = event.composedPath();
    const labelIndex = currentTarget === null ? -1 : path.indexOf(currentTarget);
    const labelContent = labelIndex === -1 ? path : path.slice(0, labelIndex);
    if (labelContent.some((node) => isElement(node) && node.matches(INTERACTIVE_DESCENDANT))) {
      return;
    }

    field.focusControl();
    field.clickControl();
  };

  render(): VNode {
    const props = this.field?.getLabelProps();

    return (
      <Host id={props?.id} class={styles.host}>
        {/* A label is interactive even though it has no widget role. Slot text is resolved at runtime. */}
        {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/label-has-associated-control */}
        <label
          htmlFor={props?.htmlFor}
          data-scope="field"
          data-part="label"
          data-disabled={props?.["data-disabled"]}
          data-invalid={props?.["data-invalid"]}
          data-readonly={props?.["data-readonly"]}
          data-required={props?.["data-required"]}
          class={fieldStyles.label}
          part="label"
          onClick={this.handleClick}
        >
          <slot />
        </label>
      </Host>
    );
  }
}
