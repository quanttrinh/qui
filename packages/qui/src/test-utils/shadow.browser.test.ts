import { afterEach, describe, expect, it } from "vitest";

import {
  activeElementIn,
  deepActiveElement,
  deepQuery,
  deepQueryAll,
  focusHost,
  isDeepActiveElement,
  queryInside,
  queryPart,
  queryParts,
  shadowOf,
} from "./shadow";

const MISSING_SHADOW_ROOT = /no open shadow root/u;
const MISSING_ACTION_PART = /part "action"/u;

interface Fixture {
  outer: HTMLElement;
  outerRoot: ShadowRoot;
  outerLabel: HTMLElement;
  middleHost: HTMLElement;
  middleRoot: ShadowRoot;
  deepButton: HTMLButtonElement;
  innerHost: HTMLElement;
  innerRoot: ShadowRoot;
  innermost: HTMLElement;
}

function createElement<TTag extends keyof HTMLElementTagNameMap>(
  tagName: TTag,
  id: string,
  part: string,
): HTMLElementTagNameMap[TTag] {
  const element = document.createElement(tagName);
  element.id = id;
  element.setAttribute("part", part);
  return element;
}

function createOuter(): Pick<Fixture, "outer" | "outerRoot" | "outerLabel" | "middleHost"> {
  const outer = createElement("section", "shadow-fixture", "outer");
  outer.tabIndex = 0;
  document.body.append(outer);

  const outerRoot = outer.attachShadow({ mode: "open" });
  const outerLabel = createElement("span", "outer-label", "label shared");
  outerLabel.textContent = "Outer label";

  const middleHost = createElement("div", "middle-host", "panel");
  middleHost.tabIndex = 0;
  outerRoot.append(outerLabel, middleHost);

  return { outer, outerRoot, outerLabel, middleHost };
}

function createMiddle(
  middleHost: HTMLElement,
): Pick<Fixture, "middleRoot" | "deepButton" | "innerHost"> {
  const middleRoot = middleHost.attachShadow({ mode: "open" });
  const deepButton = createElement("button", "deep-button", "action shared");
  deepButton.textContent = "Deep button";

  const innerHost = createElement("div", "inner-host", "box");
  innerHost.tabIndex = 0;
  middleRoot.append(deepButton, innerHost);

  return { middleRoot, deepButton, innerHost };
}

function createInner(innerHost: HTMLElement): Pick<Fixture, "innerRoot" | "innermost"> {
  const innerRoot = innerHost.attachShadow({ mode: "open" });
  const innermost = createElement("em", "innermost", "label");
  innermost.tabIndex = 0;
  innermost.textContent = "Innermost";
  innerRoot.append(innermost);

  return { innerRoot, innermost };
}

function createFixture(): Fixture {
  const outerParts = createOuter();
  const middleParts = createMiddle(outerParts.middleHost);
  const innerParts = createInner(middleParts.innerHost);
  return { ...outerParts, ...middleParts, ...innerParts };
}

describe("shadow test helpers", () => {
  let fixture: Fixture | undefined;

  afterEach(() => {
    fixture?.outer.remove();
    fixture = undefined;
  });

  it("returns the shadow root or throws a clear error when it is missing", () => {
    const host = document.createElement("div");
    host.id = "no-shadow";
    document.body.append(host);

    try {
      expect(() => shadowOf(host)).toThrow(MISSING_SHADOW_ROOT);
    } finally {
      host.remove();
    }

    fixture = createFixture();
    expect(shadowOf(fixture.outer)).toBe(fixture.outerRoot);
  });

  it("finds parts within a single shadow root", () => {
    fixture = createFixture();

    expect(queryPart(fixture.outer, "label")).toBe(fixture.outerLabel);
    expect(queryParts(fixture.outer, "shared")).toEqual([fixture.outerLabel]);
    expect(queryPart(fixture.middleHost, "action")).toBe(fixture.deepButton);
    expect(queryParts(fixture.middleHost, "shared")).toEqual([fixture.deepButton]);
    expect(queryParts(fixture.middleHost, "label")).toEqual([]);
    const { outer } = fixture;
    expect(() => queryPart(outer, "action")).toThrow(MISSING_ACTION_PART);
  });

  it("scopes queryInside to the host's shadow root", () => {
    fixture = createFixture();

    expect(queryInside(fixture.outer, "#outer-label")).toBe(fixture.outerLabel);
    expect(queryInside(fixture.outer, "#deep-button")).toBeNull();
    expect(queryInside(fixture.middleHost, "#deep-button")).toBe(fixture.deepButton);
    expect(queryInside(fixture.middleHost, "#innermost")).toBeNull();
  });

  it("finds elements depth-first across nested open shadow roots", () => {
    fixture = createFixture();

    expect(deepQuery(fixture.outer, "#innermost")).toBe(fixture.innermost);
    expect(deepQuery(fixture.outer, "#missing")).toBeNull();
    expect(deepQueryAll(fixture.outer, '[part~="shared"]')).toEqual([
      fixture.outerLabel,
      fixture.deepButton,
    ]);
    expect(deepQueryAll(fixture.outer, '[part~="label"]')).toEqual([
      fixture.outerLabel,
      fixture.innermost,
    ]);
  });

  it("focuses shadow hosts and nested elements", async () => {
    fixture = createFixture();

    await focusHost(fixture.middleHost);
    expect(document.activeElement).toBe(fixture.outer);
    expect(activeElementIn(fixture.outerRoot)).toBe(fixture.middleHost);
    expect(activeElementIn(fixture.middleRoot)).toBeNull();
    expect(deepActiveElement()).toBe(fixture.middleHost);
    expect(isDeepActiveElement(fixture.middleHost)).toBe(true);
    expect(isDeepActiveElement(fixture.deepButton)).toBe(false);

    await focusHost(fixture.deepButton);
    expect(document.activeElement).toBe(fixture.outer);
    expect(activeElementIn(fixture.outerRoot)).toBe(fixture.deepButton);
    expect(activeElementIn(fixture.middleRoot)).toBe(fixture.deepButton);
    expect(deepActiveElement(document)).toBe(fixture.deepButton);
    expect(isDeepActiveElement(fixture.deepButton)).toBe(true);
    expect(isDeepActiveElement(fixture.outerLabel)).toBe(false);
  });

  it("reports the deepest active element across multiple shadow roots", async () => {
    fixture = createFixture();

    await focusHost(fixture.innermost);
    expect(activeElementIn(fixture.outerRoot)).toBe(fixture.innermost);
    expect(activeElementIn(fixture.middleRoot)).toBe(fixture.innermost);
    expect(activeElementIn(fixture.innerRoot)).toBe(fixture.innermost);
    expect(deepActiveElement()).toBe(fixture.innermost);
    expect(isDeepActiveElement(fixture.innermost)).toBe(true);
    expect(isDeepActiveElement(fixture.outerLabel)).toBe(false);
  });
});
