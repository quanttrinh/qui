import { describe, expect, h, it, render } from "@stencil/vitest";

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
    const trigger = root.querySelector<HTMLButtonElement>("[part=trigger]");
    if (trigger === null) {
      throw new Error("Expected a select trigger");
    }

    trigger.click();
    await waitForChanges();
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 50);
    });

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const renderedOptions = root.querySelectorAll("[part=option]");
    expect(renderedOptions.length).toBeGreaterThan(0);
    expect(renderedOptions.length).toBeLessThan(accounts.length);

    const option = root.querySelector<HTMLElement>('[part=option][data-value="account-2"]');
    if (option === null) {
      throw new Error("Expected the second option to be rendered");
    }
    option.click();
    await waitForChanges();

    expect(spy.lastEvent?.detail.value).toEqual(["account-2"]);
    expect(root.querySelector("[part=trigger]")?.textContent).toContain("Account 0002");
  });
});
