import { describe, expect, h, it, render } from "@stencil/vitest";

import { expectLinked } from "../../test-utils/aria";
import { queryHost, queryPartIn } from "../../test-utils/component";
import { expectFocusedDeep, pressKey } from "../../test-utils/interactions";

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
