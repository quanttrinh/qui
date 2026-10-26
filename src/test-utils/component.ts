/**
 * Test-only helpers for resolving component hosts and their shadow-DOM controls.
 *
 * These utilities are intentionally not exported from a package entry point.
 */

/* oxlint-disable typescript/no-unnecessary-type-parameters -- The public helpers mirror DOM query APIs so callers can provide the expected element type. */

import { deepQuery, queryInside, queryPart } from "./shadow";

/** Returns the first light-DOM element matching `selector`, or throws. */
export function queryHost<TElement extends Element = HTMLElement>(
  root: ParentNode,
  selector: string,
): TElement {
  const element = root.querySelector<TElement>(selector);
  if (element === null) {
    throw new TypeError(`Expected ${selector}`);
  }

  return element;
}

/** Resolves the component host matching `tagName`, starting at `root`. */
export function resolveHost<TElement extends Element = HTMLElement>(
  root: HTMLElement,
  tagName: string,
): TElement {
  if (root.matches(tagName)) {
    const element: Element = root;
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- A host that matches tagName is the caller's requested component type.
    return element as TElement;
  }

  const host = deepQuery<TElement>(root, tagName);
  if (host === null) {
    throw new TypeError(`Expected a ${tagName} host`);
  }

  return host;
}

/** Returns the control matching `selector` inside `host`'s shadow root. */
export function queryControl<TElement extends Element = Element>(
  host: Element,
  selector: string,
): TElement {
  const control = queryInside<TElement>(host, selector);
  if (control === null) {
    throw new TypeError(`Expected a control matching "${selector}"`);
  }

  return control;
}

/** Returns the first element in `root`'s shadow root whose `part` contains `partName`. */
export function queryPartIn<TElement extends Element = HTMLElement>(
  root: Element,
  partName: string,
): TElement {
  return queryPart<TElement>(root, partName);
}
