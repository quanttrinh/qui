import { FocusState } from "../shared/focus-state";
import { KeyedHostRegistry } from "../shared/keyed-host-registry";
import { type ReactiveController } from "../shared/reactive-control/controller";
import {
  RovingFocusRegistry,
  sameTriggerRegistration,
  type TriggerRegistration,
} from "../shared/roving-focus";

interface TabsControllerOptions {
  getValue: () => string | undefined;
  getDefaultValue: () => string | undefined;
  getActivationMode: () => "manual" | "automatic";
  getLoopFocus: () => boolean;
  getDeselectable: () => boolean;
  onChange: (value: string | undefined) => void;
  requestUpdate: () => void;
}

/** A trigger button registered with the tabs root. */
export type TabsTriggerRegistration = TriggerRegistration;

const LIST_KEY = "list";

/** Selection and keyboard navigation for `qui-tabs`. */
export class TabsController implements ReactiveController {
  private readonly options: TabsControllerOptions;
  private readonly panels: KeyedHostRegistry<HTMLElement>;
  private readonly triggers: RovingFocusRegistry<TabsTriggerRegistration>;
  private readonly lists: KeyedHostRegistry<HTMLElement>;
  private readonly focusState = new FocusState();
  private current?: string;

  constructor(options: TabsControllerOptions) {
    this.options = options;
    const onChange = (): void => {
      options.requestUpdate();
    };
    this.panels = new KeyedHostRegistry({ onChange });
    this.triggers = new RovingFocusRegistry({ onChange });
    this.lists = new KeyedHostRegistry({ onChange });
  }

  public get value(): string | undefined {
    return this.options.getValue() ?? this.current;
  }

  public get focusedValue(): string | undefined {
    return this.focusState.focusedValue;
  }

  public get hasFocus(): boolean {
    return this.focusState.hasFocus;
  }

  public hostWillLoad(): void {
    const initial = this.options.getDefaultValue() ?? this.options.getValue();
    this.current = initial;
    this.focusState.reset(initial);
  }

  /** Registers a tab list host. Returns an unregister function. */
  public registerList(host: HTMLElement): () => void {
    return this.lists.register(LIST_KEY, host);
  }

  /** Registers a trigger host and its internal button. Returns an unregister function. */
  public registerTrigger(value: string, host: HTMLElement, trigger: HTMLButtonElement): () => void {
    return this.triggers.register(value, { value, host, trigger }, sameTriggerRegistration);
  }

  /** Registers a tab panel host. Returns an unregister function. */
  public registerPanel(value: string, host: HTMLElement): () => void {
    return this.panels.register(value, host);
  }

  /** The registered list host. */
  public getList(): HTMLElement | undefined {
    return this.lists.get(LIST_KEY);
  }

  /** The registered trigger for `value`. */
  public getTrigger(value: string): TabsTriggerRegistration | undefined {
    return this.triggers.get(value);
  }

  /** The registered panel host for `value`. */
  public getPanel(value: string): HTMLElement | undefined {
    return this.panels.get(value);
  }

  /** Moves DOM focus to the internal tab button for `value`. */
  public focusTrigger(value: string): void {
    this.triggers.focusTrigger(value);
  }

  public select(value: string): void {
    const selected = this.value;
    const next = this.options.getDeselectable() && selected === value ? undefined : value;
    this.focusState.focus(value, true);
    if (next !== selected) {
      this.current = next;
      this.options.onChange(next);
    }
    this.options.requestUpdate();
  }

  public focus(value: string): void {
    if (this.focusState.focus(value, true)) {
      this.options.requestUpdate();
    }
  }

  public blur(): void {
    if (this.focusState.blur()) {
      this.options.requestUpdate();
    }
  }

  public move(delta: 1 | -1): void {
    const triggers = this.triggers.enabled();
    if (triggers.length === 0) {
      return;
    }
    const current = this.focusedValue ?? this.value;
    const index = triggers.findIndex((trigger) => trigger.value === current);
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
    if (trigger !== undefined) {
      this.activate(trigger.trigger, trigger.value);
    }
  }

  public edge(edge: "first" | "last"): void {
    const trigger = this.triggers.edge(edge);
    if (trigger !== undefined) {
      this.activate(trigger.trigger, trigger.value);
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
}
