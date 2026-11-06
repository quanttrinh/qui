import { isHTMLElement } from "../shared/dom/dom";

/**
 * Exceptions that report a non-negative `tabIndex` but cannot receive focus:
 * disabled controls, and links that have neither an `href` nor an explicit
 * tab index. Everything else can defer to the browser's `tabIndex` default.
 */
const NOT_TABBABLE_SELECTOR =
  ":disabled, a:not([href]):not([tabindex]), area:not([href]):not([tabindex])";

/**
 * Returns whether a tab panel subtree contains a tabbable descendant,
 * including focusable elements inside nested open shadow roots.
 *
 * A nested panel's own generated tab stop is not treated as content, and
 * hidden/inert subtrees are ignored.
 */
export function hasFocusableDescendant(root: ParentNode): boolean {
  for (const element of root.children) {
    // Hidden/inert ancestors make their whole subtree unreachable.
    if (!element.matches("[hidden], [inert]")) {
      // A nested tab panel's own generated tab stop should not count as content.
      const isTabPanel = element.getAttribute("part") === "panel";
      if (
        !isTabPanel &&
        isHTMLElement(element) &&
        element.tabIndex >= 0 &&
        !element.matches(NOT_TABBABLE_SELECTOR)
      ) {
        return true;
      }
      if (hasFocusableDescendant(element)) {
        return true;
      }
      if (element.shadowRoot !== null && hasFocusableDescendant(element.shadowRoot)) {
        return true;
      }
    }
  }
  return false;
}
