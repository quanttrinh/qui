import { type ReactiveController } from "../shared/reactive-control/controller";

interface TabsControllerOptions {
  getHost: () => HTMLElement;
  getValue: () => string | undefined;
  getDefaultValue: () => string | undefined;
  getActivationMode: () => "manual" | "automatic";
  getLoopFocus: () => boolean;
  getDeselectable: () => boolean;
  onChange: (value: string | undefined) => void;
  requestUpdate: () => void;
}

/** Selection and keyboard navigation for `qui-tabs`. */
export class TabsController implements ReactiveController {
  private readonly options: TabsControllerOptions;
  private current?: string;
  private focused?: string;
  private focusWithin = false;

  constructor(options: TabsControllerOptions) {
    this.options = options;
  }

  public get value(): string | undefined {
    return this.options.getValue() ?? this.current;
  }

  public get focusedValue(): string | undefined {
    return this.focused;
  }

  public get hasFocus(): boolean {
    return this.focusWithin;
  }

  public hostWillLoad(): void {
    const initial = this.options.getDefaultValue() ?? this.options.getValue();
    this.current = initial;
    this.focused = initial;
  }

  public select(value: string): void {
    const selected = this.value;
    const next = this.options.getDeselectable() && selected === value ? undefined : value;
    this.focused = value;
    this.focusWithin = true;
    if (next !== selected) {
      this.current = next;
      this.options.onChange(next);
    }
    this.options.requestUpdate();
  }

  public focus(value: string): void {
    if (this.focused === value && this.focusWithin) {
      return;
    }
    this.focused = value;
    this.focusWithin = true;
    this.options.requestUpdate();
  }

  public blur(): void {
    if (!this.focusWithin && this.focused === undefined) {
      return;
    }
    this.focused = undefined;
    this.focusWithin = false;
    this.options.requestUpdate();
  }

  public move(delta: 1 | -1): void {
    const triggers = this.enabledTriggers();
    if (triggers.length === 0) {
      return;
    }
    const current = this.focusedValue ?? this.value;
    const index = triggers.findIndex((trigger) => trigger.dataset.value === current);
    let next = index + delta;
    if (index === -1) {
      next = delta > 0 ? 0 : triggers.length - 1;
    } else if (next < 0 || next >= triggers.length) {
      if (!this.options.getLoopFocus()) {
        return;
      }
      next = (next + triggers.length) % triggers.length;
    }
    const trigger = triggers.at(next);
    const value = trigger?.dataset.value;
    if (trigger !== undefined && value !== undefined) {
      this.activate(trigger, value);
    }
  }

  public edge(edge: "first" | "last"): void {
    const triggers = this.enabledTriggers();
    const trigger = edge === "first" ? triggers[0] : triggers.at(-1);
    const value = trigger?.dataset.value;
    if (trigger !== undefined && value !== undefined) {
      this.activate(trigger, value);
    }
  }

  private activate(trigger: HTMLButtonElement, value: string): void {
    trigger.focus();
    if (this.options.getActivationMode() === "automatic") {
      this.select(value);
      return;
    }
    this.focus(value);
  }

  private enabledTriggers(): HTMLButtonElement[] {
    return [
      ...this.options
        .getHost()
        .querySelectorAll<HTMLButtonElement>('[role="tab"][data-value]:not(:disabled)'),
    ];
  }
}
