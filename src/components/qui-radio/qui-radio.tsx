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
import { spreadProps } from "@zag-js/vanilla";

import { styleUrls } from "#qui-style-url";
import { css, cx } from "#styled-system/css";

import { consumeRadioGroup, type RadioGroupApi, type RadioItem } from "./radio-group-context";

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

  private group?: RadioGroupApi;
  private groupUnsubscribe?: () => void;
  private spreads: (() => void)[] = [];
  private rootEl?: HTMLLabelElement;
  private controlEl?: HTMLSpanElement;
  private textEl?: HTMLSpanElement;
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
    this.applySpreads();
  }

  public disconnectedCallback(): void {
    for (const cleanup of this.spreads) {
      cleanup();
    }
    this.spreads = [];
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

  private itemProps(): RadioItem {
    return {
      value: this.value,
      disabled: this.disabled ? true : undefined,
      invalid: this.invalid ? true : undefined,
    };
  }

  private applySpreads(): void {
    const { group } = this;
    if (group === undefined) {
      return;
    }
    const item = this.itemProps();
    const props = group.itemProps(item);
    this.spreads = [];
    if (this.rootEl !== undefined) {
      this.spreads.push(
        spreadProps(this.rootEl, {
          ...props.root,
          class: cx(styles.item, this.innerClass),
        }),
      );
    }
    if (this.controlEl !== undefined) {
      this.spreads.push(
        spreadProps(this.controlEl, {
          ...props.control,
          class: styles.control,
        }),
      );
    }
    if (this.textEl !== undefined) {
      this.spreads.push(
        spreadProps(this.textEl, {
          ...props.text,
          class: styles.label,
        }),
      );
    }
    if (this.inputEl !== undefined) {
      const { name: _name, required: _required, ...inputProps } = props.hiddenInput;
      this.spreads.push(spreadProps(this.inputEl, inputProps));
    }
  }

  public render(): VNode {
    return (
      <Host class={styles.host}>
        <label
          ref={(el) => {
            if (el instanceof HTMLLabelElement) {
              this.rootEl = el;
            }
          }}
          class={styles.item}
          part="root"
        >
          <span
            ref={(el) => {
              if (el instanceof HTMLSpanElement) {
                this.controlEl = el;
              }
            }}
            class={styles.control}
            part="control"
          />
          <span
            ref={(el) => {
              if (el instanceof HTMLSpanElement) {
                this.textEl = el;
              }
            }}
            class={styles.label}
            part="label"
          >
            <slot>{this.label}</slot>
          </span>
          <input
            ref={(el) => {
              if (el instanceof HTMLInputElement) {
                this.inputEl = el;
              }
            }}
          />
        </label>
      </Host>
    );
  }
}
