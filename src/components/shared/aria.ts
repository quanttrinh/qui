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

/**
 * Assigns an element-list ARIA relationship. Uses element reflection when the
 * corresponding property is supported, and falls back to IDREFs otherwise.
 */
function setAriaElementList(
  element: HTMLElement,
  targets: Element[],
  property: AriaElementListProperty,
): void {
  const attribute = ariaIdrefAttributes[property];
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

/** Sets `aria-activedescendant` with element reflection and an IDREF fallback. */
function setAriaActiveDescendant(element: HTMLElement, target: Element | undefined): void {
  if ("ariaActiveDescendantElement" in element) {
    element.removeAttribute("aria-activedescendant");
    // Null is the spec value for clearing a nullable element relationship.
    // oxlint-disable-next-line unicorn/no-null
    Reflect.set(element, "ariaActiveDescendantElement", target ?? null);
    return;
  }
  setAriaIdrefs(element, "aria-activedescendant", target === undefined ? [] : [target]);
}

export {
  setAriaActiveDescendant,
  setAriaControls,
  setAriaDescribedBy,
  setAriaErrorMessage,
  setAriaLabelledBy,
};
