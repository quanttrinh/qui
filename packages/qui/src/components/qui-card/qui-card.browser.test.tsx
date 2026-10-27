import { describe, expect, h, it, render } from "@stencil/vitest";

import { queryPartIn } from "../../test-utils/component";
import { queryInside } from "../../test-utils/shadow";

function assignedText(slot: HTMLSlotElement | null): string {
  if (slot === null) {
    throw new TypeError("Expected a card slot");
  }
  return slot
    .assignedElements()
    .map((element) => element.textContent)
    .join("");
}

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
    const surface = queryPartIn(root, "root");
    const titleSlot = queryInside<HTMLSlotElement>(root, 'slot[name="title"]');
    const descriptionSlot = queryInside<HTMLSlotElement>(root, 'slot[name="description"]');
    const contentSlot = queryInside<HTMLSlotElement>(root, "slot:not([name])");
    const actionsSlot = queryInside<HTMLSlotElement>(root, 'slot[name="actions"]');

    expect(surface).toHaveAttribute("data-variant", "outlined");
    expect(assignedText(titleSlot)).toContain("Card title");
    expect(assignedText(descriptionSlot)).toContain("Description");
    expect(assignedText(contentSlot)).toContain("Body");
    expect(assignedText(actionsSlot)).toContain("Action");
  });
});
