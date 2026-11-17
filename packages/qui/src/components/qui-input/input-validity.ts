import type { FormValidity } from "../shared/controllers";
import type { NumberConstraints } from "./number-mask";

import { numberValidity } from "./number-mask";

export interface InputValidityOptions {
  readonly element?: HTMLInputElement;
  readonly invalid: boolean;
  readonly required: boolean;
  readonly numberConstraints?: NumberConstraints;
  /** Allows incomplete number values while the user is editing. */
  readonly allowPartialNumber?: boolean;
}

export interface InputValidityKeyOptions {
  readonly element?: HTMLInputElement;
  readonly inputType: string;
  readonly inputPattern?: string;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly invalid: boolean;
  readonly required: boolean;
  readonly numberConstraints?: NumberConstraints;
  readonly focused: boolean;
}

function nativeValidityKey(element?: HTMLInputElement): string {
  const native = element?.validity;
  if (native === undefined) {
    return "";
  }
  const flags = [
    native.badInput,
    native.customError,
    native.patternMismatch,
    native.rangeOverflow,
    native.rangeUnderflow,
    native.stepMismatch,
    native.tooLong,
    native.tooShort,
    native.typeMismatch,
    native.valid,
    native.valueMissing,
  ]
    .map((value) => (value ? "1" : "0"))
    .join("");
  return `${flags}\u0000${element?.validationMessage ?? ""}`;
}

/** Builds the key used to memoize input validity. */
export function resolveInputValidityKey({
  element,
  inputType,
  inputPattern,
  minLength,
  maxLength,
  invalid,
  required,
  numberConstraints,
  focused,
}: InputValidityKeyOptions): string {
  return [
    element?.value ?? "",
    nativeValidityKey(element),
    inputType,
    inputPattern ?? "",
    String(minLength ?? ""),
    String(maxLength ?? ""),
    invalid ? "1" : "0",
    required ? "1" : "0",
    String(numberConstraints?.min ?? ""),
    String(numberConstraints?.max ?? ""),
    String(numberConstraints?.step ?? ""),
    focused ? "focused" : "blurred",
  ].join("\u0000");
}

function mergeNumberFlags(
  native: ValidityState,
  number: ReturnType<typeof numberValidity> | undefined,
): ValidityStateFlags {
  return {
    badInput: native.badInput || number?.flags.badInput,
    customError: native.customError || number?.flags.customError,
    patternMismatch: native.patternMismatch,
    rangeOverflow: native.rangeOverflow || number?.flags.rangeOverflow,
    rangeUnderflow: native.rangeUnderflow || number?.flags.rangeUnderflow,
    stepMismatch: native.stepMismatch || number?.flags.stepMismatch,
    tooLong: native.tooLong,
    tooShort: native.tooShort,
    typeMismatch: native.typeMismatch,
    valueMissing: native.valueMissing,
  };
}

/** Combines native validity with the component's number constraints. */
export function resolveInputValidity({
  element,
  invalid,
  required,
  numberConstraints,
  allowPartialNumber = false,
}: InputValidityOptions): FormValidity {
  if (element === undefined) {
    return { flags: {} };
  }
  if (invalid) {
    return { flags: { customError: true }, message: "Invalid value", element };
  }
  if (required && element.value === "") {
    return {
      flags: { valueMissing: true },
      message: "Please fill out this field.",
      element,
    };
  }

  const number =
    numberConstraints === undefined
      ? undefined
      : numberValidity(element.value, numberConstraints, {
          allowPartial: allowPartialNumber,
        });
  const flags = mergeNumberFlags(element.validity, number);
  if (!Object.values(flags).some((flag) => flag === true)) {
    return { flags: {} };
  }

  return {
    flags,
    message: number?.message ?? element.validationMessage,
    element,
  };
}
