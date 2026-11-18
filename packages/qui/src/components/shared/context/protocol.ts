/** Web Components CG context protocol: https://github.com/webcomponents-cg/community-protocols/blob/main/proposals/context.md */

/** A context key branded with the type of the value it provides. */
export type Context<KeyType, ValueType> = KeyType & { __context__: ValueType };

/** Any context key. */
export type UnknownContext = Context<unknown, unknown>;

/** Extracts the value type of a context key. */
export type ContextType<T extends UnknownContext> = T extends Context<infer _, infer V> ? V : never;

/** Type-only brand; the key is unchanged at runtime. */
function brandContext<ValueType>(_key: unknown): asserts _key is Context<unknown, ValueType> {
  // No runtime effect.
}

/** Fresh symbol by default; pass an explicit key to match another library's provider. */
export function createContext<ValueType>(
  key: unknown = Symbol("qui-context"),
): Context<unknown, ValueType> {
  brandContext<ValueType>(key);
  return key;
}

/** Callback a provider invokes with a context value. */
export type ContextCallback<ValueType> = (value: ValueType, unsubscribe?: () => void) => void;

/** A request for a context value, fired by a consumer. */
export interface ContextRequestEvent<ValueType = unknown> extends Event {
  readonly context: Context<unknown, ValueType>;
  readonly callback: ContextCallback<ValueType>;
  readonly subscribe: boolean;
  /** Consumer host (protocol-compatible extension). */
  readonly contextTarget: Element;
}

/** Announcement by a provider that it can (or can no longer) serve a context. */
export interface ContextProviderEvent<ValueType = unknown> extends Event {
  readonly context: Context<unknown, ValueType>;
  readonly contextTarget: Element;
  readonly available: boolean;
}

function eventConstructorFor(host: Element): typeof CustomEvent {
  return host.ownerDocument?.defaultView?.CustomEvent ?? globalThis.CustomEvent;
}

/** Creates a composed, bubbling `context-request` event. */
export function createContextRequestEvent<ValueType>(
  context: Context<unknown, ValueType>,
  callback: ContextCallback<ValueType>,
  subscribe: boolean,
  contextTarget: Element,
): ContextRequestEvent<ValueType> {
  const event = Object.assign(
    new (eventConstructorFor(contextTarget))("context-request", {
      bubbles: true,
      composed: true,
    }),
    { context, callback, subscribe, contextTarget },
  );
  return event;
}

/** Creates a composed, bubbling `context-provider` announcement. */
export function createContextProviderEvent<ValueType>(
  context: Context<unknown, ValueType>,
  contextTarget: Element,
  available: boolean,
): ContextProviderEvent<ValueType> {
  const event = Object.assign(
    new (eventConstructorFor(contextTarget))("context-provider", {
      bubbles: true,
      composed: true,
    }),
    { context, contextTarget, available },
  );
  return event;
}

declare global {
  // Typed listeners: no runtime narrowing needed.
  interface ElementEventMap {
    "context-request": ContextRequestEvent;
    "context-provider": ContextProviderEvent;
  }
  interface DocumentEventMap {
    "context-request": ContextRequestEvent;
    "context-provider": ContextProviderEvent;
  }
}
