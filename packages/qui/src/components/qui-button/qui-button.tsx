import { Mixin, resolveVar, Component, Element, h, Host, Prop, type VNode } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css } from "#styled-system/css";
import { token } from "#styled-system/tokens";

import { ShadowStylesMixin } from "../shared/mixins";
import { focusRing } from "../shared/styles";

export type ButtonVariant = "filled" | "tonal" | "elevated" | "outlined" | "text";
export type ButtonSize = "sm" | "md" | "lg";

const styles = {
  host: css({ display: "inline-block" }),
  root: css({
    pos: "relative",
    isolation: "isolate",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    rounded: "full",
    borderWidth: "0",
    fontWeight: "medium",
    whiteSpace: "nowrap",
    cursor: "pointer",
    userSelect: "none",
    overflow: "hidden",
    transition: "box-shadow 200ms, background-color 200ms, color 200ms",
    "&::before": {
      content: '""',
      pos: "absolute",
      inset: "0",
      zIndex: "-1",
      bgColor: "var(--qui-button-state-layer-color, currentColor)",
      opacity: 0,
      pointerEvents: "none",
      transition: "opacity 150ms",
    },
    "&:hover:not(:disabled):not([aria-disabled=true])::before": { opacity: 0.08 },
    "&:active:not(:disabled):not([aria-disabled=true])::before": { opacity: 0.12 },
    _focusVisible: {
      ...focusRing,
      ringColor: `var(--qui-button-focus-ring-color, ${token("colors.primary")})`,
    },
    "&:disabled, &[aria-disabled=true]": { opacity: 0.38, cursor: "not-allowed" },

    "&[data-size=sm]": { h: "8", px: "3", gap: "1.5", fontSize: "sm" },
    "&[data-size=md]": { h: "10", px: "6", gap: "2", fontSize: "sm" },
    "&[data-size=lg]": { h: "12", px: "8", gap: "2.5", fontSize: "md" },

    "&[data-variant=filled]": {
      bgColor: `var(--qui-button-container-color, ${token("colors.primary")})`,
      color: `var(--qui-button-label-color, ${token("colors.onPrimary")})`,
      shadow: "sm",
    },
    "&[data-variant=filled]:hover:not(:disabled):not([aria-disabled=true])": { shadow: "md" },
    "&[data-variant=tonal]": {
      bgColor: `var(--qui-button-container-color, ${token("colors.secondaryContainer")})`,
      color: `var(--qui-button-label-color, ${token("colors.onSecondaryContainer")})`,
    },
    "&[data-variant=elevated]": {
      bgColor: `var(--qui-button-container-color, ${token("colors.surfaceContainerLow")})`,
      color: `var(--qui-button-label-color, ${token("colors.primary")})`,
      shadow: "sm",
    },
    "&[data-variant=elevated]:hover:not(:disabled):not([aria-disabled=true])": { shadow: "md" },
    "&[data-variant=outlined]": {
      bgColor: "var(--qui-button-container-color, transparent)",
      color: `var(--qui-button-label-color, ${token("colors.primary")})`,
      borderWidth: "1px",
      borderColor: `var(--qui-button-outline-color, ${token("colors.outline")})`,
    },
    "&[data-variant=text]": {
      bgColor: "var(--qui-button-container-color, transparent)",
      color: `var(--qui-button-label-color, ${token("colors.primary")})`,
    },

    "&[data-icon-only][data-size=sm]": { w: "8", px: "0" },
    "&[data-icon-only][data-size=md]": { w: "10", px: "0" },
    "&[data-icon-only][data-size=lg]": { w: "12", px: "0" },
  }),
  // Anchors do not inherit the host font or drop the default underline.
  // Keeping these separate avoids multiple typography properties per object.
  linkFont: css({ fontFamily: "inherit" }),
  linkDecoration: css({ textDecoration: "none" }),
};

/**
 * MD3 button.
 *
 * @slot - Button label or icon content.
 */
@Component({
  tag: "qui-button",
  styleUrl: resolveVar(styleUrls.quiButton),
  shadow: true,
})
export class QuiButton extends Mixin(ShadowStylesMixin) {
  @Element() host!: HTMLElement;

  /** The visual style. */
  @Prop() variant: ButtonVariant = "filled";
  /** The control size. */
  @Prop() size: ButtonSize = "md";
  /** Renders a square button sized for a single icon. */
  @Prop() iconOnly = false;
  /** Accessible name, primarily for icon-only buttons. */
  @Prop() label?: string;
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

  private get dataProps(): Record<string, string | undefined> {
    return {
      "data-scope": "button",
      "data-part": "root",
      "data-variant": this.variant,
      "data-size": this.size,
      "data-icon-only": this.iconOnly ? "" : undefined,
    };
  }

  render(): VNode {
    return (
      <Host class={styles.host}>
        {this.href ? (
          <a
            {...this.dataProps}
            part="button"
            class={`${styles.root} ${styles.linkFont} ${styles.linkDecoration}`}
            href={this.disabled ? undefined : this.href}
            target={this.target}
            rel={this.rel}
            download={this.download}
            tabIndex={this.disabled ? -1 : undefined}
            aria-label={this.label === "" ? undefined : this.label}
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
            class={styles.root}
            type={this.type}
            disabled={this.disabled}
            aria-label={this.label === "" ? undefined : this.label}
          >
            <slot />
          </button>
        )}
      </Host>
    );
  }
}
