import { consumeField, type FieldApi } from "../helpers/field/context";
import { ContextPartController } from "./context-part-controller";
import { type ReactiveControllerHost } from "./reactive-controller";

/** The field parts that participate in field context. */
export type FieldPart = "label" | "helper-text" | "error-text" | "required-indicator";

export interface FieldPartControllerOptions {
  part: FieldPart;
  /** Whether to ensure the shadow stylesheet. Defaults to `true` for labels. */
  styles?: boolean;
}

type FieldPartSetup = (field: FieldApi, element: HTMLElement) => (() => void) | undefined;

const setupPart: Record<FieldPart, FieldPartSetup> = {
  label: (field, element) => {
    element.id = field.getLabelProps().id;
    return field.registerLabel(element);
  },
  "helper-text": (field, element) => {
    element.id = field.getHelperTextProps().id;
    return field.registerHelperText(element);
  },
  "error-text": (field, element) => {
    element.id = field.getErrorTextProps().id;
    return field.registerErrorText(element);
  },
  "required-indicator": () => undefined,
};

/**
 * Connects a field part to its provider, assigns its generated id, and
 * registers it with the field.
 */
export class FieldPartController extends ContextPartController<FieldApi> {
  constructor(host: ReactiveControllerHost, options: FieldPartControllerOptions) {
    super(host, {
      key: "field",
      consume: consumeField,
      styles: options.styles ?? options.part === "label",
      setup: (field) => setupPart[options.part](field, host.hostElement),
    });
  }

  get field(): FieldApi | undefined {
    return this.context;
  }
}
