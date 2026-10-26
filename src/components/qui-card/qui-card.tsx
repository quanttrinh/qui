import { resolveVar, Component, Element, h, Host, Prop, type VNode } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css } from "#styled-system/css";

import { ensureShadowStylesheet } from "../../utilities/styles";

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
  shadow: true,
})
export class QuiCard {
  @Element() host!: HTMLElement;

  /** The visual style. */
  @Prop() variant: CardVariant = "elevated";

  public connectedCallback(): void {
    ensureShadowStylesheet(this.host);
  }

  public render(): VNode {
    return (
      <Host class={styles.host}>
        <div
          data-scope="card"
          data-part="root"
          part="root"
          data-variant={this.variant}
          class={styles.root}
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
