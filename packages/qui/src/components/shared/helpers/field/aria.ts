import { setAriaDescribedBy, setAriaErrorMessage, setAriaLabelledBy } from "../aria/aria";
import { type FieldApi } from "./context";

interface FieldAriaOptions {
  /** Additional same-root elements to include, e.g. an internal label or counter. */
  labelledBy?: readonly Element[];
  describedBy?: readonly Element[];
}

const EMPTY: readonly Element[] = [];

/**
 * Applies a field's host relationships to the control's internal focusable
 * element. The ARIA helpers use element reflection and fall back to same-tree
 * IDREFs where reflection is unavailable, and skip writes while the
 * relationship is unchanged.
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
  const extraLabelledBy = options.labelledBy ?? EMPTY;
  const helperTexts = field?.getHelperTextHosts() ?? EMPTY;
  const extraDescribedBy = options.describedBy ?? EMPTY;
  const errorTexts = field?.getErrorTextHosts() ?? EMPTY;

  setAriaLabelledBy(control, [...(label === undefined ? EMPTY : [label]), ...extraLabelledBy]);
  setAriaDescribedBy(control, [...helperTexts, ...extraDescribedBy]);
  setAriaErrorMessage(control, [...errorTexts]);
}

export { applyFieldAria, type FieldAriaOptions };
