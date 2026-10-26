import { describe, expect, h, it, render } from "@stencil/vitest";

import { queryControl, queryPartIn, resolveHost } from "../../test-utils/component";
import { expectFocusedDeep } from "../../test-utils/interactions";

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
