import { describe, expect, h, it, render } from "@stencil/vitest";

import { queryPartIn, resolveForm, resolveHost } from "../../../tests/test-utils/component";
import { settle } from "../../../tests/test-utils/dom-ready";
import { expectFocusedDeep, pointerDown, typeInto } from "../../../tests/test-utils/interactions";
import { queryParts } from "../../../tests/test-utils/shadow";
import { type OptionItem } from "../shared/helpers/option";

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
    const host = resolveHost<HTMLQuiComboboxElement>(root, "qui-combobox");
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
    await expect(host.getValue()).resolves.toEqual(["account-2"]);
  });

  it("restores form state and clears an empty selection", async () => {
    const { root, waitForChanges } = await render(<qui-combobox items={accounts} />);
    const host = resolveHost<HTMLQuiComboboxElement>(root, "qui-combobox");
    const input = queryPartIn<HTMLInputElement>(root, "input");
    const restore = Reflect.get(host, "formStateRestoreCallback") as (state: string) => void;

    restore.call(host, JSON.stringify(["account-2"]));
    await waitForChanges();
    await expect(host.getValue()).resolves.toEqual(["account-2"]);
    expect(input.value).toBe("Account Two");

    restore.call(host, JSON.stringify([]));
    await waitForChanges();
    await expect(host.getValue()).resolves.toEqual([]);
  });

  it("reflects its form name and submits selected values", async () => {
    const { root, waitForChanges } = await render(
      <form>
        <qui-combobox name="account" items={accounts} />
      </form>,
    );
    const form = resolveForm(root);
    const host = resolveHost<HTMLQuiComboboxElement>(root, "qui-combobox");
    const input = queryPartIn<HTMLInputElement>(host, "input");

    input.click();
    await waitForChanges();
    typeInto(input, "Two");
    await waitForChanges();

    const option = queryParts<HTMLElement>(host, "option").find(
      (candidate) => candidate.dataset.value === "account-2",
    );
    if (option === undefined) {
      throw new Error("Expected account-2 to be rendered");
    }
    option.click();
    await waitForChanges();

    expect(host.getAttribute("name")).toBe("account");
    expect(new FormData(form).get("account")).toBe("account-2");

    host.name = "renamed";
    await waitForChanges();

    expect(host.getAttribute("name")).toBe("renamed");
    expect(new FormData(form).get("renamed")).toBe("account-2");
    expect(new FormData(form).get("account")).toBeNull();
  });

  it("updates the FormData key when the name changes in multiple mode", async () => {
    const { root, waitForChanges } = await render(
      <form>
        <qui-combobox name="first" multiple items={accounts} />
      </form>,
    );
    const form = resolveForm(root);
    const host = resolveHost<HTMLQuiComboboxElement>(root, "qui-combobox");
    const input = queryPartIn<HTMLInputElement>(host, "input");

    input.click();
    await waitForChanges();
    typeInto(input, "Two");
    await waitForChanges();

    const option = queryParts<HTMLElement>(host, "option").find(
      (candidate) => candidate.dataset.value === "account-2",
    );
    if (option === undefined) {
      throw new Error("Expected account-2 to be rendered");
    }
    option.click();
    await waitForChanges();

    expect(new FormData(form).get("first")).toBe("account-2");

    host.name = "second";
    await waitForChanges();

    expect(host.getAttribute("name")).toBe("second");
    expect(new FormData(form).get("second")).toBe("account-2");
    expect(new FormData(form).get("first")).toBeNull();

    host.name = undefined;
    await waitForChanges();

    expect(host.hasAttribute("name")).toBe(false);
    expect(new FormData(form).get("second")).toBeNull();
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

describe("qui-combobox field colors", () => {
  it("applies field color custom properties to the control and input", async () => {
    const { root, waitForChanges } = await render(
      <qui-combobox items={accounts} placeholder="Search" />,
    );
    const host = resolveHost<HTMLQuiComboboxElement>(root, "qui-combobox");
    const control = queryPartIn(host, "control");
    const input = queryPartIn<HTMLInputElement>(host, "input");
    control.style.setProperty("transition", "none", "important");

    host.style.setProperty("--qui-field-container-color", "rgb(1, 2, 3)");
    host.style.setProperty("--qui-field-outline-color", "rgb(4, 5, 6)");
    host.style.setProperty("--qui-field-outline-hover-color", "rgb(4, 5, 6)");
    host.style.setProperty("--qui-field-text-color", "rgb(7, 8, 9)");
    host.style.setProperty("--qui-field-placeholder-color", "rgb(10, 11, 12)");
    host.style.setProperty("--qui-field-error-color", "rgb(13, 14, 15)");
    await waitForChanges();

    expect(getComputedStyle(control).backgroundColor).toBe("rgb(1, 2, 3)");
    expect(getComputedStyle(control).borderTopColor).toBe("rgb(4, 5, 6)");
    expect(getComputedStyle(input).color).toBe("rgb(7, 8, 9)");
    expect(getComputedStyle(input, "::placeholder").color).toBe("rgb(10, 11, 12)");

    host.style.setProperty("--qui-field-outline-hover-color", "rgb(13, 14, 15)");
    host.invalid = true;
    await waitForChanges();
    expect(getComputedStyle(control).borderTopColor).toBe("rgb(13, 14, 15)");
  });
});
