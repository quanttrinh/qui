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

interface AccordionControllerOptions {
  getValue: () => string[] | undefined;
  getDefaultValue: () => string[] | undefined;
  getMultiple: () => boolean;
  getCollapsible: () => boolean;
  onChange: (value: string[]) => void;
}

/** A trigger button registered with the accordion. */
export type AccordionTriggerRegistration = TriggerRegistration;

/** Expanded and focused state for `qui-accordion`. */
export class AccordionController extends ControlledControllerBase<string[]> {
  private readonly options: AccordionControllerOptions;
  private readonly contents: KeyedHostRegistry<HTMLElement>;
  private readonly triggers: RovingFocusRegistry<AccordionTriggerRegistration>;
  private readonly focusState = new FocusState();

  constructor(host: ReactiveControllerHost, options: AccordionControllerOptions) {
    super(host, {
      getValue: options.getValue,
      getDefaultValue: options.getDefaultValue,
      getFallback: () => [],
      onChange: options.onChange,
      copy: (value: string[]) => [...value],
    });
    this.options = options;
    const onChange = (): void => {
      this.requestUpdate();
    };
    this.contents = new KeyedHostRegistry({ onChange });
    this.triggers = new RovingFocusRegistry({ onChange });
  }

  get focusedValue(): string | undefined {
    return this.focusState.focusedValue;
  }

  /** Registers a trigger host and its internal button. Returns an unregister function. */
  registerTrigger(value: string, host: HTMLElement, trigger: HTMLButtonElement): () => void {
    return this.triggers.register(value, { value, host, trigger }, sameTriggerRegistration);
  }

  /** Registers a content host. Returns an unregister function. */
  registerContent(value: string, host: HTMLElement): () => void {
    return this.contents.register(value, host);
  }

  /** The registered trigger for `value`. */
  getTrigger(value: string): AccordionTriggerRegistration | undefined {
    return this.triggers.get(value);
  }

  /** The registered content host for `value`. */
  getContent(value: string): HTMLElement | undefined {
    return this.contents.get(value);
  }

  /** Moves DOM focus to the internal trigger button for `value`. */
  focusTrigger(value: string): void {
    this.triggers.focusTrigger(value);
  }

  toggle(value: string): void {
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

  focus(value: string): void {
    if (this.focusState.focus(value)) {
      this.requestUpdate();
    }
  }

  blur(): void {
    if (this.focusState.blur()) {
      this.requestUpdate();
    }
  }

  move(fromValue: string, delta: 1 | -1): void {
    const triggers = this.triggers.enabled();
    const index = triggers.findIndex((trigger) => trigger.value === fromValue);
    if (index === -1) {
      return;
    }
    const next = moveIndex(triggers, index, { delta });
    if (next !== undefined) {
      triggers[next]?.trigger.focus();
    }
  }

  edge(edge: "first" | "last"): void {
    this.triggers.edge(edge)?.trigger.focus();
  }
}
