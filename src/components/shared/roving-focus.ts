import { KeyedHostRegistry } from "./keyed-host-registry";

/** A trigger registered with a composite widget. */
export interface TriggerRegistration {
  readonly value: string;
  readonly host: HTMLElement;
  readonly trigger: HTMLButtonElement;
}

export type FocusEdge = "first" | "last";

const DOCUMENT_POSITION_PRECEDING = 2;
const DOCUMENT_POSITION_FOLLOWING = 4;

/** Orders registrations by their host's position in the document. */
function compareHostOrder(left: TriggerRegistration, right: TriggerRegistration): number {
  if (left.host === right.host) {
    return 0;
  }
  const compare = Reflect.get(left.host, "compareDocumentPosition");
  if (typeof compare !== "function") {
    return 0;
  }
  const position: unknown = Reflect.apply(compare, left.host, [right.host]);
  if (typeof position !== "number") {
    return 0;
  }
  // oxlint-disable-next-line eslint/no-bitwise -- compareDocumentPosition returns a bitmask.
  if ((position & DOCUMENT_POSITION_FOLLOWING) !== 0) {
    return -1;
  }
  // oxlint-disable-next-line eslint/no-bitwise -- compareDocumentPosition returns a bitmask.
  if ((position & DOCUMENT_POSITION_PRECEDING) !== 0) {
    return 1;
  }
  return 0;
}

/** Whether two registrations point at the same host and internal button. */
export function sameTriggerRegistration(
  existing: TriggerRegistration,
  next: TriggerRegistration,
): boolean {
  return existing.host === next.host && existing.trigger === next.trigger;
}

/**
 * Trigger registry with the roving-focus behavior shared by accordion and
 * tabs. Movement strategies and activation stay with the specific controller.
 */
export class RovingFocusRegistry<
  TEntry extends TriggerRegistration,
> extends KeyedHostRegistry<TEntry> {
  /** Enabled registrations in document order. */
  public enabled(): TEntry[] {
    return (
      this.values()
        .filter(({ trigger }) => !trigger.disabled)
        // oxlint-disable-next-line unicorn/no-array-sort -- values() already returns a fresh array.
        .sort(compareHostOrder)
    );
  }

  /** Moves DOM focus to the registered button for `value`. */
  public focusTrigger(value: string): void {
    this.get(value)?.trigger.focus();
  }

  /** The enabled entry at an edge of the registration order. */
  public edge(edge: FocusEdge): TEntry | undefined {
    const entries = this.enabled();
    return edge === "first" ? entries[0] : entries.at(-1);
  }
}
