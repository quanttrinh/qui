import { describe, expect, getComponentSpies, h, it, render } from "@stencil/vitest";

import {
  queryControl,
  queryHost,
  queryPartIn,
  resolveForm,
  resolveHost,
} from "../../../tests/test-utils/component";
import { expectFocusedDeep } from "../../../tests/test-utils/interactions";
import { shadowOf } from "../../../tests/test-utils/shadow";

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

    expect(group.getAttribute("name")).toBe("plan");

    const items = radioItems(root);
    queryControl<HTMLInputElement>(items[0], "input").click();
    await waitForChanges();

    expect(spy).toHaveReceivedEventDetail({ value: "free" });
    expect(queryPartIn(items[0], "root")).toHaveAttribute("data-state", "checked");
    expect(new FormData(form).get("plan")).toBe("free");

    group.name = "backupPlan";
    await waitForChanges();

    expect(group.getAttribute("name")).toBe("backupPlan");
    expect(new FormData(form).get("backupPlan")).toBe("free");

    group.name = undefined;
    await waitForChanges();

    expect(group.hasAttribute("name")).toBe(false);
    expect(new FormData(form).get("backupPlan")).toBeNull();
  });

  it("returns the live value for uncontrolled selection", async () => {
    const { root, waitForChanges } = await render(
      <qui-radio-group name="plan" defaultValue="pro">
        <qui-radio value="free">Free</qui-radio>
        <qui-radio value="pro">Pro</qui-radio>
      </qui-radio-group>,
    );
    const group = resolveHost<HTMLQuiRadioGroupElement>(root, "qui-radio-group");

    await expect(group.getValue()).resolves.toBe("pro");

    queryControl<HTMLInputElement>(radioItems(root)[0], "input").click();
    await waitForChanges();

    await expect(group.getValue()).resolves.toBe("free");
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
});

describe("qui-radio-group focus and validation", () => {
  it("focuses the first enabled radio from constraint validation", async () => {
    const { root, waitForChanges } = await render(
      <form>
        <qui-radio-group name="plan" required>
          <qui-radio value="free">Free</qui-radio>
          <qui-radio value="pro">Pro</qui-radio>
        </qui-radio-group>
      </form>,
    );
    await waitForChanges();

    const form = resolveForm(root);
    const input = queryControl<HTMLInputElement>(radioItems(root)[0], "input");

    expect(form.reportValidity()).toBe(false);
    expectFocusedDeep(input);
  });

  it("focuses the selected radio from constraint validation", async () => {
    const { root, waitForChanges } = await render(
      <form>
        <qui-radio-group name="plan" value="pro" invalid>
          <qui-radio value="free">Free</qui-radio>
          <qui-radio value="pro">Pro</qui-radio>
        </qui-radio-group>
      </form>,
    );
    await waitForChanges();

    const form = resolveForm(root);
    const input = queryControl<HTMLInputElement>(radioItems(root)[1], "input");

    expect(form.reportValidity()).toBe(false);
    expectFocusedDeep(input);
  });

  it("skips a disabled first radio during constraint validation", async () => {
    const { root, waitForChanges } = await render(
      <form>
        <qui-radio-group name="plan" required>
          <qui-radio value="free" disabled>
            Free
          </qui-radio>
          <qui-radio value="pro">Pro</qui-radio>
        </qui-radio-group>
      </form>,
    );
    await waitForChanges();

    const form = resolveForm(root);
    const input = queryControl<HTMLInputElement>(radioItems(root)[1], "input");

    expect(form.reportValidity()).toBe(false);
    expectFocusedDeep(input);
  });

  it("falls back to the focusable group root when no radios are registered", async () => {
    const { root, waitForChanges } = await render(
      <form>
        <qui-radio-group name="plan" required />
      </form>,
    );
    await waitForChanges();

    const form = resolveForm(root);
    const group = resolveHost<HTMLQuiRadioGroupElement>(root, "qui-radio-group");

    expect(form.reportValidity()).toBe(false);
    expectFocusedDeep(queryPartIn(group, "root"));
  });
});

describe("qui-radio-group dynamic validation", () => {
  it("refreshes the validation anchor when a radio is added after mount", async () => {
    const { root, waitForChanges } = await render(
      <form>
        <qui-radio-group name="plan" required>
          <qui-radio value="free" disabled>
            Free
          </qui-radio>
        </qui-radio-group>
      </form>,
    );
    await waitForChanges();

    const form = resolveForm(root);
    const group = resolveHost<HTMLQuiRadioGroupElement>(root, "qui-radio-group");

    expect(form.reportValidity()).toBe(false);
    expectFocusedDeep(queryPartIn(group, "root"));

    const radio = document.createElement("qui-radio");
    radio.setAttribute("value", "pro");
    radio.textContent = "Pro";
    group.append(radio);
    await waitForChanges();

    expect(form.reportValidity()).toBe(false);
    expectFocusedDeep(queryControl<HTMLInputElement>(radio, "input"));
  });

  it("refreshes the validation anchor when the anchored radio is removed", async () => {
    const { root, waitForChanges } = await render(
      <form>
        <qui-radio-group name="plan" required>
          <qui-radio value="free">Free</qui-radio>
          <qui-radio value="pro">Pro</qui-radio>
        </qui-radio-group>
      </form>,
    );
    await waitForChanges();

    const form = resolveForm(root);

    expect(form.reportValidity()).toBe(false);
    expectFocusedDeep(queryControl<HTMLInputElement>(radioItems(root)[0], "input"));

    radioItems(root)[0].remove();
    await waitForChanges();

    expect(form.reportValidity()).toBe(false);
    expectFocusedDeep(queryControl<HTMLInputElement>(radioItems(root)[0], "input"));
  });

  it("refreshes the validation anchor when the anchored radio becomes disabled", async () => {
    const { root, waitForChanges } = await render(
      <form>
        <qui-radio-group name="plan" required>
          <qui-radio value="free">Free</qui-radio>
          <qui-radio value="pro">Pro</qui-radio>
        </qui-radio-group>
      </form>,
    );
    await waitForChanges();

    const form = resolveForm(root);

    expect(form.reportValidity()).toBe(false);
    expectFocusedDeep(queryControl<HTMLInputElement>(radioItems(root)[0], "input"));

    radioItems(root)[0].setAttribute("disabled", "");
    await waitForChanges();

    expect(form.reportValidity()).toBe(false);
    expectFocusedDeep(queryControl<HTMLInputElement>(radioItems(root)[1], "input"));
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

describe("qui-radio-group render scoping", () => {
  it("skips the root and unaffected radios when the selection changes", async () => {
    const { root, spies, waitForChanges } = await render(
      <qui-radio-group name="plan" defaultValue="pro">
        <qui-radio value="free">Free</qui-radio>
        <qui-radio value="pro">Pro</qui-radio>
        <qui-radio value="business">Business</qui-radio>
      </qui-radio-group>,
      {
        spyOn: {
          components: {
            "qui-radio-group": { lifecycle: ["render"] },
            "qui-radio": { lifecycle: ["render"] },
          },
        },
      },
    );
    const items = radioItems(root);
    const rootRenders = (): number => spies?.lifecycle.render?.mock.calls.length ?? 0;
    const radioRenders = (): number[] =>
      items.map((item) => getComponentSpies(item)?.lifecycle.render?.mock.calls.length ?? 0);
    const baselineRoot = rootRenders();
    const baselineRadios = radioRenders();

    queryControl<HTMLInputElement>(items[0], "input").click();
    await waitForChanges();

    expect(rootRenders()).toBe(baselineRoot);
    const deltas = radioRenders().map((count, index) => count - (baselineRadios[index] ?? 0));
    expect(deltas[0]).toBeGreaterThan(0);
    expect(deltas[1]).toBeGreaterThan(0);
    expect(deltas[2]).toBe(0);
  });

  it("re-renders every radio when group validation state changes", async () => {
    const { root, setProps, waitForChanges } = await render(
      <qui-radio-group name="plan" defaultValue="pro">
        <qui-radio value="free">Free</qui-radio>
        <qui-radio value="pro">Pro</qui-radio>
        <qui-radio value="business">Business</qui-radio>
      </qui-radio-group>,
      {
        spyOn: {
          components: {
            "qui-radio": { lifecycle: ["render"] },
          },
        },
      },
    );
    const items = radioItems(root);
    const baseline = items.map(
      (item) => getComponentSpies(item)?.lifecycle.render?.mock.calls.length ?? 0,
    );

    await setProps({ disabled: true });
    await setProps({ invalid: true });
    await waitForChanges();

    const deltas = items.map(
      (item, index) =>
        (getComponentSpies(item)?.lifecycle.render?.mock.calls.length ?? 0) -
        (baseline[index] ?? 0),
    );
    expect(deltas.every((delta) => delta > 0)).toBe(true);
  });

  it("re-renders only the focused radio when focus moves", async () => {
    const { root, waitForChanges } = await render(
      <qui-radio-group name="plan" defaultValue="pro">
        <qui-radio value="free">Free</qui-radio>
        <qui-radio value="pro">Pro</qui-radio>
        <qui-radio value="business">Business</qui-radio>
      </qui-radio-group>,
      {
        spyOn: {
          components: {
            "qui-radio": { lifecycle: ["render"] },
          },
        },
      },
    );
    const items = radioItems(root);
    const baseline = items.map(
      (item) => getComponentSpies(item)?.lifecycle.render?.mock.calls.length ?? 0,
    );

    await (items[2] as HTMLQuiRadioElement).focusControl();
    await waitForChanges();

    const deltas = items.map(
      (item, index) =>
        (getComponentSpies(item)?.lifecycle.render?.mock.calls.length ?? 0) -
        (baseline[index] ?? 0),
    );
    expect(deltas[0]).toBe(0);
    expect(deltas[1]).toBe(0);
    expect(deltas[2]).toBeGreaterThan(0);
  });

  it("re-renders the root when a template prop changes", async () => {
    const { root, setProps, spies } = await render(
      <qui-radio-group name="plan" defaultValue="pro">
        <qui-radio value="free">Free</qui-radio>
        <qui-radio value="pro">Pro</qui-radio>
      </qui-radio-group>,
      {
        spyOn: {
          components: {
            "qui-radio-group": { lifecycle: ["render"] },
          },
        },
      },
    );
    const part = queryPartIn(root, "root");
    const rootRenders = (): number => spies?.lifecycle.render?.mock.calls.length ?? 0;
    const baseline = rootRenders();

    expect(part.dataset.orientation).toBe("vertical");

    await setProps({ orientation: "horizontal" });

    expect(rootRenders()).toBeGreaterThan(baseline);
    expect(part.dataset.orientation).toBe("horizontal");
  });

  it("skips the root while reflecting value and name changes", async () => {
    const { root, spies, waitForChanges } = await render(
      <form>
        <qui-radio-group name="plan" defaultValue="pro">
          <qui-radio value="free">Free</qui-radio>
          <qui-radio value="pro">Pro</qui-radio>
        </qui-radio-group>
      </form>,
      {
        spyOn: {
          components: {
            "qui-radio-group": { lifecycle: ["render"] },
          },
        },
      },
    );
    const group = resolveHost<HTMLQuiRadioGroupElement>(root, "qui-radio-group");
    const form = root as HTMLFormElement;
    const rootRenders = (): number => spies?.lifecycle.render?.mock.calls.length ?? 0;
    const baseline = rootRenders();

    group.value = "free";
    group.name = "billing";
    await waitForChanges();

    expect(rootRenders()).toBe(baseline);
    expect(group.getAttribute("name")).toBe("billing");
    expect(new FormData(form).get("billing")).toBe("free");

    group.name = undefined;
    await waitForChanges();

    expect(rootRenders()).toBe(baseline);
    expect(group.hasAttribute("name")).toBe(false);
    expect(new FormData(form).get("billing")).toBeNull();
  });
});

describe("qui-radio colors", () => {
  it("applies checked, outline, and label color custom properties", async () => {
    const { root } = await render(
      <qui-radio-group value="one">
        <qui-radio value="one">One</qui-radio>
      </qui-radio-group>,
    );
    const radioHost = queryHost(root, "qui-radio");
    const control = queryPartIn(radioHost, "control");
    const label = queryPartIn(radioHost, "label");
    control.style.setProperty("transition", "none", "important");

    root.style.setProperty("--qui-radio-checked-color", "rgb(1, 2, 3)");
    root.style.setProperty("--qui-radio-label-color", "rgb(4, 5, 6)");
    root.style.setProperty("--qui-radio-outline-color", "rgb(7, 8, 9)");

    expect(getComputedStyle(control).borderTopColor).toBe("rgb(1, 2, 3)");
    expect(getComputedStyle(label).color).toBe("rgb(4, 5, 6)");
  });

  it("applies the unchecked outline color", async () => {
    const { root } = await render(
      <qui-radio-group>
        <qui-radio value="one">One</qui-radio>
      </qui-radio-group>,
    );
    const control = queryPartIn(queryHost(root, "qui-radio"), "control");
    control.style.setProperty("transition", "none", "important");

    root.style.setProperty("--qui-radio-outline-color", "rgb(20, 21, 22)");

    expect(getComputedStyle(control).borderTopColor).toBe("rgb(20, 21, 22)");
  });
});
