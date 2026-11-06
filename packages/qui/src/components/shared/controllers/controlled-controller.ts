import { ReactiveControllerBase, type ReactiveControllerHost } from "./reactive-control/controller";

export interface ControlledControllerOptions<TValue> {
  /** The controlled value, or `undefined` when the state is uncontrolled. */
  getValue: () => TValue | undefined;
  /** The initial value for an uncontrolled state. */
  getDefaultValue?: () => TValue | undefined;
  /** Used when neither a controlled nor a default value is available. */
  getFallback: () => TValue;
  /** Called when `commit()` changes the value. */
  onChange: (value: TValue) => void;
  /** Clones a value before storing it, e.g. for arrays. */
  copy?: (value: TValue) => TValue;
}

/**
 * Base for controllers that own a controlled/uncontrolled value.
 *
 * The controller reads the controlled value first and falls back to internal
 * state. `reset()` and `restore()` are inherited so individual controllers do
 * not need forwarding wrappers.
 */
export abstract class ControlledControllerBase<TValue> extends ReactiveControllerBase {
  private readonly stateOptions: ControlledControllerOptions<TValue>;
  private current: TValue;
  private initial: TValue;

  constructor(host: ReactiveControllerHost, options: ControlledControllerOptions<TValue>) {
    super(host);
    this.stateOptions = options;
    this.current = this.copy(options.getFallback());
    this.initial = this.current;
  }

  /** The controlled value when present, otherwise the internal state. */
  get value(): TValue {
    return this.stateOptions.getValue() ?? this.current;
  }

  /** The value captured by `hostWillLoad()`. */
  get initialValue(): TValue {
    return this.initial;
  }

  hostWillLoad(): void {
    const initial = this.copy(
      this.stateOptions.getDefaultValue?.() ??
        this.stateOptions.getValue() ??
        this.stateOptions.getFallback(),
    );
    this.initial = initial;
    this.current = initial;
  }

  /** Restores the initial value without notifying. */
  reset(): void {
    this.current = this.copy(this.initial);
    this.requestUpdate();
  }

  /** Restores an external value without notifying. */
  restore(value: TValue): void {
    this.current = this.copy(value);
    this.requestUpdate();
  }

  /** Replaces the internal state, notifies, and schedules a render. */
  protected commit(value: TValue): void {
    this.current = this.copy(value);
    this.stateOptions.onChange(this.current);
    this.requestUpdate();
  }

  private copy(value: TValue): TValue {
    return this.stateOptions.copy?.(value) ?? value;
  }
}
