/**
 * Inserts a node before a reference node.
 *
 * Prefers the modern `before()` API and falls back to `insertBefore()` for
 * DOM implementations such as Stencil's test document that do not provide it.
 */
export function insertBefore(parent: ParentNode, node: Node, reference: Node): void {
  const before: unknown = Reflect.get(reference, "before");
  if (typeof before === "function") {
    Reflect.apply(before, reference, [node]);
    return;
  }

  const insert: unknown = Reflect.get(parent, "insertBefore");
  if (typeof insert === "function") {
    Reflect.apply(insert, parent, [node, reference]);
  }
}
