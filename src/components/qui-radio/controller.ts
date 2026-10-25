import { type ReactiveController } from "../shared/reactive-control/controller";

interface RadioGroupControllerOptions {
  getValue: () => string | undefined;
  getDefaultValue: () => string | undefined;
  isDisabled: () => boolean;
  isReadOnly: () => boolean;
  onChange: (value: string | undefined) => void;
  requestUpdate: () => void;
}

/** Selected and focused state for `qui-radio-group`. */
export class RadioGroupController implements ReactiveController {
  private readonly options: RadioGroupControllerOptions;
  private current?: string;
  private initial?: string;
  private focused?: string;
  private focusVisible?: string;

  constructor(options: RadioGroupControllerOptions) {
    this.options = options;
  }

  public get value(): string | undefined {
    return this.options.getValue() ?? this.current;
  }

  public get initialValue(): string | undefined {
    return this.initial;
  }

  public get focusedValue(): string | undefined {
    return this.focused;
  }

  public get focusVisibleValue(): string | undefined {
    return this.focusVisible;
  }

  public hostWillLoad(): void {
    const initial = this.options.getDefaultValue() ?? this.options.getValue();
    this.initial = initial;
    this.current = initial;
  }

  public select(value: string): void {
    if (this.options.isDisabled() || this.options.isReadOnly() || this.value === value) {
      return;
    }
    this.current = value;
    this.options.onChange(value);
    this.options.requestUpdate();
  }

  public focus(value: string, focusVisible: boolean): void {
    if (this.focused === value && this.focusVisible === (focusVisible ? value : undefined)) {
      return;
    }
    this.focused = value;
    this.focusVisible = focusVisible ? value : undefined;
    this.options.requestUpdate();
  }

  public blur(): void {
    if (this.focused === undefined && this.focusVisible === undefined) {
      return;
    }
    this.focused = undefined;
    this.focusVisible = undefined;
    this.options.requestUpdate();
  }

  public reset(): void {
    this.current = this.initial;
    this.options.requestUpdate();
  }

  public restore(value: string | undefined): void {
    this.current = value;
    this.options.requestUpdate();
  }
}
