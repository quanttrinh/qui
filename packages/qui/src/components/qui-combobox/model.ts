import { type OptionItem } from "../shared/option/option";

const WHITESPACE = /\s+/u;

/** An option rendered by the combobox. */
export type ComboboxOption = OptionItem;

/** Custom matcher. Receives the trimmed, unfiltered input value. */
export type ComboboxFilter = (item: ComboboxOption, query: string) => boolean;

/** Built-in matching strategy. */
export type ComboboxFilterMode = "contains" | "startsWith" | "words" | "none";

export interface FilterOptions {
  query: string;
  mode: ComboboxFilterMode;
  revision: number;
  filter?: ComboboxFilter;
}

/** Memoizes the filtered list for the current query and base revision. */
export class OptionFilter {
  private filtered?: readonly ComboboxOption[];
  private key = "";
  private readonly searchCache = new WeakMap<ComboboxOption, string>();

  public invalidate(): void {
    this.filtered = undefined;
    this.key = "";
  }

  public apply(
    items: readonly ComboboxOption[],
    { query, mode, revision, filter }: FilterOptions,
  ): readonly ComboboxOption[] {
    const trimmed = query.trim();
    if (trimmed === "" || mode === "none") {
      return items;
    }
    const key = `${revision}\u0000${trimmed}`;
    if (this.filtered !== undefined && this.key === key) {
      return this.filtered;
    }
    const needle = trimmed.toLowerCase();
    this.filtered = items.filter((item) =>
      filter === undefined ? this.matches(item, needle, mode) : filter(item, trimmed),
    );
    this.key = key;
    return this.filtered;
  }

  private matches(item: ComboboxOption, query: string, mode: ComboboxFilterMode): boolean {
    const text = this.searchText(item);
    if (mode === "startsWith") {
      return text.startsWith(query);
    }
    if (mode === "words") {
      return query.split(WHITESPACE).every((word) => text.includes(word));
    }
    return text.includes(query);
  }

  private searchText(item: ComboboxOption): string {
    let text = this.searchCache.get(item);
    if (text === undefined) {
      text = `${item.label} ${item.keywords ?? ""}`.toLowerCase();
      this.searchCache.set(item, text);
    }
    return text;
  }
}
