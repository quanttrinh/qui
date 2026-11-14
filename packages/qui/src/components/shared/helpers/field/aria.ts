import { setAriaDescribedBy, setAriaErrorMessage, setAriaLabelledBy } from "../aria/aria";
import { type FieldApi } from "./context";

interface FieldAriaOptions {
  /** Additional same-root elements to include, e.g. an internal label or counter. */
  labelledBy?: readonly Element[];
  describedBy?: readonly Element[];
}

interface RefSequence {
  readonly elements: readonly Element[];
  readonly ids: readonly string[];
}

interface AppliedTargets {
  label: Element | undefined;
  labelId: string | undefined;
  labelledBy: RefSequence;
  describedBy: RefSequence;
  helperTexts: RefSequence;
  errorTexts: RefSequence;
}

const EMPTY: readonly Element[] = [];
const appliedTargets = new WeakMap<HTMLElement, AppliedTargets>();

function captureTargets(elements: readonly Element[]): RefSequence {
  return { elements: [...elements], ids: elements.map((element) => element.id) };
}

function sameTargets(previous: RefSequence, next: readonly Element[]): boolean {
  return (
    previous.elements.length === next.length &&
    next.every(
      (element, index) =>
        previous.elements[index] === element && previous.ids[index] === element.id,
    )
  );
}

/**
 * Applies a field's host relationships to the control's internal focusable
 * element. The ARIA helpers use element reflection and fall back to same-tree
 * IDREFs where reflection is unavailable.
 *
 * The resolved targets and their ids are cached per control, so repeated calls
 * after a render skip the lookups and array building when no relationship
 * changed. Ids are included because the IDREF fallback depends on them.
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

  const previous = appliedTargets.get(control);
  if (
    previous !== undefined &&
    previous.label === label &&
    previous.labelId === label?.id &&
    sameTargets(previous.labelledBy, extraLabelledBy) &&
    sameTargets(previous.helperTexts, helperTexts) &&
    sameTargets(previous.describedBy, extraDescribedBy) &&
    sameTargets(previous.errorTexts, errorTexts)
  ) {
    return;
  }

  appliedTargets.set(control, {
    label,
    labelId: label?.id,
    labelledBy: captureTargets(extraLabelledBy),
    describedBy: captureTargets(extraDescribedBy),
    helperTexts: captureTargets(helperTexts),
    errorTexts: captureTargets(errorTexts),
  });

  setAriaLabelledBy(control, [...(label === undefined ? EMPTY : [label]), ...extraLabelledBy]);
  setAriaDescribedBy(control, [...helperTexts, ...extraDescribedBy]);
  setAriaErrorMessage(control, [...errorTexts]);
}

export { applyFieldAria, type FieldAriaOptions };
