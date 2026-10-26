import { resolveVar, Component, Element, h, Host, Prop, type VNode } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css } from "#styled-system/css";

import { ensureShadowStylesheet } from "../../utilities/styles";

const styles = {
  host: css({ display: "contents" }),
  root: css({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    width: "1em",
    height: "1em",
    lineHeight: "1",
    color: "currentColor",
    verticalAlign: "middle",
  }),
  svg: css({
    display: "block",
    width: "100%",
    height: "100%",
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

  public connectedCallback(): void {
    ensureShadowStylesheet(this.host);
  }

  public render(): VNode {
    const labelled = this.label !== undefined && this.label !== "";
    return (
      <Host class={styles.host} aria-hidden={labelled ? undefined : "true"}>
        <span
          class={styles.root}
          part="icon"
          role={labelled ? "img" : undefined}
          aria-label={labelled ? this.label : undefined}
        >
          <svg
            class={styles.svg}
            viewBox={this.viewBox}
            aria-hidden="true"
            focusable="false"
            fill="currentColor"
          >
            <path fill="currentColor" d={this.path} />
          </svg>
        </span>
      </Host>
    );
  }
}
