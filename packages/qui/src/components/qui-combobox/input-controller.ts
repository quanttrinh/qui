import {
  ReactiveControllerBase,
  type ReactiveControllerHost,
} from "../shared/controllers/reactive-control/controller";
import { type OptionItem } from "../shared/option/option";
import { type ComboboxFilter, type ComboboxFilterMode, OptionFilter } from "./model";

export interface ComboboxInputOptions {
  getControlledValue: () => string | undefined;
  getFilter: () => ComboboxFilter | undefined;
  getFilterMode: () => ComboboxFilterMode;
  getFilterDebounce: () => number;
  onInputValueChange: (value: string, reason: string) => void;
  onQueryApplied: () => void;
}

/**
 * Combobox text/query state: controlled input value, debounced filtering, and
 * the filtered-item cache. Unique to combobox; select has no query.
 */
export class ComboboxInputController extends ReactiveControllerBase {
  private readonly options: ComboboxInputOptions;
  private text = "";
  private query = "";
  private revision = 0;
  private readonly optionFilter = new OptionFilter();
  private timer?: ReturnType<typeof setTimeout>;

  constructor(host: ReactiveControllerHost, options: ComboboxInputOptions) {
    super(host);
    this.options = options;
  }

  get value(): string {
    return this.options.getControlledValue() ?? this.text;
  }

  initialize(text: string): void {
    this.text = text;
    this.query = text;
  }

  filter(items: readonly OptionItem[]): readonly OptionItem[] {
    return this.optionFilter.apply(items, {
      query: this.query,
      mode: this.options.getFilterMode(),
      revision: this.revision,
      filter: this.options.getFilter(),
    });
  }

  handleInput(value: string): void {
    this.text = value;
    this.updateQuery(value);
    this.options.onInputValueChange(value, "input");
    this.requestUpdate();
  }

  setText(value: string, reason?: string): void {
    this.text = value;
    this.updateQuery(value);
    if (reason !== undefined) {
      this.options.onInputValueChange(value, reason);
    }
    this.requestUpdate();
  }

  setTextSilently(value: string): void {
    this.text = value;
    this.updateQuery(value);
    this.requestUpdate();
  }

  syncControlled(value: string): void {
    this.updateQuery(value);
  }

  resetQuery(): void {
    this.clearTimer();
    this.applyQuery("");
  }

  invalidate(): void {
    this.revision += 1;
    this.optionFilter.invalidate();
  }

  dispose(): void {
    this.clearTimer();
  }

  hostDisconnected(): void {
    this.dispose();
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
    this.requestUpdate();
  }

  private clearTimer(): void {
    if (this.timer !== undefined) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }
}
