import { KeyedHostRegistry } from "./keyed-host-registry";

/** A trigger registered with a composite widget. */
export interface TriggerRegistration {
  readonly value: string;
  readonly host: HTMLElement;
  readonly trigger: HTMLButtonElement;
}

export type FocusEdge = "first" | "last";

export interface MoveIndexOptions {
  delta: 1 | -1;
  loop?: boolean;
  /** When set, a missing current index selects the first or last entry. */
  selectEdge?: boolean;
}

/**
 * Returns the next index in a roving list, or `undefined` when the move is
 * blocked at an edge. When `selectEdge` is set, a missing current index selects
 * the first or last entry, matching the tabs and option-list behavior.
 */
export function moveIndex(
  entries: readonly unknown[],
  currentIndex: number,
  { delta, loop = false, selectEdge = true }: MoveIndexOptions,
): number | undefined {
  const { length } = entries;
  if (length === 0) {
    return undefined;
  }
  let next = currentIndex + delta;
  if (currentIndex === -1 && selectEdge) {
    next = delta > 0 ? 0 : length - 1;
  }
  if (next < 0 || next >= length) {
    if (!loop) {
      return undefined;
    }
    next = (next + length) % length;
  }
  return next;
}

const DOCUMENT_POSITION_PRECEDING = 2;
const DOCUMENT_POSITION_FOLLOWING = 4;

/** Whether a `compareDocumentPosition` bitmask contains `bit`. */
function hasPositionBit(position: number, bit: number): boolean {
  return Math.trunc(position / bit) % 2 === 1;
}

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
  if (hasPositionBit(position, DOCUMENT_POSITION_FOLLOWING)) {
    return -1;
  }
  if (hasPositionBit(position, DOCUMENT_POSITION_PRECEDING)) {
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
  enabled(): TEntry[] {
    return this.values()
      .filter(({ trigger }) => !trigger.disabled)
      .toSorted(compareHostOrder);
  }

  /** Moves DOM focus to the registered button for `value`. */
  focusTrigger(value: string): void {
    this.get(value)?.trigger.focus();
  }

  /** The enabled entry at an edge of the registration order. */
  edge(edge: FocusEdge): TEntry | undefined {
    const entries = this.enabled();
    return edge === "first" ? entries[0] : entries.at(-1);
  }
}
