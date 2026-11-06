import { h, type VNode } from "@stencil/core";

export interface RenderIconOptions {
  path: string;
  viewBox: string;
  class?: string;
}

/** Render a decorative inline SVG icon from its path data. */
export function renderIconSvg({ path, viewBox, class: className }: RenderIconOptions): VNode {
  return h(
    "svg",
    {
      class: className === undefined ? undefined : { [className]: true },
      viewBox,
      width: "1em",
      height: "1em",
      "aria-hidden": "true",
      focusable: "false",
      fill: "currentColor",
    },
    [h("path", { fill: "currentColor", d: path })],
  );
}
