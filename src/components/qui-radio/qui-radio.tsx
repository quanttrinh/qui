import {
  resolveVar,
  Component,
  Element,
  forceUpdate,
  h,
  Host,
  Prop,
  type VNode,
} from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css, cx } from "#styled-system/css";

import { ariaAttr, dataAttr } from "../../helpers/attr";
import { isHTMLInputElement } from "../../helpers/dom";
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
    width: "5",
    height: "5",
    rounded: "full",
    borderWidth: "2px",
    borderStyle: "solid",
    borderColor: "outline",
    transition: "border-color 150ms",
    "&[data-state=checked]": {
      borderColor: "primary",
      "&::after": {
        content: '""',
        width: "2.5",
        height: "2.5",
        rounded: "full",
        backgroundColor: "primary",
      },
    },
    "&[data-invalid]": { borderColor: "error" },
    "&[data-focus-visible]": {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary",
      outlineOffset: "2px",
    },
  }),
  label: css({
    fontSize: "sm",
    fontWeight: "medium",
    color: "onSurface",
  }),
  input: css({
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: "0",
    margin: "-1px",
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
  scoped: true,
})
export class QuiRadio {
  @Element() host!: HTMLQuiRadioElement;

  /** The value submitted when this item is selected. */
  @Prop() value!: string;
  /** Disables this option. */
  @Prop() disabled = false;
  /** Marks this option invalid. */
  @Prop() invalid = false;
  /** Plain-text label fallback when no slot content is supplied. */
  @Prop() label?: string;
  /** Additional class applied to the item label. */
  @Prop() innerClass?: string;

  private group?: RadioGroupContext;
  private groupUnsubscribe?: () => void;
  private inputEl?: HTMLInputElement;

  public componentWillLoad(): void {
    this.attachGroup();
  }

  public componentDidLoad(): void {
    if (this.group === undefined) {
      this.attachGroup();
      forceUpdate(this.host);
    }
  }

  public componentDidRender(): void {
    const checked = this.group?.itemState(this.item()).checked ?? false;
    if (this.inputEl !== undefined && this.inputEl.checked !== checked) {
      this.inputEl.checked = checked;
    }
  }

  public disconnectedCallback(): void {
    this.groupUnsubscribe?.();
  }

  private attachGroup(): void {
    const group = consumeRadioGroup(this.host);
    if (group === undefined || group === this.group) {
      return;
    }
    this.groupUnsubscribe?.();
    this.group = group;
    this.groupUnsubscribe = group.subscribe(() => {
      forceUpdate(this.host);
    });
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

  public render(): VNode {
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
          class={cx(styles.item, this.innerClass)}
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
              if (isHTMLInputElement(el)) {
                this.inputEl = el;
              }
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
            onFocus={this.handleFocus}
            onBlur={this.handleBlur}
          />
        </label>
      </Host>
    );
  }
}
