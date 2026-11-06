import { resolveVar, Component, Element, h, Host, Prop, type VNode } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css } from "#styled-system/css";

import { ensureShadowStylesheet } from "../../utilities/styles";
import { renderIconSvg } from "./render-icon";

const styles = {
  host: css({ display: "contents" }),
  root: css({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    w: "1em",
    h: "1em",
    lineHeight: "none",
    color: "currentColor",
    verticalAlign: "middle",
  }),
  svg: css({
    display: "block",
    w: "full",
    h: "full",
  }),
};

/**
 * An inline SVG icon. Pass an SVG path and its viewBox. The icon inherits
 * `font-size` and `color`.
 *
 * ```html
 * <qui-icon
 *   label="Add"
 *   view-box="0 0 24 24"
 *   path="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z"
 * ></qui-icon>
 * ```
 */
@Component({
  tag: "qui-icon",
  styleUrl: resolveVar(styleUrls.quiIcon),
  shadow: true,
})
export class QuiIcon {
  @Element() host!: HTMLElement;

  /** The SVG path data (`d` attribute). Required. */
  @Prop() path!: string;
  /** The SVG viewBox. */
  @Prop() viewBox = "0 0 24 24";
  /** Accessible label. Omit for a decorative icon. */
  @Prop() label?: string;

  connectedCallback(): void {
    ensureShadowStylesheet(this.host);
  }

  render(): VNode {
    const labelled = Boolean(this.label);
    return (
      <Host class={styles.host} aria-hidden={labelled ? undefined : "true"}>
        <span
          class={styles.root}
          part="icon"
          role={labelled ? "img" : undefined}
          aria-label={labelled ? this.label : undefined}
        >
          {renderIconSvg({ path: this.path, viewBox: this.viewBox, class: styles.svg })}
        </span>
      </Host>
    );
  }
}
