import { describe, expect, h, it, render } from "@stencil/vitest";

import { queryControl, queryPartIn } from "../../test-utils/component";
import { nextFrame, waitForShadowStyles } from "../../test-utils/dom-ready";

const ADD_PATH = "M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z";

describe("qui-icon", () => {
  it("renders the supplied path and viewBox", async () => {
    const { root } = await render(<qui-icon viewBox="0 0 24 24" path={ADD_PATH} />);
    const svg = queryControl<SVGSVGElement>(root, "svg");
    const path = svg.querySelector("path");

    expect(svg.getAttribute("viewBox")).toBe("0 0 24 24");
    expect(path?.getAttribute("d")).toBe(ADD_PATH);
    expect(path?.getAttribute("fill")).toBe("currentColor");
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(getComputedStyle(root).display).toBe("contents");
    expect(queryPartIn(root, "icon").localName).toBe("span");
  });

  it("resizes the SVG through the icon part", async () => {
    const { root, waitForChanges } = await render(<qui-icon path={ADD_PATH} />);
    await waitForChanges();
    await waitForShadowStyles(root);
    const icon = queryPartIn(root, "icon");
    const svg = queryControl<SVGSVGElement>(root, "svg");

    icon.style.width = "32px";
    icon.style.height = "32px";
    await nextFrame();

    expect(getComputedStyle(svg).width).toBe("32px");
    expect(getComputedStyle(svg).height).toBe("32px");
  });

  it("exposes an accessible name on the icon box when labelled", async () => {
    const { root } = await render(<qui-icon label="Add" path={ADD_PATH} />);
    const icon = queryPartIn(root, "icon");

    expect(icon).toHaveAttribute("role", "img");
    expect(icon).toHaveAttribute("aria-label", "Add");
    expect(root).not.toHaveAttribute("role");
    expect(root).not.toHaveAttribute("aria-hidden");
  });
});
