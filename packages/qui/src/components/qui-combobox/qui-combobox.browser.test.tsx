import { describe, expect, h, it, render } from "@stencil/vitest";

import { queryPartIn, resolveHost } from "../../test-utils/component";
import { settle } from "../../test-utils/dom-ready";
import { expectFocusedDeep, pointerDown, typeInto } from "../../test-utils/interactions";
import { queryParts } from "../../test-utils/shadow";
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
    const input = queryPartIn<HTMLInputElement>(root, "input");

    input.click();
    await waitForChanges();
    typeInto(input, "Two");
    await waitForChanges();

    const options = queryParts<HTMLElement>(root, "option");
    expect(options.length).toBe(1);
    expect(options[0]).toHaveAttribute("data-value", "account-2");

    options[0].click();
    await waitForChanges();

    expect(spy.lastEvent?.detail).toMatchObject({ value: ["account-2"] });
    expect(input.value).toBe("Account Two");
  });

  it("stays open when the trigger is clicked after focusing the input", async () => {
    const { root, waitForChanges } = await render(
      <qui-combobox items={accounts} placeholder="Search accounts" />,
    );
    const trigger = queryPartIn<HTMLButtonElement>(root, "trigger");
    const input = queryPartIn<HTMLInputElement>(root, "input");

    input.focus();
    trigger.focus();
    trigger.click();
    await waitForChanges();
    await settle(30);

    expect(input).toHaveAttribute("aria-expanded", "true");
  });

  it("closes when the open trigger is clicked again", async () => {
    const { root, waitForChanges } = await render(
      <qui-combobox items={accounts} placeholder="Search accounts" />,
    );
    const trigger = queryPartIn<HTMLButtonElement>(root, "trigger");
    const input = queryPartIn<HTMLInputElement>(root, "input");

    trigger.click();
    await waitForChanges();
    await settle(30);
    expect(input).toHaveAttribute("aria-expanded", "true");

    pointerDown(trigger);
    trigger.click();
    await waitForChanges();
    await settle(30);

    expect(input).toHaveAttribute("aria-expanded", "false");
  });

  it("opens with its trigger and closes on Escape", async () => {
    const { root, waitForChanges } = await render(
      <qui-combobox items={accounts} placeholder="Search accounts" />,
    );
    const trigger = queryPartIn<HTMLButtonElement>(root, "trigger");
    const input = queryPartIn<HTMLInputElement>(root, "input");

    trigger.click();
    await waitForChanges();
    await settle(30);
    expect(input).toHaveAttribute("aria-expanded", "true");

    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
    );
    await waitForChanges();
    expect(input).toHaveAttribute("aria-expanded", "false");
  });

  it("focuses the internal input", async () => {
    const { root, waitForChanges } = await render(<qui-combobox items={accounts} />);
    const input = queryPartIn<HTMLInputElement>(
      resolveHost<HTMLQuiComboboxElement>(root, "qui-combobox"),
      "input",
    );

    await resolveHost<HTMLQuiComboboxElement>(root, "qui-combobox").focusControl();
    await waitForChanges();

    expectFocusedDeep(input);
  });
});
