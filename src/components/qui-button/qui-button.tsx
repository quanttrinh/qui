import { resolveVar, Component, h, Host, Prop, type VNode } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css, cx } from "#styled-system/css";

export type ButtonVariant = "filled" | "tonal" | "elevated" | "outlined" | "text";
export type ButtonSize = "sm" | "md" | "lg";

const styles = {
  host: css({ display: "inline-block" }),
  root: css({
    position: "relative",
    isolation: "isolate",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    rounded: "full",
    borderWidth: "0",
    fontFamily: "inherit",
    fontWeight: "medium",
    whiteSpace: "nowrap",
    cursor: "pointer",
    userSelect: "none",
    overflow: "hidden",
    textDecoration: "none",
    transition: "box-shadow 200ms, background-color 200ms, color 200ms",
    "&::before": {
      content: '""',
      position: "absolute",
      inset: "0",
      zIndex: "-1",
      backgroundColor: "currentColor",
      opacity: 0,
      pointerEvents: "none",
      transition: "opacity 150ms",
    },
    "&:hover:not(:disabled):not([aria-disabled=true])::before": { opacity: 0.08 },
    "&:active:not(:disabled):not([aria-disabled=true])::before": { opacity: 0.12 },
    "& svg": { boxSize: "1.25em" },
    _focusVisible: {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary",
      outlineOffset: "2px",
    },
    "&:disabled, &[aria-disabled=true]": { opacity: 0.38, cursor: "not-allowed" },

    "&[data-size=sm]": { height: "8", paddingInline: "3", gap: "1.5", fontSize: "sm" },
    "&[data-size=md]": { height: "10", paddingInline: "6", gap: "2", fontSize: "sm" },
    "&[data-size=lg]": { height: "12", paddingInline: "8", gap: "2.5", fontSize: "md" },

    "&[data-variant=filled]": {
      backgroundColor: "primary",
      color: "onPrimary",
      boxShadow: "sm",
    },
    "&[data-variant=filled]:hover:not(:disabled):not([aria-disabled=true])": { boxShadow: "md" },
    "&[data-variant=tonal]": {
      backgroundColor: "secondaryContainer",
      color: "onSecondaryContainer",
    },
    "&[data-variant=elevated]": {
      backgroundColor: "surfaceContainerLow",
      color: "primary",
      boxShadow: "sm",
    },
    "&[data-variant=elevated]:hover:not(:disabled):not([aria-disabled=true])": { boxShadow: "md" },
    "&[data-variant=outlined]": {
      color: "primary",
      borderWidth: "1px",
      borderColor: "outline",
    },
    "&[data-variant=text]": { color: "primary" },

    "&[data-icon-only] svg": { boxSize: "1.5em" },
    "&[data-icon-only][data-size=sm]": { width: "8", paddingInline: "0" },
    "&[data-icon-only][data-size=md]": { width: "10", paddingInline: "0" },
    "&[data-icon-only][data-size=lg]": { width: "12", paddingInline: "0" },
  }),
};

/**
 * MD3 button.
 *
 * @slot - Button label or icon content.
 */
@Component({
  tag: "qui-button",
  styleUrl: resolveVar(styleUrls.quiButton),
  scoped: true,
})
export class QuiButton {
  /** The visual style. */
  @Prop() variant: ButtonVariant = "filled";
  /** The control size. */
  @Prop() size: ButtonSize = "md";
  /** Renders a square button sized for a single icon. */
  @Prop() iconOnly = false;
  /** Disables the control. */
  @Prop() disabled = false;
  /** When provided, renders an anchor instead of a button. */
  @Prop() href?: string;
  /** Anchor target. */
  @Prop() target?: string;
  /** Anchor relationship. */
  @Prop() rel?: string;
  /** Anchor download hint. */
  @Prop() download?: string;
  /** Native button type. */
  @Prop() type: "button" | "submit" | "reset" = "button";
  /** Additional class applied to the inner control. */
  @Prop() innerClass?: string;

  private get rootClass(): string {
    return cx(styles.root, this.innerClass);
  }

  private get dataProps(): Record<string, string | undefined> {
    return {
      "data-scope": "button",
      "data-part": "root",
      "data-variant": this.variant,
      "data-size": this.size,
      "data-icon-only": this.iconOnly ? "" : undefined,
    };
  }

  public render(): VNode {
    return (
      <Host class={styles.host}>
        {this.href !== undefined && this.href !== "" ? (
          <a
            {...this.dataProps}
            part="button"
            class={this.rootClass}
            href={this.disabled ? undefined : this.href}
            target={this.target}
            rel={this.rel}
            download={this.download}
            tabIndex={this.disabled ? -1 : undefined}
            aria-disabled={this.disabled ? "true" : undefined}
            onClick={(event) => {
              if (this.disabled) {
                event.preventDefault();
              }
            }}
          >
            <slot />
          </a>
        ) : (
          <button
            {...this.dataProps}
            part="button"
            class={this.rootClass}
            type={this.type}
            disabled={this.disabled}
          >
            <slot />
          </button>
        )}
      </Host>
    );
  }
}
