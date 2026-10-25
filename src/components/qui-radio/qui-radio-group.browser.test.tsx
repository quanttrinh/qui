import { describe, expect, h, it, render } from "@stencil/vitest";

function queryInput(item: Element): HTMLInputElement {
  const input = item.querySelector("input");
  if (!(input instanceof HTMLInputElement)) {
    throw new TypeError("Expected a native radio input");
  }
  return input;
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
    const group = form.querySelector<HTMLQuiRadioGroupElement>("qui-radio-group");
    if (group === null) {
      throw new TypeError("Expected a radio group");
    }
    const spy = spyOnEvent("valuechange");
    group.setAttribute("name", "plan");

    queryInput(group.querySelectorAll("qui-radio")[0]).click();
    await waitForChanges();

    expect(spy).toHaveReceivedEventDetail({ value: "free" });
    expect(group.querySelectorAll("qui-radio")[0].querySelector("[part=root]")).toHaveAttribute(
      "data-state",
      "checked",
    );
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

    queryInput(root.querySelectorAll("qui-radio")[0]).click();
    await waitForChanges();

    expect(spy).toHaveReceivedEventDetail({ value: "free" });
    expect(root.querySelectorAll("qui-radio")[1].querySelector("[part=root]")).toHaveAttribute(
      "data-state",
      "checked",
    );

    await setProps({ value: "free" });
    expect(root.querySelectorAll("qui-radio")[0].querySelector("[part=root]")).toHaveAttribute(
      "data-state",
      "checked",
    );
    expect(queryInput(root.querySelectorAll("qui-radio")[1]).checked).toBe(false);
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
    const group = form.querySelector<HTMLQuiRadioGroupElement>("qui-radio-group");
    if (group === null) {
      throw new TypeError("Expected a radio group");
    }

    group.setAttribute("name", "plan");
    group.disabled = true;
    await waitForChanges();

    expect(group.querySelector("[part=root]")).toHaveAttribute("data-disabled");
    expect(new FormData(form).get("plan")).toBeNull();
    for (const item of group.querySelectorAll("qui-radio")) {
      expect(queryInput(item).disabled).toBe(true);
    }
  });
});
