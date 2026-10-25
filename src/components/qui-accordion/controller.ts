import { type ReactiveController } from "../shared/reactive-control/controller";

interface AccordionControllerOptions {
  getHost: () => HTMLElement;
  getValue: () => string[] | undefined;
  getDefaultValue: () => string[] | undefined;
  getMultiple: () => boolean;
  getCollapsible: () => boolean;
  getTriggerId: (value: string) => string;
  onChange: (value: string[]) => void;
  requestUpdate: () => void;
}

/** Expanded and focused state for `qui-accordion`. */
export class AccordionController implements ReactiveController {
  private readonly options: AccordionControllerOptions;
  private current: string[] = [];
  private focused?: string;

  constructor(options: AccordionControllerOptions) {
    this.options = options;
  }

  public get value(): string[] {
    return this.options.getValue() ?? this.current;
  }

  public get focusedValue(): string | undefined {
    return this.focused;
  }

  public hostWillLoad(): void {
    const initial = this.options.getDefaultValue() ?? this.options.getValue() ?? [];
    this.current = [...initial];
  }

  public toggle(value: string): void {
    const expanded = this.value.includes(value);
    if (expanded && !this.options.getMultiple() && !this.options.getCollapsible()) {
      return;
    }
    if (expanded) {
      this.commit(this.options.getMultiple() ? this.value.filter((entry) => entry !== value) : []);
      return;
    }
    this.commit(this.options.getMultiple() ? [...this.value, value] : [value]);
  }

  public focus(value: string): void {
    if (this.focused === value) {
      return;
    }
    this.focused = value;
    this.options.requestUpdate();
  }

  public blur(): void {
    if (this.focused === undefined) {
      return;
    }
    this.focused = undefined;
    this.options.requestUpdate();
  }

  public move(fromValue: string, delta: 1 | -1): void {
    const triggers = this.enabledTriggers();
    const index = triggers.findIndex(
      (trigger) => trigger.id === this.options.getTriggerId(fromValue),
    );
    if (index === -1) {
      return;
    }
    triggers.at(index + delta)?.focus();
  }

  public edge(edge: "first" | "last"): void {
    const triggers = this.enabledTriggers();
    const trigger = edge === "first" ? triggers[0] : triggers.at(-1);
    trigger?.focus();
  }

  private commit(value: string[]): void {
    this.current = value;
    this.options.onChange(value);
    this.options.requestUpdate();
  }

  private enabledTriggers(): HTMLButtonElement[] {
    return [
      ...this.options
        .getHost()
        .querySelectorAll<HTMLButtonElement>('[data-part="item-trigger"]:not(:disabled)'),
    ];
  }
}
