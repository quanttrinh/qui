import { describe, expect, h, it, render } from "@stencil/vitest";

import { queryControl, queryPartIn, resolveHost } from "../../../tests/test-utils/component";
import { expectFocusedDeep } from "../../../tests/test-utils/interactions";

describe("qui-switch", () => {
  it("toggles and emits a boolean", async () => {
    const { root, spyOnEvent, waitForChanges } = await render(
      <qui-switch value="on">Enable</qui-switch>,
    );
    const spy = spyOnEvent("checkedchange");
    const host = resolveHost<HTMLQuiSwitchElement>(root, "qui-switch");
    const input = queryControl<HTMLInputElement>(host, "input");

    input.click();
    await waitForChanges();

    expect(spy).toHaveReceivedEventDetail({ checked: true });
    expect(queryPartIn(host, "root")).toHaveAttribute("data-state", "checked");
    expect(input.checked).toBe(true);
  });

  it("returns the live checked state for uncontrolled edits", async () => {
    const { root, waitForChanges } = await render(<qui-switch value="on">Enable</qui-switch>);
    const host = resolveHost<HTMLQuiSwitchElement>(root, "qui-switch");
    const input = queryControl<HTMLInputElement>(host, "input");

    await expect(host.getChecked()).resolves.toBe(false);

    input.click();
    await waitForChanges();

    await expect(host.getChecked()).resolves.toBe(true);
  });

  it("does not toggle when read-only", async () => {
    const { root, setProps, spyOnEvent, waitForChanges } = await render(
      <qui-switch readOnly>Enable</qui-switch>,
    );
    const spy = spyOnEvent("checkedchange");
    const host = resolveHost<HTMLQuiSwitchElement>(root, "qui-switch");
    const input = queryControl<HTMLInputElement>(host, "input");

    input.click();
    await waitForChanges();

    expect(spy).toHaveReceivedEventTimes(0);
    expect(queryPartIn(host, "root")).toHaveAttribute("data-state", "unchecked");

    await setProps({ readOnly: false });
    input.click();
    await waitForChanges();
    expect(spy).toHaveReceivedEventTimes(1);
  });

  it("focuses the internal native input", async () => {
    const { root, waitForChanges } = await render(<qui-switch>Enable</qui-switch>);
    const host = resolveHost<HTMLQuiSwitchElement>(root, "qui-switch");
    const input = queryControl<HTMLInputElement>(host, "input");

    await host.focusControl();
    await waitForChanges();

    expectFocusedDeep(input);
  });
});

describe("qui-switch colors", () => {
  it("applies track, thumb, and label color custom properties", async () => {
    const { root } = await render(<qui-switch checked>Wi-Fi</qui-switch>);
    const host = resolveHost<HTMLQuiSwitchElement>(root, "qui-switch");
    const control = queryPartIn(host, "control");
    const thumb = queryPartIn(host, "thumb");
    const label = queryPartIn(host, "label");
    control.style.setProperty("transition", "none", "important");
    thumb.style.setProperty("transition", "none", "important");

    host.style.setProperty("--qui-switch-checked-track-color", "rgb(1, 2, 3)");
    host.style.setProperty("--qui-switch-checked-thumb-color", "rgb(4, 5, 6)");
    host.style.setProperty("--qui-switch-label-color", "rgb(7, 8, 9)");

    expect(getComputedStyle(control).backgroundColor).toBe("rgb(1, 2, 3)");
    expect(getComputedStyle(thumb).backgroundColor).toBe("rgb(4, 5, 6)");
    expect(getComputedStyle(label).color).toBe("rgb(7, 8, 9)");
  });
});
