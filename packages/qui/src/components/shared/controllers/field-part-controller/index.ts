import { consumeField, type FieldApi } from "../../helpers/field/context";
import { ContextPartController } from "../context-part-controller";
import { type ReactiveControllerHost } from "../reactive-controller";

/** The field parts that participate in field context. */
export type FieldPart = "label" | "helper-text" | "error-text" | "required-indicator";

export interface FieldPartControllerOptions {
  part: FieldPart;
}

type FieldPartSetup = (field: FieldApi, element: HTMLElement) => (() => void) | undefined;

const setupPart: Record<FieldPart, FieldPartSetup> = {
  label: (field, element) => field.registerLabel(element),
  "helper-text": (field, element) => field.registerHelperText(element),
  "error-text": (field, element) => field.registerErrorText(element),
  "required-indicator": () => undefined,
};

/**
 * Connects a field part to its provider and registers it with the field. The
 * part component owns its rendered id; this controller only tracks the host so
 * the field can target it with ARIA.
 */
export class FieldPartController extends ContextPartController<FieldApi> {
  constructor(host: ReactiveControllerHost, options: FieldPartControllerOptions) {
    super(host, {
      key: "field",
      consume: consumeField,
      setup: (field) => setupPart[options.part](field, host.hostElement),
    });
  }

  get field(): FieldApi | undefined {
    return this.context;
  }
}
