import type { ReactiveControllerHost } from "../shared/controllers";

import { ControlledControllerBase, FocusState, KeyedHostRegistry } from "../shared/controllers";

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

  /** Return the selected radio, falling back to the first enabled radio. */
  validationInput(): HTMLInputElement | undefined {
    const selected = this.value === undefined ? undefined : this.inputs.get(this.value);
    return (
      (selected !== undefined && !selected.disabled && selected.isConnected
        ? selected
        : undefined) ?? this.inputs.values().find((input) => !input.disabled && input.isConnected)
    );
  }

  /** Focus the selected radio, falling back to the first enabled radio. */
  focusInput(options?: FocusOptions): void {
    this.validationInput()?.focus(options);
  }

  focus(value: string, focusVisible: boolean): void {
    if (this.focusState.focus(value, false, focusVisible)) {
      this.requestNotify();
    }
  }

  blur(): void {
    if (this.focusState.blur()) {
      this.requestNotify();
    }
  }

  protected override onValueChanged(): void {
    this.requestNotify();
  }
}
