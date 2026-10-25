import { type OptionItem } from "../shared/option/option";
import { type ComboboxFilter, type ComboboxFilterMode, OptionFilter } from "./model";

export interface ComboboxInputOptions {
  getControlledValue: () => string | undefined;
  getFilter: () => ComboboxFilter | undefined;
  getFilterMode: () => ComboboxFilterMode;
  getFilterDebounce: () => number;
  onInputValueChange: (value: string, reason: string) => void;
  onQueryApplied: () => void;
  requestUpdate: () => void;
}

/**
 * Combobox text/query state: controlled input value, debounced filtering, and
 * the filtered-item cache. Unique to combobox; select has no query.
 */
export class ComboboxInputController {
  private readonly options: ComboboxInputOptions;
  private text = "";
  private query = "";
  private revision = 0;
  private readonly optionFilter = new OptionFilter();
  private timer?: ReturnType<typeof setTimeout>;

  constructor(options: ComboboxInputOptions) {
    this.options = options;
  }

  public get value(): string {
    return this.options.getControlledValue() ?? this.text;
  }

  public initialize(text: string): void {
    this.text = text;
    this.query = text;
  }

  public filter(items: readonly OptionItem[]): readonly OptionItem[] {
    return this.optionFilter.apply(items, {
      query: this.query,
      mode: this.options.getFilterMode(),
      revision: this.revision,
      filter: this.options.getFilter(),
    });
  }

  public handleInput(value: string): void {
    this.text = value;
    this.updateQuery(value);
    this.options.onInputValueChange(value, "input");
    this.options.requestUpdate();
  }

  public setText(value: string, reason?: string): void {
    this.text = value;
    this.updateQuery(value);
    if (reason !== undefined) {
      this.options.onInputValueChange(value, reason);
    }
    this.options.requestUpdate();
  }

  public setTextSilently(value: string): void {
    this.text = value;
    this.updateQuery(value);
    this.options.requestUpdate();
  }

  public syncControlled(value: string): void {
    this.updateQuery(value);
  }

  public resetQuery(): void {
    this.clearTimer();
    this.applyQuery("");
  }

  public invalidate(): void {
    this.revision += 1;
    this.optionFilter.invalidate();
  }

  public dispose(): void {
    this.clearTimer();
  }

  private updateQuery(value: string): void {
    const debounce = this.options.getFilterDebounce();
    if (debounce > 0) {
      this.clearTimer();
      this.timer = setTimeout(() => {
        this.timer = undefined;
        this.applyQuery(value);
      }, debounce);
      return;
    }
    this.applyQuery(value);
  }

  private applyQuery(value: string): void {
    if (this.query === value) {
      return;
    }
    this.query = value;
    this.options.onQueryApplied();
    this.options.requestUpdate();
  }

  private clearTimer(): void {
    if (this.timer !== undefined) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }
}
