import { type OptionItem } from "../../../helpers/option/option";
import { ControlledControllerBase } from "../../controlled-controller";
import { type ReactiveControllerHost } from "../../reactive-controller";

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
}

/** Selection state shared by select and combobox. */
export class OptionSelectionController<TItem extends OptionItem> extends ControlledControllerBase<
  string[]
> {
  private readonly options: OptionSelectionControllerOptions<TItem>;

  constructor(host: ReactiveControllerHost, options: OptionSelectionControllerOptions<TItem>) {
    super(host, {
      getValue: options.getValue,
      getDefaultValue: () => {
        const value = options.getDefaultValue();
        return value === undefined ? undefined : [...value];
      },
      getFallback: () => [],
      onChange: (value: string[]) => {
        const items = value
          .map((entry) => options.getItems().find((item) => item.value === entry))
          .filter((item): item is TItem => item !== undefined);
        options.onChange({ value: [...value], items });
      },
      copy: (value: string[]) => [...value],
    });
    this.options = options;
  }

  get selected(): string[] {
    return this.value;
  }

  select(value: string): TItem | undefined {
    const items = this.options.getItems();
    const item = items.find((entry) => entry.value === value);
    if (item?.disabled || this.options.isReadOnly()) {
      return undefined;
    }
    this.apply(this.nextValues(value));
    return item;
  }

  /** Applies raw values, e.g. from a custom combobox value. */
  apply(next: readonly string[]): void {
    this.commit([...next]);
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
