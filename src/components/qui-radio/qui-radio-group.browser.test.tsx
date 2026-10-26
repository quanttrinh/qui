import { describe, expect, h, it, render } from "@stencil/vitest";

import { queryControl, queryPartIn, resolveHost } from "../../test-utils/component";
import { shadowOf } from "../../test-utils/shadow";

function radioItems(root: HTMLElement): HTMLElement[] {
  return [
    ...resolveHost<HTMLQuiRadioGroupElement>(root, "qui-radio-group").querySelectorAll<HTMLElement>(
      "qui-radio",
    ),
  ];
}

describe("qui-radio-group", () => {
  it("selects an uncontrolled item and submits it with the form", async () => {
    const { root, spyOnEvent, waitForChanges } = await render(
      <form>
        <qui-radio-group name="plan" defaultValue="pro">
          <qui-radio value="free">Free</qui-radio>
          <qui-radio value="pro">Pro</qui-radio>
        </qui-radio-group>
      </form>,
    );
    const form = root as HTMLFormElement;
    const group = resolveHost<HTMLQuiRadioGroupElement>(root, "qui-radio-group");
    const spy = spyOnEvent("valuechange");
    group.setAttribute("name", "plan");

    const items = radioItems(root);
    queryControl<HTMLInputElement>(items[0], "input").click();
    await waitForChanges();

    expect(spy).toHaveReceivedEventDetail({ value: "free" });
    expect(queryPartIn(items[0], "root")).toHaveAttribute("data-state", "checked");
    expect(new FormData(form).get("plan")).toBe("free");
  });

  it("keeps a controlled value while emitting the next value", async () => {
    const { root, setProps, spyOnEvent, waitForChanges } = await render(
      <qui-radio-group name="plan" value="pro">
        <qui-radio value="free">Free</qui-radio>
        <qui-radio value="pro">Pro</qui-radio>
      </qui-radio-group>,
    );
    const spy = spyOnEvent("valuechange");
    const items = radioItems(root);

    queryControl<HTMLInputElement>(items[0], "input").click();
    await waitForChanges();

    expect(spy).toHaveReceivedEventDetail({ value: "free" });
    expect(queryPartIn(items[1], "root")).toHaveAttribute("data-state", "checked");

    await setProps({ value: "free" });
    expect(queryPartIn(items[0], "root")).toHaveAttribute("data-state", "checked");
    expect(queryControl<HTMLInputElement>(items[1], "input").checked).toBe(false);
  });

  it("disables inputs and clears the form value when disabled", async () => {
    const { root, waitForChanges } = await render(
      <form>
        <qui-radio-group name="plan" value="pro">
          <qui-radio value="free">Free</qui-radio>
          <qui-radio value="pro">Pro</qui-radio>
        </qui-radio-group>
      </form>,
    );
    const form = root as HTMLFormElement;
    const group = resolveHost<HTMLQuiRadioGroupElement>(root, "qui-radio-group");

    group.setAttribute("name", "plan");
    group.disabled = true;
    await waitForChanges();

    expect(queryPartIn(group, "root")).toHaveAttribute("data-disabled");
    expect(new FormData(form).get("plan")).toBeNull();
    for (const item of radioItems(root)) {
      expect(queryControl<HTMLInputElement>(item, "input").disabled).toBe(true);
    }
  });

  it("focuses the selected radio input", async () => {
    const { root, waitForChanges } = await render(
      <qui-radio-group name="plan" value="pro">
        <qui-radio value="free">Free</qui-radio>
        <qui-radio value="pro">Pro</qui-radio>
      </qui-radio-group>,
    );
    const items = radioItems(root);

    await resolveHost<HTMLQuiRadioGroupElement>(root, "qui-radio-group").focusControl();
    await waitForChanges();

    expect(shadowOf(items[1]).activeElement).toBe(
      queryControl<HTMLInputElement>(items[1], "input"),
    );
  });

  it("falls back to the first enabled radio input", async () => {
    const { root, waitForChanges } = await render(
      <qui-radio-group name="plan">
        <qui-radio value="free" disabled>
          Free
        </qui-radio>
        <qui-radio value="pro">Pro</qui-radio>
      </qui-radio-group>,
    );
    const items = radioItems(root);

    await resolveHost<HTMLQuiRadioGroupElement>(root, "qui-radio-group").focusControl();
    await waitForChanges();

    expect(shadowOf(items[1]).activeElement).toBe(
      queryControl<HTMLInputElement>(items[1], "input"),
    );
  });

  it("focuses an individual radio's native input", async () => {
    const { root, waitForChanges } = await render(
      <qui-radio-group name="plan" value="pro">
        <qui-radio value="free">Free</qui-radio>
        <qui-radio value="pro">Pro</qui-radio>
      </qui-radio-group>,
    );
    const [radio] = radioItems(root);

    await (radio as HTMLQuiRadioElement).focusControl();
    await waitForChanges();

    expect(shadowOf(radio).activeElement).toBe(queryControl<HTMLInputElement>(radio, "input"));
  });
});
