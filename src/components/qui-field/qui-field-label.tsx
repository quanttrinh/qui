import { resolveVar, Component, Element, h, Host, type VNode } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css } from "#styled-system/css";

import { isElement } from "../../helpers/dom";
import { consumeContextPart } from "../shared/context-part";
import { ContextPartElement } from "../shared/context-part-element";
import { consumeField, type FieldApi } from "../shared/field/context";
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
export class QuiFieldLabel extends ContextPartElement<FieldApi> {
  @Element() host!: HTMLQuiFieldLabelElement;

  protected readonly contextPart = consumeContextPart({
    host: (): HTMLElement => this.host,
    key: "field",
    consume: consumeField,
    setup: (field): (() => void) => {
      this.host.id = field.getLabelProps().id;
      return field.registerLabel(this.host);
    },
  });

  private get field(): FieldApi | undefined {
    return this.contextPart.context;
  }

  private readonly handleClick = (event: MouseEvent): void => {
    const { field } = this;
    if (field === undefined || field.disabled()) {
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

  public render(): VNode {
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
