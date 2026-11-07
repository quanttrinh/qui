import {
  canStepNumber,
  formatNumber,
  parseNumber,
  stepNumber,
  type NumberConstraints,
} from "./number-mask";

export type { NumberConstraints } from "./number-mask";

const HOLD_DELAY_MS = 400;
const HOLD_INTERVAL_MS = 80;

export interface NumberStepperOptions {
  getInput: () => HTMLInputElement | undefined;
  getConstraints: () => NumberConstraints;
  getDisabled: () => boolean;
  getReadOnly: () => boolean;
}

/** Pointer-driven stepping with press-and-hold repeat. */
export class NumberStepper {
  private holdTimer?: ReturnType<typeof setTimeout>;
  private repeatTimer?: ReturnType<typeof setInterval>;

  private readonly options: NumberStepperOptions;

  constructor(options: NumberStepperOptions) {
    this.options = options;
  }

  get canIncrement(): boolean {
    return this.canStepValue(1);
  }

  get canDecrement(): boolean {
    return this.canStepValue(-1);
  }

  /** Steps once without starting hold-to-repeat. */
  stepOnce(direction: 1 | -1): void {
    this.step(direction);
  }

  /** Steps once, then keeps stepping while the trigger stays pressed. */
  startHold(direction: 1 | -1): void {
    this.stop();
    this.step(direction);
    this.holdTimer = setTimeout(() => {
      this.repeatTimer = setInterval(() => {
        if (!this.canStep(direction)) {
          this.stop();
          return;
        }
        this.step(direction);
      }, HOLD_INTERVAL_MS);
    }, HOLD_DELAY_MS);
  }

  /** Stops any pending or repeating step. */
  stop(): void {
    if (this.holdTimer !== undefined) {
      clearTimeout(this.holdTimer);
      this.holdTimer = undefined;
    }
    if (this.repeatTimer !== undefined) {
      clearInterval(this.repeatTimer);
      this.repeatTimer = undefined;
    }
  }

  private canStep(direction: 1 | -1): boolean {
    return (
      !this.options.getDisabled() && !this.options.getReadOnly() && this.canStepValue(direction)
    );
  }

  private canStepValue(direction: 1 | -1): boolean {
    const input = this.options.getInput();
    return canStepNumber(input?.value ?? "", direction, this.options.getConstraints());
  }

  private step(direction: 1 | -1): void {
    const input = this.options.getInput();
    if (input === undefined) {
      return;
    }

    const parsed = parseNumber(input.value);
    const next = stepNumber(
      Number.isNaN(parsed) ? 0 : parsed,
      direction,
      this.options.getConstraints(),
    );
    const value = formatNumber(next);
    if (value === input.value) {
      return;
    }

    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }
}
