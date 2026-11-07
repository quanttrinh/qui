import { type FormValidity } from "../shared/controllers";
import { numberValidity, type NumberConstraints } from "./number-mask";

export interface InputValidityOptions {
  readonly element?: HTMLInputElement;
  readonly invalid: boolean;
  readonly required: boolean;
  readonly numberConstraints?: NumberConstraints;
}

export interface InputFormSignatureOptions {
  readonly element?: HTMLInputElement;
  readonly required: boolean;
  readonly invalid: boolean;
  readonly validity: FormValidity;
}

function activeFlags(validity: FormValidity): string {
  return Object.entries(validity.flags)
    .filter(([, value]) => value === true)
    .map(([flag]) => flag)
    .toSorted()
    .join(",");
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
    numberConstraints === undefined ? undefined : numberValidity(element.value, numberConstraints);
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

/** Builds the cached signature used by `FormController`. */
export function resolveInputFormSignature({
  element,
  required,
  invalid,
  validity,
}: InputFormSignatureOptions): string {
  return `${element?.value ?? ""}\u0001${required ? 1 : 0}\u0001${invalid ? 1 : 0}\u0001${activeFlags(validity)}\u0001${validity.message ?? ""}`;
}
