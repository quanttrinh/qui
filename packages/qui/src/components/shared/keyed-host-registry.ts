/** Notifies the owner when the registry's contents change. */
export interface KeyedHostRegistryOptions {
  onChange?: () => void;
}

const noop = (): void => undefined;

/**
 * Tracks entries by key in registration order.
 *
 * Registration is DOM-free; the owner decides how to react to changes. An
 * equivalent entry re-registered under the same key is a no-op, and an
 * unregister function only removes the entry it was created for.
 */
export class KeyedHostRegistry<TEntry> {
  private readonly entries = new Map<string, TEntry>();
  private readonly onChange?: () => void;

  constructor(options: KeyedHostRegistryOptions = {}) {
    this.onChange = options.onChange;
  }

  /**
   * Registers `entry` under `value`. Returns an idempotent unregister
   * function that is safe to call after a replacement registration.
   */
  public register(
    value: string,
    entry: TEntry,
    sameEntry: (existing: TEntry, next: TEntry) => boolean = Object.is,
  ): () => void {
    const existing = this.entries.get(value);
    if (existing !== undefined && sameEntry(existing, entry)) {
      return noop;
    }
    this.entries.set(value, entry);
    this.onChange?.();
    let active = true;
    return (): void => {
      if (!active) {
        return;
      }
      active = false;
      if (Object.is(this.entries.get(value), entry)) {
        this.entries.delete(value);
        this.onChange?.();
      }
    };
  }

  /** The entry registered under `value`. */
  public get(value: string): TEntry | undefined {
    return this.entries.get(value);
  }

  /** All entries in registration order. */
  public values(): TEntry[] {
    return [...this.entries.values()];
  }

  /** Removes every entry. */
  public clear(): void {
    if (this.entries.size === 0) {
      return;
    }
    this.entries.clear();
    this.onChange?.();
  }
}
