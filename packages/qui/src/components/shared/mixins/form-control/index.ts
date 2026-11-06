import { type MixedInCtor } from "@stencil/core";

import { type FormController } from "../../controllers/form-controller";

/* oxlint-disable typescript/method-signature-style -- Mixin instance members are methods so subclasses can override them. */
export interface FormControlMixinInstance {
  formResetCallback(): void;
  formDisabledCallback(disabled: boolean): void;
  formStateRestoreCallback(state: string | File | FormData | null): void;
}

/**
 * Mixin that forwards the browser form-associated callbacks to a form control's
 * `FormController`.
 *
 * Compose it after `ControllerHostMixin`:
 *
 * ```ts
 * class MyComponent extends Mixin(ControllerHostMixin, FormControlMixin) {}
 * ```
 */
const FormControlMixin = (Base: MixedInCtor): MixedInCtor<FormControlMixinInstance> =>
  class extends Base {
    declare protected readonly form: FormController;

    formResetCallback(): void {
      this.form.reset();
    }

    formDisabledCallback(disabled: boolean): void {
      this.form.setDisabled(disabled);
    }

    formStateRestoreCallback(state: string | File | FormData | null): void {
      this.form.restore(state);
    }
  };

export { FormControlMixin };
