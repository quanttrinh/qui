import { isShadowRoot } from "../../helpers/dom";
import { notifyContextChanged, type ContextPartKey } from "./context-part";

/** Provides and consumes one family of context through the DOM tree. */
interface ContextStore<TContext> {
  /** Attach a context to its provider host. */
  provide: (host: Element, context: TContext) => void;
  /** Remove the context from a provider host. */
  clear: (host: Element) => void;
  /** Find the closest ancestor context, crossing shadow boundaries. */
  consume: (host: Element) => TContext | undefined;
}

function parentElement(node: Element): Element | undefined {
  const parent = node.parentElement;
  if (parent) {
    return parent;
  }
  const root = node.getRootNode();
  return isShadowRoot(root) ? root.host : undefined;
}

/**
 * Creates a context store scoped to one provider key. The store owns the
 * WeakMap, the ancestor walk, and provider notifications so each context
 * module only declares its context type.
 */
function createContextStore<TContext>(key: ContextPartKey): ContextStore<TContext> {
  const contexts = new WeakMap<Element, TContext>();

  return {
    provide: (host: Element, context: TContext): void => {
      contexts.set(host, context);
      notifyContextChanged(key);
    },
    clear: (host: Element): void => {
      contexts.delete(host);
      notifyContextChanged(key);
    },
    consume: (host: Element): TContext | undefined => {
      let node = parentElement(host);
      while (node !== undefined) {
        const context = contexts.get(node);
        if (context !== undefined) {
          return context;
        }
        node = parentElement(node);
      }
      return undefined;
    },
  };
}

export { createContextStore, type ContextStore };
