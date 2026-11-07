import { type MaskitoPreprocessor } from "@maskito/core";

import { applyTextCase, type TextCase } from "./case";
import { filterNumericOrDecimalInput, type NumericOrDecimalFilterOptions } from "./input-filter";

/** Normalizes case before the mask sees the value. */
export function createTextCasePreprocessor(textCase: TextCase): MaskitoPreprocessor {
  return ({ elementState, data }) => ({
    elementState: {
      ...elementState,
      value: applyTextCase(elementState.value, textCase),
    },
    data,
  });
}

/** Keeps only characters accepted by the numeric or decimal input mode. */
export function createNumericFilterPreprocessor(
  options: NumericOrDecimalFilterOptions,
): MaskitoPreprocessor {
  return ({ elementState, data }) => ({
    elementState: {
      ...elementState,
      value: filterNumericOrDecimalInput(elementState.value, options),
    },
    data,
  });
}
