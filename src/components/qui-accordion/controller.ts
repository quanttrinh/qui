import { FocusState } from "../shared/focus-state";
import { KeyedHostRegistry } from "../shared/keyed-host-registry";
import { type ReactiveController } from "../shared/reactive-control/controller";
import {
  RovingFocusRegistry,
  sameTriggerRegistration,
  type TriggerRegistration,
} from "../shared/roving-focus";

interface AccordionControllerOptions {
  getValue: () => string[] | undefined;
  getDefaultValue: () => string[] | undefined;
  getMultiple: () => boolean;
  getCollapsible: () => boolean;
  onChange: (value: string[]) => void;
  requestUpdate: () => void;
}

/** A trigger button registered with the accordion. */
export type AccordionTriggerRegistration = TriggerRegistration;

/** Expanded and focused state for `qui-accordion`. */
export class AccordionController implements ReactiveController {
  private readonly options: AccordionControllerOptions;
  private readonly contents: KeyedHostRegistry<HTMLElement>;
  private readonly triggers: RovingFocusRegistry<AccordionTriggerRegistration>;
  private readonly focusState = new FocusState();
  private current: string[] = [];

  constructor(options: AccordionControllerOptions) {
    this.options = options;
    const onChange = (): void => {
      options.requestUpdate();
    };
    this.contents = new KeyedHostRegistry({ onChange });
    this.triggers = new RovingFocusRegistry({ onChange });
  }

  public get value(): string[] {
    return this.options.getValue() ?? this.current;
  }

  public get focusedValue(): string | undefined {
    return this.focusState.focusedValue;
  }

  public hostWillLoad(): void {
    const initial = this.options.getDefaultValue() ?? this.options.getValue() ?? [];
    this.current = [...initial];
  }

  /** Registers a trigger host and its internal button. Returns an unregister function. */
  public registerTrigger(value: string, host: HTMLElement, trigger: HTMLButtonElement): () => void {
    return this.triggers.register(value, { value, host, trigger }, sameTriggerRegistration);
  }

  /** Registers a content host. Returns an unregister function. */
  public registerContent(value: string, host: HTMLElement): () => void {
    return this.contents.register(value, host);
  }

  /** The registered trigger for `value`. */
  public getTrigger(value: string): AccordionTriggerRegistration | undefined {
    return this.triggers.get(value);
  }

  /** The registered content host for `value`. */
  public getContent(value: string): HTMLElement | undefined {
    return this.contents.get(value);
  }

  /** Moves DOM focus to the internal trigger button for `value`. */
  public focusTrigger(value: string): void {
    this.triggers.focusTrigger(value);
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
    if (this.focusState.focus(value)) {
      this.options.requestUpdate();
    }
  }

  public blur(): void {
    if (this.focusState.blur()) {
      this.options.requestUpdate();
    }
  }

  public move(fromValue: string, delta: 1 | -1): void {
    const triggers = this.triggers.enabled();
    const index = triggers.findIndex((trigger) => trigger.value === fromValue);
    if (index === -1) {
      return;
    }
    triggers.at(index + delta)?.trigger.focus();
  }

  public edge(edge: "first" | "last"): void {
    this.triggers.edge(edge)?.trigger.focus();
  }

  private commit(value: string[]): void {
    this.current = value;
    this.options.onChange(value);
    this.options.requestUpdate();
  }
}
