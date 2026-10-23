import { resolveVar, Component, h, Host, Prop, type VNode } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css, cx } from "#styled-system/css";

export type CardVariant = "elevated" | "filled" | "outlined";

const styles = {
  host: css({ display: "block" }),
  root: css({
    display: "flex",
    flexDirection: "column",
    gap: "3",
    padding: "4",
    rounded: "2xl",
    transition: "box-shadow 200ms, background-color 200ms",
    "&[data-variant=elevated]": {
      backgroundColor: "surfaceContainerLow",
      boxShadow: "sm",
    },
    "&[data-variant=filled]": {
      backgroundColor: "surfaceContainerHighest",
    },
    "&[data-variant=outlined]": {
      backgroundColor: "surface",
      borderWidth: "1px",
      borderColor: "outlineVariant",
    },
  }),
  title: css({
    fontSize: "md",
    fontWeight: "medium",
    color: "onSurface",
    "&:empty": { display: "none" },
  }),
  description: css({
    fontSize: "sm",
    color: "onSurfaceVariant",
    "&:empty": { display: "none" },
  }),
  content: css({
    fontSize: "sm",
    color: "onSurfaceVariant",
  }),
  actions: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "2",
    "&:empty": { display: "none" },
  }),
};

/**
 * MD3 card container.
 *
 * @slot title - Optional card title.
 * @slot description - Optional supporting text.
 * @slot actions - Optional action row.
 * @slot - Default card content.
 */
@Component({
  tag: "qui-card",
  styleUrl: resolveVar(styleUrls.quiCard),
  scoped: true,
})
export class QuiCard {
  /** The visual style. */
  @Prop() variant: CardVariant = "elevated";
  /** Additional class applied to the surface. */
  @Prop() innerClass?: string;

  public render(): VNode {
    return (
      <Host class={styles.host}>
        <div
          data-scope="card"
          data-part="root"
          data-variant={this.variant}
          class={cx(styles.root, this.innerClass)}
        >
          <div data-scope="card" data-part="title" class={styles.title}>
            <slot name="title" />
          </div>
          <div data-scope="card" data-part="description" class={styles.description}>
            <slot name="description" />
          </div>
          <div data-scope="card" data-part="content" class={styles.content}>
            <slot />
          </div>
          <div data-scope="card" data-part="actions" class={styles.actions}>
            <slot name="actions" />
          </div>
        </div>
      </Host>
    );
  }
}
