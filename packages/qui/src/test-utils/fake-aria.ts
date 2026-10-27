/**
 * Test-only fakes for ARIA element reflection.
 *
 * The fakes implement only the DOM surface used by the ARIA helpers, so they
 * stay safe to import from Node-based unit tests without touching a document.
 */

/** ARIA element reflection properties emulated by {@link createReflectionElement}. */
export type AriaReflectionProperty =
  | "ariaActiveDescendantElement"
  | "ariaControlsElements"
  | "ariaDescribedByElements"
  | "ariaErrorMessageElements"
  | "ariaLabelledByElements";

/** The DOM property types backing each ARIA reflection property. */
interface AriaReflectionProperties {
  ariaActiveDescendantElement: Element | null;
  ariaControlsElements: readonly Element[] | null;
  ariaDescribedByElements: readonly Element[] | null;
  ariaErrorMessageElements: readonly Element[] | null;
  ariaLabelledByElements: readonly Element[] | null;
}

/** A minimal `HTMLElement` fake whose reflection properties may be absent. */
export type FakeReflectionElement = HTMLElement & Partial<AriaReflectionProperties>;

const ALL_ARIA_REFLECTION_PROPERTIES: readonly AriaReflectionProperty[] = [
  "ariaActiveDescendantElement",
  "ariaControlsElements",
  "ariaDescribedByElements",
  "ariaErrorMessageElements",
  "ariaLabelledByElements",
];

/**
 * Creates a minimal element fake with the attribute methods the ARIA helpers
 * use. When `supported` is true, `properties` (all reflection properties by
 * default) are defined so `property in element` reflection checks succeed.
 */
export function createReflectionElement(
  supported: boolean,
  properties: readonly AriaReflectionProperty[] = ALL_ARIA_REFLECTION_PROPERTIES,
): FakeReflectionElement {
  const attributes = new Map<string, string>();
  const element = {
    // oxlint-disable-next-line unicorn/no-null -- Mirrors Element.getAttribute().
    getAttribute: (name: string): string | null => attributes.get(name) ?? null,
    hasAttribute: (name: string): boolean => attributes.has(name),
    removeAttribute: (name: string): void => {
      attributes.delete(name);
    },
    setAttribute: (name: string, value: string): void => {
      attributes.set(name, value);
    },
  };

  if (supported) {
    for (const property of properties) {
      Reflect.set(element, property, undefined);
    }
  }

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The fake implements only the DOM surface the helpers touch.
  return element as unknown as FakeReflectionElement;
}

/** Creates a minimal element fake that only carries an `id`. */
export function fakeTarget(id: string): HTMLElement {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The fake is only used as an ARIA relationship target.
  return { id } as unknown as HTMLElement;
}
