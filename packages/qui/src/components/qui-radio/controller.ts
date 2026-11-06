import { ControlledControllerBase } from "../shared/controllers/controlled-controller";
import { FocusState } from "../shared/controllers/focus-state";
import { KeyedHostRegistry } from "../shared/controllers/keyed-host-registry";
import { type ReactiveControllerHost } from "../shared/controllers/reactive-control/controller";

interface RadioGroupControllerOptions {
  getValue: () => string | undefined;
  getDefaultValue: () => string | undefined;
  isDisabled: () => boolean;
  isReadOnly: () => boolean;
  onChange: (value: string | undefined) => void;
}

/** Selected and focused state for `qui-radio-group`. */
export class RadioGroupController extends ControlledControllerBase<string | undefined> {
  private readonly options: RadioGroupControllerOptions;
  private readonly focusState = new FocusState();
  private readonly inputs = new KeyedHostRegistry<HTMLInputElement>();

  constructor(host: ReactiveControllerHost, options: RadioGroupControllerOptions) {
    super(host, {
      getValue: options.getValue,
      getDefaultValue: options.getDefaultValue,
      getFallback: () => undefined,
      onChange: options.onChange,
    });
    this.options = options;
  }

  get focusedValue(): string | undefined {
    return this.focusState.focusedValue;
  }

  get focusVisibleValue(): string | undefined {
    return this.focusState.focusVisibleValue;
  }

  select(value: string): void {
    if (this.options.isDisabled() || this.options.isReadOnly() || this.value === value) {
      return;
    }
    this.commit(value);
  }

  /** Register a radio input so the group can focus it from a field label. */
  registerInput(value: string, input: HTMLInputElement): () => void {
    return this.inputs.register(value, input);
  }

  /** Focus the selected radio, falling back to the first enabled radio. */
  focusInput(options?: FocusOptions): void {
    const selected = this.value === undefined ? undefined : this.inputs.get(this.value);
    const target =
      selected !== undefined && !selected.disabled && selected.isConnected
        ? selected
        : this.inputs.values().find((input) => !input.disabled && input.isConnected);
    target?.focus(options);
  }

  focus(value: string, focusVisible: boolean): void {
    if (this.focusState.focus(value, false, focusVisible)) {
      this.requestUpdate();
    }
  }

  blur(): void {
    if (this.focusState.blur()) {
      this.requestUpdate();
    }
  }
}
