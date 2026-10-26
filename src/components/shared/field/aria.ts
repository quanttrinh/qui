import { setAriaDescribedBy, setAriaErrorMessage, setAriaLabelledBy } from "../aria";
import { type FieldApi } from "./context";

interface FieldAriaOptions {
  /** Additional same-root elements to include, e.g. an internal label or counter. */
  labelledBy?: readonly Element[];
  describedBy?: readonly Element[];
}

/**
 * Applies a field's host relationships to the control's internal focusable
 * element. The ARIA helpers use element reflection and fall back to same-tree
 * IDREFs where reflection is unavailable.
 */
function applyFieldAria(
  control: HTMLElement | undefined,
  field: FieldApi | undefined,
  options: FieldAriaOptions = {},
): void {
  if (control === undefined) {
    return;
  }
  const label = field?.getLabelHost();
  setAriaLabelledBy(control, [
    ...(label === undefined ? [] : [label]),
    ...(options.labelledBy ?? []),
  ]);
  setAriaDescribedBy(control, [
    ...(field?.getHelperTextHosts() ?? []),
    ...(options.describedBy ?? []),
  ]);
  setAriaErrorMessage(control, [...(field?.getErrorTextHosts() ?? [])]);
}

export { applyFieldAria, type FieldAriaOptions };
