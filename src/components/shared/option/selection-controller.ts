import { type ReactiveController } from "../reactive-control/controller";
import { type OptionItem } from "./option";

interface OptionSelectionChangeDetails<TItem extends OptionItem> {
  value: string[];
  items: TItem[];
}

interface OptionSelectionControllerOptions<TItem extends OptionItem> {
  getValue: () => string[] | undefined;
  getDefaultValue: () => readonly string[] | undefined;
  getItems: () => readonly TItem[];
  getMultiple: () => boolean;
  getDeselectable: () => boolean;
  isReadOnly: () => boolean;
  onChange: (details: OptionSelectionChangeDetails<TItem>) => void;
  requestUpdate: () => void;
}

/** Selection state shared by select and combobox. */
export class OptionSelectionController<TItem extends OptionItem> implements ReactiveController {
  private readonly options: OptionSelectionControllerOptions<TItem>;
  private state: string[] = [];
  private initial: string[] = [];

  constructor(options: OptionSelectionControllerOptions<TItem>) {
    this.options = options;
  }

  public get selected(): string[] {
    return this.options.getValue() ?? this.state;
  }

  public hostWillLoad(): void {
    const initial = this.options.getDefaultValue() ?? this.options.getValue() ?? [];
    this.initial = [...initial];
    this.state = [...initial];
  }

  public select(value: string): TItem | undefined {
    const items = this.options.getItems();
    const item = items.find((entry) => entry.value === value);
    if (item?.disabled === true || this.options.isReadOnly()) {
      return undefined;
    }
    this.apply(this.nextValues(value));
    return item;
  }

  /** Applies raw values, e.g. from a custom combobox value. */
  public apply(next: readonly string[]): void {
    this.state = [...next];
    const items = next
      .map((value) => this.options.getItems().find((item) => item.value === value))
      .filter((item): item is TItem => item !== undefined);
    this.options.onChange({ value: [...next], items });
    this.options.requestUpdate();
  }

  public reset(): void {
    this.state = [...this.initial];
    this.options.requestUpdate();
  }

  public restore(values: readonly string[]): void {
    this.state = [...values];
    this.options.requestUpdate();
  }

  private nextValues(value: string): string[] {
    const { selected } = this;
    if (this.options.getMultiple()) {
      return selected.includes(value)
        ? selected.filter((entry) => entry !== value)
        : [...selected, value];
    }
    if (this.options.getDeselectable() && selected.includes(value)) {
      return [];
    }
    return [value];
  }
}
