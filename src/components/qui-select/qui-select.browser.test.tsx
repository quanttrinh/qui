import { describe, expect, h, it, render } from "@stencil/vitest";

import { queryPartIn, resolveHost } from "../../test-utils/component";
import { settle } from "../../test-utils/dom-ready";
import { expectFocusedDeep, pointerDown } from "../../test-utils/interactions";
import { queryParts } from "../../test-utils/shadow";
import { type OptionItem } from "../shared/option/option";

const accounts: OptionItem[] = Array.from({ length: 1000 }, (_entry, index) => ({
  value: `account-${index + 1}`,
  label: `Account ${String(index + 1).padStart(4, "0")}`,
  disabled: false,
}));

describe("qui-select", () => {
  it("opens a virtualized list and selects an option", async () => {
    const { root, spyOnEvent, waitForChanges } = await render(
      <qui-select items={accounts} placeholder="Pick an account" />,
    );
    const spy = spyOnEvent("valuechange");
    const trigger = queryPartIn<HTMLButtonElement>(root, "trigger");

    trigger.click();
    await waitForChanges();
    await settle(50);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const renderedOptions = queryParts<HTMLElement>(root, "option");
    expect(renderedOptions.length).toBeGreaterThan(0);
    expect(renderedOptions.length).toBeLessThan(accounts.length);

    const option = renderedOptions.find((candidate) => candidate.dataset.value === "account-2");
    if (option === undefined) {
      throw new Error("Expected the second option to be rendered");
    }
    option.click();
    await waitForChanges();

    expect(spy.lastEvent?.detail).toMatchObject({ value: ["account-2"] });
    expect(queryPartIn(root, "trigger").textContent).toContain("Account 0002");
  });

  it("closes when the open trigger is clicked again", async () => {
    const { root, waitForChanges } = await render(
      <qui-select items={accounts} placeholder="Pick an account" />,
    );
    const trigger = queryPartIn<HTMLButtonElement>(root, "trigger");

    trigger.click();
    await waitForChanges();
    await settle(50);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    pointerDown(trigger);
    trigger.click();
    await waitForChanges();
    await settle(50);

    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("focuses the internal trigger button", async () => {
    const { root, waitForChanges } = await render(<qui-select items={accounts} />);
    const trigger = queryPartIn<HTMLButtonElement>(root, "trigger");

    await resolveHost<HTMLQuiSelectElement>(root, "qui-select").focusControl();
    await waitForChanges();

    expectFocusedDeep(trigger);
  });
});
