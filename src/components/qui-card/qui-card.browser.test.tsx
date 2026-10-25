import { describe, expect, h, it, render } from "@stencil/vitest";

describe("qui-card", () => {
  it("renders its slots and variant", async () => {
    const { root } = await render(
      <qui-card variant="outlined">
        <h2 slot="title">Card title</h2>
        <p slot="description">Description</p>
        <p>Body</p>
        <button slot="actions" type="button">
          Action
        </button>
      </qui-card>,
    );
    const surface = root.querySelector("[data-part=root]");

    expect(surface).toHaveAttribute("data-variant", "outlined");
    expect(root.querySelector("[data-part=title]")?.textContent).toContain("Card title");
    expect(root.querySelector("[data-part=description]")?.textContent).toContain("Description");
    expect(root.querySelector("[data-part=content]")?.textContent).toContain("Body");
    expect(root.querySelector("[data-part=actions]")?.textContent).toContain("Action");
  });
});
