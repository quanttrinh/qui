import { type MaskitoPreprocessor } from "@maskito/core";

import { applyTextCase, type TextCase } from "./case";
import {
  appendAcceptedNumericOrDecimalCharacter,
  filterNumericOrDecimalInput,
  type NumericOrDecimalFilterOptions,
} from "./input-filter";

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

function filterIncomingData(
  valueBeforeCaret: string,
  data: string,
  options: NumericOrDecimalFilterOptions,
): string {
  let acceptedValue = valueBeforeCaret;
  let acceptedData = "";

  for (const character of data) {
    const next = appendAcceptedNumericOrDecimalCharacter(acceptedValue, character, options);
    if (next !== undefined) {
      acceptedData += next.slice(acceptedValue.length);
      acceptedValue = next;
    }
  }

  return acceptedData;
}

/** Keeps only characters accepted by the numeric or decimal input mode. */
export function createNumericFilterPreprocessor(
  options: NumericOrDecimalFilterOptions,
): MaskitoPreprocessor {
  return ({ elementState, data }) => {
    const [from, to] = elementState.selection;
    const value = filterNumericOrDecimalInput(elementState.value, options);
    const valueBeforeCaret = filterNumericOrDecimalInput(
      elementState.value.slice(0, from),
      options,
    );
    const valueBeforeSelectionEnd =
      from === to
        ? valueBeforeCaret
        : filterNumericOrDecimalInput(elementState.value.slice(0, to), options);

    return {
      elementState: {
        value,
        selection: [valueBeforeCaret.length, valueBeforeSelectionEnd.length],
      },
      data: filterIncomingData(valueBeforeCaret, data, options),
    };
  };
}
