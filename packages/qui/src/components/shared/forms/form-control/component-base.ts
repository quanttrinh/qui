import { ReactiveControlBase } from "../../controllers/reactive-control/component-base";

/** Callbacks every form-associated controller exposes. */
export interface FormControl {
  reset: () => void;
  setDisabled: (disabled: boolean) => void;
  restore: (state: string | File | FormData | null) => void;
}

/** Base class for form-associated controls. */
export abstract class FormControlBase extends ReactiveControlBase {
  protected abstract readonly formController: FormControl;

  formResetCallback(): void {
    this.formController.reset();
  }

  formDisabledCallback(disabled: boolean): void {
    this.formController.setDisabled(disabled);
  }

  formStateRestoreCallback(state: string | File | FormData | null): void {
    this.formController.restore(state);
  }
}
