/** ARIA element reflection properties that reference a list of elements. */
type AriaElementListProperty =
  | "ariaLabelledByElements"
  | "ariaDescribedByElements"
  | "ariaErrorMessageElements"
  | "ariaControlsElements";

const ariaIdrefAttributes = {
  ariaControlsElements: "aria-controls",
  ariaDescribedByElements: "aria-describedby",
  ariaErrorMessageElements: "aria-errormessage",
  ariaLabelledByElements: "aria-labelledby",
} as const satisfies Record<AriaElementListProperty, string>;

/** Sets an IDREF attribute from the targets, filtering out empty ids. */
function setAriaIdrefs(element: HTMLElement, attribute: string, targets: Element[]): void {
  const ids = targets.map((target) => target.id).filter((id) => id.length > 0);
  if (ids.length === 0) {
    element.removeAttribute(attribute);
    return;
  }
  element.setAttribute(attribute, ids.join(" "));
}

interface CachedAriaTargets {
  targets: readonly Element[];
  ids: readonly string[];
}

const ariaTargetCache = new WeakMap<Element, Map<AriaElementListProperty, CachedAriaTargets>>();

/** Whether the cached relationship still points at the same targets and ids. */
function sameAriaTargets(cached: CachedAriaTargets, targets: readonly Element[]): boolean {
  if (cached.targets.length !== targets.length) {
    return false;
  }
  return targets.every(
    (target, index) => cached.targets[index] === target && cached.ids[index] === target.id,
  );
}

/** Whether the cached relationship is still present on the element. */
function ariaTargetsStillApplied(
  element: HTMLElement,
  cached: CachedAriaTargets,
  property: AriaElementListProperty,
): boolean {
  const attribute = ariaIdrefAttributes[property];
  if (property in element) {
    const current: unknown = Reflect.get(element, property);
    if (!Array.isArray(current) || current.length !== cached.targets.length) {
      return false;
    }
    return cached.targets.every((target, index) => current[index] === target);
  }
  const ids = cached.ids.filter((id) => id.length > 0);
  const expected = ids.length === 0 ? null : ids.join(" ");
  return element.getAttribute(attribute) === expected;
}

/**
 * Assigns an element-list ARIA relationship. Uses element reflection when the
 * corresponding property is supported, and falls back to IDREFs otherwise.
 *
 * Repeated calls with the same targets are no-ops while the relationship is
 * still applied, which keeps components that re-apply relationships after every
 * render from rewriting the DOM. External clears or template attribute writes
 * invalidate the cache so the relationship is re-applied.
 */
function setAriaElementList(
  element: HTMLElement,
  targets: Element[],
  property: AriaElementListProperty,
): void {
  const attribute = ariaIdrefAttributes[property];
  let cache = ariaTargetCache.get(element);
  const cached = cache?.get(property);
  if (
    cached !== undefined &&
    sameAriaTargets(cached, targets) &&
    ariaTargetsStillApplied(element, cached, property)
  ) {
    return;
  }
  if (cache === undefined) {
    cache = new Map();
    ariaTargetCache.set(element, cache);
  }
  cache.set(property, { targets: [...targets], ids: targets.map((target) => target.id) });

  if (property in element) {
    // Remove the IDREF first: removeAttribute() also clears the reflected
    // Element list in Chromium; set the property afterward.
    element.removeAttribute(attribute);
    Reflect.set(element, property, targets);
    return;
  }
  setAriaIdrefs(element, attribute, targets);
}

/** Sets `aria-labelledby` with element reflection and an IDREF fallback. */
function setAriaLabelledBy(element: HTMLElement, targets: Element[]): void {
  setAriaElementList(element, targets, "ariaLabelledByElements");
}

/** Sets `aria-describedby` with element reflection and an IDREF fallback. */
function setAriaDescribedBy(element: HTMLElement, targets: Element[]): void {
  setAriaElementList(element, targets, "ariaDescribedByElements");
}

/** Sets `aria-errormessage` with element reflection and an IDREF fallback. */
function setAriaErrorMessage(element: HTMLElement, targets: Element[]): void {
  setAriaElementList(element, targets, "ariaErrorMessageElements");
}

/** Sets `aria-controls` with element reflection and an IDREF fallback. */
function setAriaControls(element: HTMLElement, targets: Element[]): void {
  setAriaElementList(element, targets, "ariaControlsElements");
}

export { setAriaControls, setAriaDescribedBy, setAriaErrorMessage, setAriaLabelledBy };
