import { describe, expect, h, it, render } from "@stencil/vitest";

import { type OptionItem } from "../shared/option/option";

const accounts: OptionItem[] = [
  { value: "account-1", label: "Account One", disabled: false },
  { value: "account-2", label: "Account Two", disabled: false },
  { value: "account-3", label: "Account Three", disabled: false },
];

describe("qui-combobox", () => {
  it("filters options while typing and selects a match", async () => {
    const { root, spyOnEvent, waitForChanges } = await render(
      <qui-combobox items={accounts} placeholder="Search accounts" />,
    );
    const spy = spyOnEvent("valuechange");
    const input = root.querySelector<HTMLInputElement>("[part=input]");
    if (input === null) {
      throw new TypeError("Expected a combobox input");
    }

    input.click();
    await waitForChanges();
    input.value = "Two";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await waitForChanges();

    const options = root.querySelectorAll("[part=option]");
    expect(options.length).toBe(1);
    expect(options[0]).toHaveAttribute("data-value", "account-2");

    (options[0] as HTMLElement).click();
    await waitForChanges();

    expect(spy.lastEvent?.detail.value).toEqual(["account-2"]);
    expect(input.value).toBe("Account Two");
  });

  it("opens with its trigger and closes on Escape", async () => {
    const { root, waitForChanges } = await render(
      <qui-combobox items={accounts} placeholder="Search accounts" />,
    );
    const trigger = root.querySelector<HTMLButtonElement>("[part=trigger]");
    const input = root.querySelector<HTMLInputElement>("[part=input]");
    if (trigger === null || input === null) {
      throw new TypeError("Expected combobox controls");
    }

    trigger.click();
    await waitForChanges();
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 30);
    });
    expect(input).toHaveAttribute("aria-expanded", "true");

    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
    );
    await waitForChanges();
    expect(input).toHaveAttribute("aria-expanded", "false");
  });
});
