import { describe, expect, h, it, render } from "@stencil/vitest";

import { expectLinked } from "../../test-utils/aria";
import { queryHost, queryPartIn } from "../../test-utils/component";
import { nextFrame } from "../../test-utils/dom-ready";
import { expectFocusedDeep, pressKey } from "../../test-utils/interactions";

interface TabParts {
  triggerHost: HTMLElement;
  trigger: HTMLButtonElement;
  panelHost: HTMLElement;
  panel: HTMLDivElement;
}

function readValue(host: Element): string | undefined {
  const value: unknown = Reflect.get(host, "value");
  return typeof value === "string" ? value : undefined;
}

function tabParts(root: HTMLElement, triggerHost: HTMLElement): TabParts {
  const typedTriggerHost = triggerHost;
  const value = readValue(typedTriggerHost);
  const panelHost = [...root.querySelectorAll("qui-tab-panel")].find(
    (panel) => readValue(panel) === value,
  );
  if (panelHost === undefined) {
    throw new TypeError("Expected a matching tab panel host");
  }
  return {
    triggerHost: typedTriggerHost,
    trigger: queryPartIn<HTMLButtonElement>(typedTriggerHost, "trigger"),
    panelHost,
    panel: queryPartIn<HTMLDivElement>(panelHost, "panel"),
  };
}

function tabs(root: HTMLElement): TabParts[] {
  return [...root.querySelectorAll<HTMLElement>("qui-tab-trigger")].map((trigger) =>
    tabParts(root, trigger),
  );
}

function expectTabLinked(tab: TabParts): void {
  expectLinked(tab.trigger, tab.panelHost, "controls");
  expectLinked(tab.panel, tab.triggerHost, "labelledby");
}

// oxlint-disable-next-line eslint/max-lines-per-function -- Integration-style browser coverage.
describe("qui-tabs", () => {
  it("selects a tab and shows the matching panel", async () => {
    const { root, spyOnEvent, waitForChanges } = await render(
      <qui-tabs defaultValue="one">
        <qui-tab-list>
          <qui-tab-trigger value="one">One</qui-tab-trigger>
          <qui-tab-trigger value="two">Two</qui-tab-trigger>
        </qui-tab-list>
        <qui-tab-panel value="one">One panel</qui-tab-panel>
        <qui-tab-panel value="two">Two panel</qui-tab-panel>
      </qui-tabs>,
    );
    const spy = spyOnEvent("valuechange");
    const parts = tabs(root);

    expect(getComputedStyle(parts[0].triggerHost).display).toBe("contents");
    expect(getComputedStyle(parts[0].trigger).flexGrow).toBe("1");
    expect(getComputedStyle(parts[0].panelHost).display).toBe("contents");

    parts[1].trigger.click();
    await waitForChanges();

    expect(spy).toHaveReceivedEventDetail({ value: "two" });
    expect(parts[1].trigger).toHaveAttribute("aria-selected", "true");
    expect(parts[0].panel.hidden).toBe(true);
    expect(parts[1].panel.hidden).toBe(false);
    expect(parts[1].panel).toHaveAttribute("data-selected");
  });

  it("does not add a panel tab stop when a nested control is focusable", async () => {
    const { root, waitForChanges } = await render(
      <qui-tabs defaultValue="one">
        <qui-tab-list>
          <qui-tab-trigger value="one">One</qui-tab-trigger>
        </qui-tab-list>
        <qui-tab-panel value="one">
          <qui-input />
        </qui-tab-panel>
      </qui-tabs>,
    );

    await waitForChanges();

    const panel = queryPartIn<HTMLDivElement>(queryHost(root, "qui-tab-panel"), "panel");
    expect(panel.hasAttribute("tabindex")).toBe(false);
  });

  it("keeps plain panels reachable with a tab stop", async () => {
    const { root, waitForChanges } = await render(
      <qui-tabs defaultValue="one">
        <qui-tab-list>
          <qui-tab-trigger value="one">One</qui-tab-trigger>
        </qui-tab-list>
        <qui-tab-panel value="one">Plain text</qui-tab-panel>
      </qui-tabs>,
    );

    await waitForChanges();

    const panel = queryPartIn<HTMLDivElement>(queryHost(root, "qui-tab-panel"), "panel");
    expect(panel).toHaveAttribute("tabindex", "0");
  });

  it("updates the panel tab stop when focusable content is added", async () => {
    const { root, waitForChanges } = await render(
      <qui-tabs defaultValue="one">
        <qui-tab-list>
          <qui-tab-trigger value="one">One</qui-tab-trigger>
        </qui-tab-list>
        <qui-tab-panel value="one">Plain text</qui-tab-panel>
      </qui-tabs>,
    );

    await waitForChanges();
    const panelHost = queryHost(root, "qui-tab-panel");
    const panel = queryPartIn<HTMLDivElement>(panelHost, "panel");
    expect(panel).toHaveAttribute("tabindex", "0");

    panelHost.append(document.createElement("qui-input"));
    await nextFrame();
    await waitForChanges();

    expect(panel.hasAttribute("tabindex")).toBe(false);
  });

  it("links triggers and panels through element reflection", async () => {
    const { root, waitForChanges } = await render(
      <qui-tabs defaultValue="one">
        <qui-tab-list>
          <qui-tab-trigger value="one">One</qui-tab-trigger>
          <qui-tab-trigger value="two">Two</qui-tab-trigger>
        </qui-tab-list>
        <qui-tab-panel value="one">One panel</qui-tab-panel>
        <qui-tab-panel value="two">Two panel</qui-tab-panel>
      </qui-tabs>,
    );

    await waitForChanges();

    for (const tab of tabs(root)) {
      expectTabLinked(tab);
    }
  });

  it("keeps a controlled value while emitting the next value", async () => {
    const { root, setProps, spyOnEvent, waitForChanges } = await render(
      <qui-tabs value="one">
        <qui-tab-list>
          <qui-tab-trigger value="one">One</qui-tab-trigger>
          <qui-tab-trigger value="two">Two</qui-tab-trigger>
        </qui-tab-list>
        <qui-tab-panel value="one">One panel</qui-tab-panel>
        <qui-tab-panel value="two">Two panel</qui-tab-panel>
      </qui-tabs>,
    );
    const spy = spyOnEvent("valuechange");
    const parts = tabs(root);

    parts[1].trigger.click();
    await waitForChanges();

    expect(spy).toHaveReceivedEventDetail({ value: "two" });
    expect(parts[0].trigger).toHaveAttribute("aria-selected", "true");

    await setProps({ value: "two" });
    expect(parts[1].trigger).toHaveAttribute("aria-selected", "true");
    expect(parts[1].panel.hidden).toBe(false);
  });

  it("does not select or focus a disabled tab", async () => {
    const { root, spyOnEvent, waitForChanges } = await render(
      <qui-tabs defaultValue="one">
        <qui-tab-list>
          <qui-tab-trigger value="one">One</qui-tab-trigger>
          <qui-tab-trigger value="two" disabled>
            Two
          </qui-tab-trigger>
          <qui-tab-trigger value="three">Three</qui-tab-trigger>
        </qui-tab-list>
        <qui-tab-panel value="one">One panel</qui-tab-panel>
        <qui-tab-panel value="two">Two panel</qui-tab-panel>
        <qui-tab-panel value="three">Three panel</qui-tab-panel>
      </qui-tabs>,
    );
    const spy = spyOnEvent("valuechange");
    const parts = tabs(root);

    expect(parts[1].trigger.disabled).toBe(true);
    expect(parts[1].trigger).toHaveAttribute("aria-disabled", "true");

    parts[1].trigger.click();
    await waitForChanges();

    expect(spy).toHaveReceivedEventTimes(0);
    expect(parts[1].trigger).toHaveAttribute("aria-selected", "false");
    expect(parts[1].panel.hidden).toBe(true);

    parts[0].trigger.focus();
    pressKey(parts[0].trigger, "ArrowRight");
    await waitForChanges();
    expectFocusedDeep(parts[2].trigger);
    expect(parts[2].trigger).toHaveAttribute("aria-selected", "true");
  });

  it("navigates with arrow, Home, and End keys", async () => {
    const { root, waitForChanges } = await render(
      <qui-tabs defaultValue="one">
        <qui-tab-list>
          <qui-tab-trigger value="one">One</qui-tab-trigger>
          <qui-tab-trigger value="two">Two</qui-tab-trigger>
          <qui-tab-trigger value="three">Three</qui-tab-trigger>
        </qui-tab-list>
        <qui-tab-panel value="one">One panel</qui-tab-panel>
        <qui-tab-panel value="two">Two panel</qui-tab-panel>
        <qui-tab-panel value="three">Three panel</qui-tab-panel>
      </qui-tabs>,
    );
    const buttons = tabs(root).map((tab) => tab.trigger);

    buttons[0].focus();
    pressKey(buttons[0], "ArrowRight");
    await waitForChanges();
    expectFocusedDeep(buttons[1]);
    expect(buttons[1]).toHaveAttribute("aria-selected", "true");

    pressKey(buttons[1], "End");
    await waitForChanges();
    expectFocusedDeep(buttons[2]);
    expect(buttons[2]).toHaveAttribute("aria-selected", "true");

    pressKey(buttons[2], "Home");
    await waitForChanges();
    expectFocusedDeep(buttons[0]);
    expect(buttons[0]).toHaveAttribute("aria-selected", "true");
  });
});
