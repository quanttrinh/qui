import { describe, expect, getComponentSpies, h, it, render } from "@stencil/vitest";

import { expectLinked } from "../../../tests/test-utils/aria";
import { queryHost, queryPartIn } from "../../../tests/test-utils/component";
import { nextFrame } from "../../../tests/test-utils/dom-ready";
import { expectFocusedDeep, pressKey } from "../../../tests/test-utils/interactions";

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

function renderCount(element: HTMLElement): number {
  return getComponentSpies(element)?.lifecycle.render?.mock.calls.length ?? 0;
}

function expectTabLinked(tab: TabParts): void {
  expectLinked(tab.trigger, tab.panelHost, "controls");
  expectLinked(tab.panel, tab.triggerHost, "labelledby");
}

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
});

describe("qui-tabs controlled behavior", () => {
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

  it("updates children when a context-only prop changes", async () => {
    const { root, setProps, spyOnEvent, waitForChanges } = await render(
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

    await setProps({ deselectable: true });
    parts[0].trigger.click();
    await waitForChanges();

    expect(spy).toHaveReceivedEventDetail({ value: undefined });
    expect(parts[0].trigger).toHaveAttribute("aria-selected", "false");
    expect(parts[0].panel.hidden).toBe(true);
  });

  it("re-renders the root when a template prop changes", async () => {
    const { root, setProps } = await render(
      <qui-tabs defaultValue="one">
        <qui-tab-list>
          <qui-tab-trigger value="one">One</qui-tab-trigger>
        </qui-tab-list>
        <qui-tab-panel value="one">One panel</qui-tab-panel>
      </qui-tabs>,
    );
    const part = queryPartIn(root, "root");

    expect(part.dataset.variant).toBe("primary");

    await setProps({ variant: "secondary" });

    expect(part.dataset.variant).toBe("secondary");
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

describe("qui-tabs render scoping", () => {
  it("skips unaffected triggers and panels when the selection changes", async () => {
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
      {
        spyOn: {
          components: {
            "qui-tab-trigger": { lifecycle: ["render"] },
            "qui-tab-panel": { lifecycle: ["render"] },
          },
        },
      },
    );
    const triggerHosts = [...root.querySelectorAll<HTMLElement>("qui-tab-trigger")];
    const panelHosts = [...root.querySelectorAll<HTMLElement>("qui-tab-panel")];
    const baselineTriggers = triggerHosts.map((host) => renderCount(host));
    const baselinePanels = panelHosts.map((host) => renderCount(host));

    tabs(root)[1]?.trigger.click();
    await waitForChanges();

    const triggerDeltas = triggerHosts.map(
      (host, index) => renderCount(host) - (baselineTriggers[index] ?? 0),
    );
    const panelDeltas = panelHosts.map(
      (host, index) => renderCount(host) - (baselinePanels[index] ?? 0),
    );
    expect(triggerDeltas[0]).toBeGreaterThan(0);
    expect(triggerDeltas[1]).toBeGreaterThan(0);
    expect(triggerDeltas[2]).toBe(0);
    expect(panelDeltas[0]).toBeGreaterThan(0);
    expect(panelDeltas[1]).toBeGreaterThan(0);
    expect(panelDeltas[2]).toBe(0);
  });
});

describe("qui-tabs colors", () => {
  it("applies selected, indicator, border, and panel color custom properties", async () => {
    const { root } = await render(
      <qui-tabs defaultValue="one">
        <qui-tab-list>
          <qui-tab-trigger value="one">One</qui-tab-trigger>
        </qui-tab-list>
        <qui-tab-panel value="one">Panel</qui-tab-panel>
      </qui-tabs>,
    );
    const tabsHost = root;
    const triggerHost = queryHost(root, "qui-tab-trigger");
    const listHost = queryHost(root, "qui-tab-list");
    const panelHost = queryHost(root, "qui-tab-panel");
    const trigger = queryPartIn<HTMLButtonElement>(triggerHost, "trigger");
    const indicator = queryPartIn(triggerHost, "indicator");
    const list = queryPartIn(listHost, "list");
    const panel = queryPartIn(panelHost, "panel");
    trigger.style.transition = "none";

    tabsHost.style.setProperty("--qui-tabs-label-selected-color", "rgb(1, 2, 3)");
    tabsHost.style.setProperty("--qui-tabs-indicator-color", "rgb(4, 5, 6)");
    tabsHost.style.setProperty("--qui-tabs-list-border-color", "rgb(7, 8, 9)");
    tabsHost.style.setProperty("--qui-tabs-panel-text-color", "rgb(10, 11, 12)");

    expect(getComputedStyle(trigger).color).toBe("rgb(1, 2, 3)");
    expect(getComputedStyle(indicator).backgroundColor).toBe("rgb(4, 5, 6)");
    expect(getComputedStyle(list).borderBlockEndColor).toBe("rgb(7, 8, 9)");
    expect(getComputedStyle(panel).color).toBe("rgb(10, 11, 12)");
  });
});
