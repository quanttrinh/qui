import { describe, expect, h, it, render } from "@stencil/vitest";

import { queryPartIn, resolveHost } from "../../../tests/test-utils/component";
import { settle } from "../../../tests/test-utils/dom-ready";
import { expectFocusedDeep, pointerDown } from "../../../tests/test-utils/interactions";
import { queryParts } from "../../../tests/test-utils/shadow";
import { type OptionItem } from "../shared/helpers/option";

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
    const host = resolveHost<HTMLQuiSelectElement>(root, "qui-select");
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
    await expect(host.getValue()).resolves.toEqual(["account-2"]);
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

describe("qui-select field colors", () => {
  it("applies field color custom properties to the trigger", async () => {
    const { root, waitForChanges } = await render(
      <qui-select items={accounts} value={["account-1"]} />,
    );
    const host = resolveHost<HTMLQuiSelectElement>(root, "qui-select");
    const trigger = queryPartIn<HTMLButtonElement>(host, "trigger");
    trigger.style.setProperty("transition", "none", "important");

    host.style.setProperty("--qui-field-container-color", "rgb(1, 2, 3)");
    host.style.setProperty("--qui-field-outline-color", "rgb(4, 5, 6)");
    host.style.setProperty("--qui-field-outline-hover-color", "rgb(4, 5, 6)");
    host.style.setProperty("--qui-field-text-color", "rgb(7, 8, 9)");
    host.style.setProperty("--qui-field-error-color", "rgb(10, 11, 12)");
    await waitForChanges();

    expect(getComputedStyle(trigger).backgroundColor).toBe("rgb(1, 2, 3)");
    expect(getComputedStyle(trigger).borderTopColor).toBe("rgb(4, 5, 6)");
    expect(getComputedStyle(trigger).color).toBe("rgb(7, 8, 9)");

    host.style.setProperty("--qui-field-outline-hover-color", "rgb(10, 11, 12)");
    host.invalid = true;
    await waitForChanges();
    expect(getComputedStyle(trigger).borderTopColor).toBe("rgb(10, 11, 12)");
  });

  it("applies the placeholder color when empty", async () => {
    const { root } = await render(<qui-select items={accounts} placeholder="Pick" />);
    const host = resolveHost<HTMLQuiSelectElement>(root, "qui-select");
    const trigger = queryPartIn<HTMLButtonElement>(host, "trigger");

    host.style.setProperty("--qui-field-placeholder-color", "rgb(13, 14, 15)");

    expect(getComputedStyle(trigger).color).toBe("rgb(13, 14, 15)");
  });
});

function setOptionListColors(host: HTMLElement): void {
  host.style.setProperty("--qui-option-list-container-color", "rgb(1, 2, 3)");
  host.style.setProperty("--qui-option-list-border-color", "rgb(4, 5, 6)");
  host.style.setProperty("--qui-option-list-option-color", "rgb(7, 8, 9)");
  host.style.setProperty("--qui-option-list-option-selected-color", "rgb(10, 11, 12)");
  host.style.setProperty("--qui-option-list-option-selected-text-color", "rgb(13, 14, 15)");
  host.style.setProperty("--qui-option-list-indicator-color", "rgb(16, 17, 18)");
}

describe("qui-select option colors", () => {
  it("applies option list color custom properties", async () => {
    const { root, waitForChanges } = await render(
      <qui-select items={accounts} value={["account-1"]} />,
    );
    const host = resolveHost<HTMLQuiSelectElement>(root, "qui-select");
    const trigger = queryPartIn<HTMLButtonElement>(host, "trigger");

    trigger.click();
    await waitForChanges();
    await settle(50);

    const listbox = queryPartIn(root, "listbox");
    const selected = queryParts<HTMLElement>(root, "option").find(
      (option) => option.dataset.value === "account-1",
    );
    if (selected === undefined) {
      throw new Error("Expected the selected option");
    }
    const indicator = selected.querySelector<HTMLElement>('[part~="option-indicator"]');
    if (indicator === null) {
      throw new Error("Expected the option indicator");
    }

    setOptionListColors(host);

    expect(getComputedStyle(listbox).backgroundColor).toBe("rgb(1, 2, 3)");
    expect(getComputedStyle(listbox).borderTopColor).toBe("rgb(4, 5, 6)");
    expect(getComputedStyle(selected).backgroundColor).toBe("rgb(10, 11, 12)");
    expect(getComputedStyle(selected).color).toBe("rgb(13, 14, 15)");
    expect(getComputedStyle(indicator).color).toBe("rgb(16, 17, 18)");
  });

  it("applies the empty-state color", async () => {
    const { root, waitForChanges } = await render(<qui-select items={[]} open />);
    await waitForChanges();
    await settle(50);

    const host = resolveHost<HTMLQuiSelectElement>(root, "qui-select");
    const empty = queryPartIn(root, "empty");
    host.style.setProperty("--qui-option-list-empty-color", "rgb(19, 20, 21)");

    expect(getComputedStyle(empty).color).toBe("rgb(19, 20, 21)");
  });
});
