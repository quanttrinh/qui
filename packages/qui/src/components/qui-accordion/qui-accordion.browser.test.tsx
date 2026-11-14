import { describe, expect, getComponentSpies, h, it, render } from "@stencil/vitest";

import { expectLinked } from "../../../tests/test-utils/aria";
import { queryHost, queryPartIn } from "../../../tests/test-utils/component";
import { expectFocusedDeep, pressKey } from "../../../tests/test-utils/interactions";

interface AccordionItemParts {
  triggerHost: HTMLElement;
  trigger: HTMLButtonElement;
  contentHost: HTMLElement;
  content: HTMLDivElement;
}

function itemParts(item: Element): AccordionItemParts {
  const triggerHost = queryHost(item, "qui-accordion-trigger");
  const contentHost = queryHost(item, "qui-accordion-content");
  return {
    triggerHost,
    trigger: queryPartIn<HTMLButtonElement>(triggerHost, "trigger"),
    contentHost,
    content: queryPartIn<HTMLDivElement>(contentHost, "content"),
  };
}

function items(root: HTMLElement): AccordionItemParts[] {
  return [...root.querySelectorAll("qui-accordion-item")].map((item) => itemParts(item));
}

function expectItemLinked(item: AccordionItemParts): void {
  expectLinked(item.trigger, item.contentHost, "controls");
  expectLinked(item.content, item.triggerHost, "labelledby");
}

describe("qui-accordion", () => {
  it("expands an item and emits the new values", async () => {
    const { root, spyOnEvent, waitForChanges } = await render(
      <qui-accordion>
        <qui-accordion-item value="one">
          <qui-accordion-trigger>One</qui-accordion-trigger>
          <qui-accordion-content>One content</qui-accordion-content>
        </qui-accordion-item>
        <qui-accordion-item value="two">
          <qui-accordion-trigger>Two</qui-accordion-trigger>
          <qui-accordion-content>Two content</qui-accordion-content>
        </qui-accordion-item>
      </qui-accordion>,
    );
    const spy = spyOnEvent("valuechange");
    const parts = items(root);

    parts[1].trigger.click();
    await waitForChanges();

    expect(spy).toHaveReceivedEventDetail({ value: ["two"] });
    expect(parts[1].trigger).toHaveAttribute("aria-expanded", "true");
    expect(parts[1].content.inert).toBe(false);
    expect(parts[1].content).toHaveAttribute("data-state", "open");

    parts[0].trigger.click();
    await waitForChanges();
    expect(parts[0].trigger).toHaveAttribute("aria-expanded", "true");
    expect(parts[1].trigger).toHaveAttribute("aria-expanded", "false");
    expectItemLinked(parts[0]);
  });

  it("links triggers and content through element reflection", async () => {
    const { root, waitForChanges } = await render(
      <qui-accordion>
        <qui-accordion-item value="one">
          <qui-accordion-trigger>One</qui-accordion-trigger>
          <qui-accordion-content>One content</qui-accordion-content>
        </qui-accordion-item>
        <qui-accordion-item value="two">
          <qui-accordion-trigger>Two</qui-accordion-trigger>
          <qui-accordion-content>Two content</qui-accordion-content>
        </qui-accordion-item>
      </qui-accordion>,
    );

    await waitForChanges();

    for (const item of items(root)) {
      expectItemLinked(item);
    }
  });

  it("keeps multiple items open", async () => {
    const { root, waitForChanges } = await render(
      <qui-accordion multiple defaultValue={["one"]}>
        <qui-accordion-item value="one">
          <qui-accordion-trigger>One</qui-accordion-trigger>
          <qui-accordion-content>One content</qui-accordion-content>
        </qui-accordion-item>
        <qui-accordion-item value="two">
          <qui-accordion-trigger>Two</qui-accordion-trigger>
          <qui-accordion-content>Two content</qui-accordion-content>
        </qui-accordion-item>
      </qui-accordion>,
    );
    const parts = items(root);

    parts[1].trigger.click();
    await waitForChanges();

    expect(parts[0].trigger).toHaveAttribute("aria-expanded", "true");
    expect(parts[1].trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("collapses the active item when collapsible", async () => {
    const { root, waitForChanges } = await render(
      <qui-accordion collapsible defaultValue={["one"]}>
        <qui-accordion-item value="one">
          <qui-accordion-trigger>One</qui-accordion-trigger>
          <qui-accordion-content>One content</qui-accordion-content>
        </qui-accordion-item>
      </qui-accordion>,
    );
    const parts = items(root);

    parts[0].trigger.click();
    await waitForChanges();

    expect(parts[0].trigger).toHaveAttribute("aria-expanded", "false");
    expect(parts[0].content.inert).toBe(true);
  });

  it("ignores clicks on a disabled item", async () => {
    const { root, spyOnEvent, waitForChanges } = await render(
      <qui-accordion>
        <qui-accordion-item value="one">
          <qui-accordion-trigger>One</qui-accordion-trigger>
          <qui-accordion-content>One content</qui-accordion-content>
        </qui-accordion-item>
        <qui-accordion-item value="two" disabled>
          <qui-accordion-trigger>Two</qui-accordion-trigger>
          <qui-accordion-content>Two content</qui-accordion-content>
        </qui-accordion-item>
      </qui-accordion>,
    );
    const spy = spyOnEvent("valuechange");
    const parts = items(root);

    await waitForChanges();

    expect(parts[1].trigger.disabled).toBe(true);
    expect(parts[1].content).toHaveAttribute("data-disabled");

    parts[1].trigger.click();
    await waitForChanges();

    expect(spy).toHaveReceivedEventTimes(0);
    expect(parts[1].trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("updates a trigger when its item becomes disabled", async () => {
    const { root, waitForChanges } = await render(
      <qui-accordion>
        <qui-accordion-item value="one">
          <qui-accordion-trigger>One</qui-accordion-trigger>
          <qui-accordion-content>One content</qui-accordion-content>
        </qui-accordion-item>
      </qui-accordion>,
    );
    const item = root.querySelector("qui-accordion-item") as HTMLElement & { disabled: boolean };
    const [{ trigger }] = items(root);

    expect(trigger.disabled).toBe(false);

    item.disabled = true;
    await waitForChanges();

    expect(trigger.disabled).toBe(true);
  });

  it("moves focus with arrow, Home, and End keyboard navigation", async () => {
    const { root, waitForChanges } = await render(
      <qui-accordion>
        <qui-accordion-item value="one">
          <qui-accordion-trigger>One</qui-accordion-trigger>
          <qui-accordion-content>One content</qui-accordion-content>
        </qui-accordion-item>
        <qui-accordion-item value="two">
          <qui-accordion-trigger>Two</qui-accordion-trigger>
          <qui-accordion-content>Two content</qui-accordion-content>
        </qui-accordion-item>
        <qui-accordion-item value="three">
          <qui-accordion-trigger>Three</qui-accordion-trigger>
          <qui-accordion-content>Three content</qui-accordion-content>
        </qui-accordion-item>
      </qui-accordion>,
    );
    const buttons = items(root).map((item) => item.trigger);

    buttons[0].focus();
    pressKey(buttons[0], "ArrowDown");
    await waitForChanges();
    expectFocusedDeep(buttons[1]);

    pressKey(buttons[1], "End");
    await waitForChanges();
    expectFocusedDeep(buttons[2]);

    pressKey(buttons[2], "Home");
    await waitForChanges();
    expectFocusedDeep(buttons[0]);
  });
});

describe("qui-accordion prop updates", () => {
  it("updates children when a context-only prop changes", async () => {
    const { root, waitForChanges } = await render(
      <qui-accordion>
        <qui-accordion-item value="one">
          <qui-accordion-trigger>One</qui-accordion-trigger>
          <qui-accordion-content>One content</qui-accordion-content>
        </qui-accordion-item>
        <qui-accordion-item value="two">
          <qui-accordion-trigger>Two</qui-accordion-trigger>
          <qui-accordion-content>Two content</qui-accordion-content>
        </qui-accordion-item>
      </qui-accordion>,
    );
    const host = root as HTMLElement & { multiple: boolean };
    const parts = items(root);

    host.multiple = true;
    await waitForChanges();
    parts[0].trigger.click();
    await waitForChanges();
    parts[1].trigger.click();
    await waitForChanges();

    expect(parts[0].trigger).toHaveAttribute("aria-expanded", "true");
    expect(parts[1].trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("re-renders the root when a template prop changes", async () => {
    const { root, setProps } = await render(
      <qui-accordion>
        <qui-accordion-item value="one">
          <qui-accordion-trigger>One</qui-accordion-trigger>
          <qui-accordion-content>One content</qui-accordion-content>
        </qui-accordion-item>
      </qui-accordion>,
    );
    const part = queryPartIn(root, "root");

    expect(part.dataset.orientation).toBe("vertical");

    await setProps({ orientation: "horizontal" });

    expect(part.dataset.orientation).toBe("horizontal");
  });
});

describe("qui-accordion render scoping", () => {
  it("skips the root and unaffected items when one item toggles", async () => {
    const { root, spies, waitForChanges } = await render(
      <qui-accordion>
        <qui-accordion-item value="one">
          <qui-accordion-trigger>One</qui-accordion-trigger>
          <qui-accordion-content>One content</qui-accordion-content>
        </qui-accordion-item>
        <qui-accordion-item value="two">
          <qui-accordion-trigger>Two</qui-accordion-trigger>
          <qui-accordion-content>Two content</qui-accordion-content>
        </qui-accordion-item>
        <qui-accordion-item value="three">
          <qui-accordion-trigger>Three</qui-accordion-trigger>
          <qui-accordion-content>Three content</qui-accordion-content>
        </qui-accordion-item>
      </qui-accordion>,
      {
        spyOn: {
          components: {
            "qui-accordion": { lifecycle: ["render"] },
            "qui-accordion-item": { lifecycle: ["render"] },
          },
        },
      },
    );
    const parts = items(root);
    const rootRenders = (): number => spies?.lifecycle.render?.mock.calls.length ?? 0;
    const itemRenders = (): number[] =>
      [...root.querySelectorAll("qui-accordion-item")].map(
        (item) => getComponentSpies(item)?.lifecycle.render?.mock.calls.length ?? 0,
      );
    const baselineRoot = rootRenders();
    const baselineItems = itemRenders();

    parts[1].trigger.click();
    await waitForChanges();

    expect(rootRenders()).toBe(baselineRoot);
    const deltas = itemRenders().map((count, index) => count - (baselineItems[index] ?? 0));
    expect(deltas[0]).toBe(0);
    expect(deltas[1]).toBeGreaterThan(0);
    expect(deltas[2]).toBe(0);
  });
});

describe("qui-accordion colors", () => {
  it("applies container, trigger, indicator, and content color custom properties", async () => {
    const { root } = await render(
      <qui-accordion defaultValue={["one"]}>
        <qui-accordion-item value="one">
          <qui-accordion-trigger>One</qui-accordion-trigger>
          <qui-accordion-content>Content</qui-accordion-content>
        </qui-accordion-item>
      </qui-accordion>,
    );
    const accordionHost = root;
    const triggerHost = queryHost(root, "qui-accordion-trigger");
    const contentHost = queryHost(root, "qui-accordion-content");
    const container = queryPartIn(accordionHost, "root");
    const trigger = queryPartIn<HTMLButtonElement>(triggerHost, "trigger");
    const indicator = queryPartIn(triggerHost, "indicator");
    const content = queryPartIn(contentHost, "content");
    trigger.style.transition = "none";

    accordionHost.style.setProperty("--qui-accordion-container-color", "rgb(1, 2, 3)");
    accordionHost.style.setProperty("--qui-accordion-border-color", "rgb(4, 5, 6)");
    accordionHost.style.setProperty("--qui-accordion-trigger-color", "rgb(7, 8, 9)");
    accordionHost.style.setProperty("--qui-accordion-indicator-color", "rgb(10, 11, 12)");
    accordionHost.style.setProperty("--qui-accordion-content-text-color", "rgb(13, 14, 15)");

    expect(getComputedStyle(container).backgroundColor).toBe("rgb(1, 2, 3)");
    expect(getComputedStyle(container).borderTopColor).toBe("rgb(4, 5, 6)");
    expect(getComputedStyle(trigger).color).toBe("rgb(7, 8, 9)");
    expect(getComputedStyle(indicator).color).toBe("rgb(10, 11, 12)");
    expect(getComputedStyle(content).color).toBe("rgb(13, 14, 15)");
  });
});
