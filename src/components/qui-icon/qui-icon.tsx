import { resolveVar, Component, h, Host, Prop, type VNode } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css } from "#styled-system/css";

const styles = {
  host: css({
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
  glyph: css({
    fontFamily: '"Material Symbols Rounded"',
    fontWeight: "normal",
    fontStyle: "normal",
    fontSize: "1em",
    lineHeight: "1",
    letterSpacing: "normal",
    textTransform: "none",
    display: "inline-block",
    whiteSpace: "nowrap",
    direction: "ltr",
    fontFeatureSettings: "'liga'",
    fontSmoothing: "antialiased",
  }),
};

/**
 * A Material Symbols icon rendered from the icon font. Load the font once, then
 * pass any Material Symbols name. The icon inherits `font-size` and `color`.
 *
 * ```ts
 * import "@material-symbols/font-400/rounded.css";
 * ```
 */
@Component({
  tag: "qui-icon",
  styleUrl: resolveVar(styleUrls.quiIcon),
  scoped: true,
})
export class QuiIcon {
  /** Any Material Symbols name, e.g. `add`, `check`, `arrow_back`. */
  @Prop() name!: string;
  /** Accessible label. Omit for a decorative icon. */
  @Prop() label?: string;

  public render(): VNode {
    const labelled = this.label !== undefined && this.label !== "";
    return (
      <Host
        class={styles.host}
        part="icon"
        role={labelled ? "img" : undefined}
        aria-label={labelled ? this.label : undefined}
        aria-hidden={labelled ? undefined : "true"}
      >
        <span class={styles.glyph}>{this.name}</span>
      </Host>
    );
  }
}
