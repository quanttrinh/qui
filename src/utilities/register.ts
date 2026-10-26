/**
 * Registers only the component definitions passed in.
 *
 * Import component modules from `@quanttrinh/qui/shared/*` and pass their
 * `defineCustomElement` exports:
 *
 * ```ts
 * import { defineComponents } from "@quanttrinh/qui/register";
 * import { defineCustomElement as defineButton } from "@quanttrinh/qui/shared/qui-button";
 * import { defineCustomElement as defineInput } from "@quanttrinh/qui/shared/qui-input";
 *
 * defineComponents(defineButton, defineInput);
 * ```
 *
 * The imports are static, so the bundler includes only the components in this
 * entry point. There is no loader, dynamic import, or runtime waterfall.
 */
export type ComponentDefinition = () => void;

export function defineComponents(...definitions: ComponentDefinition[]): void {
  for (const define of definitions) {
    define();
  }
}
