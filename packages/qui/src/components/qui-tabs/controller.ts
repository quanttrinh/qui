import {
  ControlledControllerBase,
  FocusState,
  KeyedHostRegistry,
  moveIndex,
  RovingFocusRegistry,
  sameTriggerRegistration,
  type ReactiveControllerHost,
  type TriggerRegistration,
} from "../shared/controllers";
import { uniqueValues } from "../shared/helpers/collection";

interface TabsControllerOptions {
  getValue: () => string | undefined;
  getDefaultValue: () => string | undefined;
  getActivationMode: () => "manual" | "automatic";
  getLoopFocus: () => boolean;
  getDeselectable: () => boolean;
  onChange: (value: string | undefined) => void;
}

/** A trigger button registered with the tabs root. */
export type TabsTriggerRegistration = TriggerRegistration;

const LIST_KEY = "list";

/** Selection and keyboard navigation for `qui-tabs`. */
export class TabsController extends ControlledControllerBase<string | undefined> {
  private readonly options: TabsControllerOptions;
  private readonly panels: KeyedHostRegistry<HTMLElement>;
  private readonly triggers: RovingFocusRegistry<TabsTriggerRegistration>;
  private readonly lists: KeyedHostRegistry<HTMLElement>;
  private readonly focusState = new FocusState();

  constructor(host: ReactiveControllerHost, options: TabsControllerOptions) {
    super(host, {
      getValue: options.getValue,
      getDefaultValue: options.getDefaultValue,
      getFallback: () => undefined,
      onChange: options.onChange,
    });
    this.options = options;
    const onChange = (value?: string): void => {
      this.requestNotify(value === undefined ? undefined : [value]);
    };
    this.panels = new KeyedHostRegistry({ onChange });
    this.triggers = new RovingFocusRegistry({ onChange });
    this.lists = new KeyedHostRegistry({ onChange });
  }

  get focusedValue(): string | undefined {
    return this.focusState.focusedValue;
  }

  get hasFocus(): boolean {
    return this.focusState.hasFocus;
  }

  hostWillLoad(): void {
    super.hostWillLoad();
    this.focusState.reset(this.initialValue);
  }

  /** Registers a tab list host. Returns an unregister function. */
  registerList(host: HTMLElement): () => void {
    return this.lists.register(LIST_KEY, host);
  }

  /** Registers a trigger host and its internal button. Returns an unregister function. */
  registerTrigger(value: string, host: HTMLElement, trigger: HTMLButtonElement): () => void {
    return this.triggers.register(value, { value, host, trigger }, sameTriggerRegistration);
  }

  /** Registers a tab panel host. Returns an unregister function. */
  registerPanel(value: string, host: HTMLElement): () => void {
    return this.panels.register(value, host);
  }

  /** The registered list host. */
  getList(): HTMLElement | undefined {
    return this.lists.get(LIST_KEY);
  }

  /** The registered trigger for `value`. */
  getTrigger(value: string): TabsTriggerRegistration | undefined {
    return this.triggers.get(value);
  }

  /** The registered panel host for `value`. */
  getPanel(value: string): HTMLElement | undefined {
    return this.panels.get(value);
  }

  /** Moves DOM focus to the internal tab button for `value`. */
  focusTrigger(value: string): void {
    this.triggers.focusTrigger(value);
  }

  /** Clears cached trigger state after a trigger's disabled state changes. */
  invalidateTriggers(): void {
    this.triggers.invalidate();
  }

  select(value: string): void {
    const previousFocus = this.focusState.focusedValue;
    const selected = this.value;
    const next = this.options.getDeselectable() && selected === value ? undefined : value;
    const focusChanged = this.focusState.focus(value, true);
    if (focusChanged && previousFocus !== undefined && previousFocus !== value) {
      // Programmatic selection can move focus without a focus event; update the old part.
      this.requestUpdate(uniqueValues(previousFocus));
    }
    if (next !== selected) {
      this.commit(next);
      return;
    }
    if (focusChanged) {
      // The root template shows focus-within, so keep rendering for it.
      this.requestUpdate(uniqueValues(value));
    }
  }

  focus(value: string): void {
    const previous = this.focusState.focusedValue;
    if (this.focusState.focus(value, true)) {
      this.requestUpdate(uniqueValues(previous, value));
    }
  }

  blur(): void {
    const previous = this.focusState.focusedValue;
    if (this.focusState.blur()) {
      this.requestUpdate(uniqueValues(previous));
    }
  }

  protected override onValueChanged(previous?: string, next?: string): void {
    this.requestUpdate(uniqueValues(previous, next));
  }

  move(delta: 1 | -1): void {
    const triggers = this.triggers.enabled();
    if (triggers.length === 0) {
      return;
    }
    const current = this.focusedValue ?? this.value;
    const index = triggers.findIndex((trigger) => trigger.value === current);
    const next = moveIndex(triggers, index, {
      delta,
      loop: this.options.getLoopFocus(),
    });
    if (next === undefined) {
      return;
    }
    const trigger = triggers[next];
    this.activate(trigger.trigger, trigger.value);
  }

  edge(edge: "first" | "last"): void {
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
