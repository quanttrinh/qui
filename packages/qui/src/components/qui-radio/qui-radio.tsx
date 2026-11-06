import {
  Mixin,
  resolveVar,
  Component,
  Element,
  h,
  Host,
  Method,
  Prop,
  type VNode,
} from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css } from "#styled-system/css";

import { ContextPartController } from "../shared/controllers";
import { ariaAttr, dataAttr } from "../shared/helpers/aria/attr";
import { isHTMLInputElement } from "../shared/helpers/dom/dom";
import { focusElement } from "../shared/helpers/dom/focus";
import { ControllerHostMixin } from "../shared/mixins";
import { focusRing } from "../shared/styles";
import {
  consumeRadioGroup,
  type RadioGroupContext,
  type RadioItem,
  type RadioItemState,
} from "./context";

const styles = {
  host: css({ display: "block" }),
  item: css({
    display: "flex",
    alignItems: "center",
    gap: "2",
    cursor: "pointer",
    userSelect: "none",
    "&[data-disabled]": { cursor: "not-allowed", opacity: 0.38 },
  }),
  control: css({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    w: "5",
    h: "5",
    rounded: "full",
    borderWidth: "0.5",
    borderStyle: "solid",
    borderColor: "outline",
    transition: "border-color 150ms",
    "&[data-state=checked]": {
      borderColor: "primary",
      "&::after": {
        content: '""',
        w: "2.5",
        h: "2.5",
        rounded: "full",
        bgColor: "primary",
      },
    },
    "&[data-invalid]": { borderColor: "error" },
    "&[data-focus-visible]": focusRing,
  }),
  label: css({
    textStyle: "sm",
    fontWeight: "medium",
    color: "onSurface",
  }),
  input: css({
    pos: "absolute",
    w: "1px",
    h: "1px",
    p: "0",
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    borderWidth: "0",
  }),
};

/**
 * A single radio option inside `qui-radio-group`.
 *
 * @slot - Label content. Falls back to the `label` prop.
 */
@Component({
  tag: "qui-radio",
  styleUrl: resolveVar(styleUrls.quiRadio),
  shadow: true,
})
export class QuiRadio extends Mixin(ControllerHostMixin) {
  @Element() host!: HTMLQuiRadioElement;

  /** The value submitted when this item is selected. */
  @Prop() value!: string;
  /** Disables this option. */
  @Prop() disabled = false;
  /** Marks this option invalid. */
  @Prop() invalid = false;
  /** Plain-text label fallback when no slot content is supplied. */
  @Prop() label?: string;

  protected readonly contextPart = new ContextPartController(this, {
    key: "radio-group",
    consume: consumeRadioGroup,
  });
  private inputEl?: HTMLInputElement;
  private registeredInput?: HTMLInputElement;
  private registeredValue?: string;
  private unregisterInput?: () => void;

  private get group(): RadioGroupContext | undefined {
    return this.contextPart.context;
  }

  componentDidRender(): void {
    const checked = this.group?.itemState(this.item()).checked ?? false;
    if (this.inputEl !== undefined && this.inputEl.checked !== checked) {
      this.inputEl.checked = checked;
    }
    const { group } = this;
    if (
      group !== undefined &&
      this.inputEl !== undefined &&
      (this.registeredInput !== this.inputEl || this.registeredValue !== this.value)
    ) {
      this.unregisterInput?.();
      this.unregisterInput = group.registerInput(this.value, this.inputEl);
      this.registeredInput = this.inputEl;
      this.registeredValue = this.value;
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unregisterInput?.();
    this.unregisterInput = undefined;
    this.registeredInput = undefined;
    this.registeredValue = undefined;
  }

  /** Moves focus to the internal native radio input. */
  @Method()
  async focusControl(options?: FocusOptions): Promise<void> {
    await focusElement(this.inputEl, options);
  }

  private item(): RadioItem {
    return {
      value: this.value,
      disabled: this.disabled ? true : undefined,
      invalid: this.invalid ? true : undefined,
    };
  }

  private readonly handleClick = (event: Event): void => {
    const { group } = this;
    if (group === undefined) {
      return;
    }
    if (group.isDisabled() || group.isReadOnly() || this.disabled) {
      event.preventDefault();
      return;
    }
    group.select(this.value);
  };

  private readonly handleFocus = (event: FocusEvent): void => {
    const target = event.currentTarget;
    const focusVisible = isHTMLInputElement(target) && target.matches(":focus-visible");
    this.group?.focus(this.value, focusVisible);
  };

  private readonly handleBlur = (): void => {
    this.group?.blur();
  };

  render(): VNode {
    const { group } = this;
    const item = this.item();
    const state: RadioItemState = group?.itemState(item) ?? {
      checked: false,
      disabled: this.disabled,
      invalid: this.invalid,
      focused: false,
      focusVisible: false,
    };
    const orientation = group?.orientation() ?? "vertical";
    const textDirection = group?.textDirection();
    const readOnly = group?.isReadOnly() ?? false;
    const dataAttrs = {
      "data-state": state.checked ? "checked" : "unchecked",
      "data-disabled": dataAttr(state.disabled),
      "data-readonly": dataAttr(readOnly),
      "data-invalid": dataAttr(state.invalid),
      "data-focus": dataAttr(state.focused),
      "data-focus-visible": dataAttr(state.focusVisible),
      "data-orientation": orientation,
      dir: textDirection,
    };

    return (
      <Host class={styles.host}>
        <label
          id={group?.itemId(this.value)}
          htmlFor={group?.inputId(this.value)}
          data-scope="radio-group"
          data-part="item"
          {...dataAttrs}
          class={styles.item}
          part="root"
        >
          <span
            id={group?.controlId(this.value)}
            data-scope="radio-group"
            data-part="item-control"
            aria-hidden="true"
            {...dataAttrs}
            class={styles.control}
            part="control"
          />
          <span
            id={group?.labelId(this.value)}
            data-scope="radio-group"
            data-part="item-text"
            {...dataAttrs}
            class={styles.label}
            part="label"
          >
            <slot>{this.label}</slot>
          </span>
          <input
            ref={(el) => {
              this.inputEl = el;
            }}
            id={group?.inputId(this.value)}
            type="radio"
            value={this.value}
            checked={state.checked}
            disabled={state.disabled || readOnly}
            aria-labelledby={group?.labelId(this.value)}
            aria-invalid={ariaAttr(state.invalid)}
            data-ownedby={group?.rootId()}
            class={styles.input}
            onClick={this.handleClick}
            onChange={this.handleClick}
            onFocus={this.handleFocus}
            onBlur={this.handleBlur}
          />
        </label>
      </Host>
    );
  }
}
