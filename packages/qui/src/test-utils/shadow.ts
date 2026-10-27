/**
 * Test-only helpers for inspecting open shadow roots.
 *
 * These utilities are intentionally not exported from a package entry point.
 * They rely on DOM APIs available in the browser test environment.
 */

/* oxlint-disable typescript/no-unnecessary-type-parameters -- The public helpers mirror DOM query APIs so callers can provide the expected element type. */
/* oxlint-disable unicorn/no-null -- Returning null matches DOM querySelector* and activeElement APIs. */

function hostDescription(host: Element): string {
  const id = host.id ? `#${host.id}` : "";
  return `<${host.localName}${id}>`;
}

function collectWithin(root: ParentNode, selector: string, results: Element[]): void {
  for (const child of root.children) {
    if (child.matches(selector)) {
      results.push(child);
    }

    const shadow = child.shadowRoot;
    if (shadow) {
      collectWithin(shadow, selector, results);
    }

    collectWithin(child, selector, results);
  }
}

function collectDeep(
  root: Document | ShadowRoot | Element,
  selector: string,
  results: Element[],
): void {
  if ("shadowRoot" in root && root.shadowRoot) {
    collectWithin(root.shadowRoot, selector, results);
  }

  collectWithin(root, selector, results);
}

/** Returns the open shadow root of `host`, or throws a descriptive error. */
export function shadowOf(host: Element): ShadowRoot {
  const root = host.shadowRoot;
  if (!root) {
    throw new Error(
      `shadowOf: ${hostDescription(host)} has no open shadow root. Attach one with attachShadow({ mode: "open" }) before querying it.`,
    );
  }

  return root;
}

/** Returns the first element in `host`'s shadow root whose `part` contains `part`. */
export function queryPart<TElement extends Element = Element>(
  host: Element,
  part: string,
): TElement {
  const element = shadowOf(host).querySelector<TElement>(`[part~="${CSS.escape(part)}"]`);
  if (!element) {
    throw new Error(
      `queryPart: no element with part "${part}" was found in the shadow root of ${hostDescription(host)}.`,
    );
  }

  return element;
}

/** Returns every element in `host`'s shadow root whose `part` contains `part`. */
export function queryParts<TElement extends Element = Element>(
  host: Element,
  part: string,
): TElement[] {
  return [...shadowOf(host).querySelectorAll<TElement>(`[part~="${CSS.escape(part)}"]`)];
}

/** Queries `selector` inside `host`'s shadow root, without crossing nested roots. */
export function queryInside<TElement extends Element = Element>(
  host: Element,
  selector: string,
): TElement | null {
  return shadowOf(host).querySelector<TElement>(selector);
}

/** Returns all matches for `selector` in depth-first order across open shadow roots. */
export function deepQueryAll<TElement extends Element = Element>(
  root: Document | ShadowRoot | Element,
  selector: string,
): TElement[] {
  const results: Element[] = [];
  collectDeep(root, selector, results);
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The selector matched these elements; TElement only narrows the caller's expected subtype.
  return results as TElement[];
}

/** Returns the first match for `selector` in depth-first order across open shadow roots. */
export function deepQuery<TElement extends Element = Element>(
  root: Document | ShadowRoot | Element,
  selector: string,
): TElement | null {
  return deepQueryAll<TElement>(root, selector).at(0) ?? null;
}

/**
 * Returns the active element inside `root`, descending through open shadow
 * roots so the result is the element that actually holds focus.
 */
export function activeElementIn(root: Document | ShadowRoot): Element | null {
  const active = root.activeElement;
  if (!active) {
    return null;
  }

  if (active.shadowRoot) {
    const nested = activeElementIn(active.shadowRoot);
    if (nested) {
      return nested;
    }
  }

  return active;
}

/** Returns the deeply focused element for `doc`, if any. */
export function deepActiveElement(doc: Document = document): Element | null {
  return activeElementIn(doc);
}

/** Returns whether `element` is the element that actually holds focus. */
export function isDeepActiveElement(element: Element | null): boolean {
  return element !== null && deepActiveElement(element.ownerDocument) === element;
}

/** Focuses `host` and resolves after the focus operation settles. */
export async function focusHost(host: HTMLElement): Promise<void> {
  host.focus();
  await Promise.resolve();
}
