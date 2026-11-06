import {
  maskitoChangeEventPlugin,
  maskitoInitialCalibrationPlugin,
  type MaskitoOptions,
  type MaskitoPostprocessor,
  type MaskitoPreprocessor,
} from "@maskito/core";

export interface NumberMaskOptions {
  readonly allowNegative: boolean;
  readonly decimal: boolean;
}

export interface NumberConstraints {
  min?: number;
  max?: number;
  step?: number;
}

export interface NumberValidation {
  flags: ValidityStateFlags;
  message?: string;
}

function trimLeadingZeros(value: string): string {
  const negative = value.startsWith("-");
  const body = negative ? value.slice(1) : value;
  if (body === "") {
    return negative ? "-" : "";
  }

  const [integer = "", ...fraction] = body.split(".");
  const digits = integer.replace(/^0+(?=\d)/u, "") || "0";
  return `${negative ? "-" : ""}${digits}${fraction.length > 0 ? `.${fraction.join("")}` : ""}`;
}

/**
 * Normalizes free-form text into a plain number: optional leading minus, one
 * decimal separator, and no grouping.
 */
export function normalizeNumberValue(raw: string, options: NumberMaskOptions): string {
  let result = "";
  let hasSeparator = false;

  for (const char of raw) {
    if (char >= "0" && char <= "9") {
      result += char;
    } else if (char === "-" && options.allowNegative && result === "") {
      result = "-";
    } else if (options.decimal && (char === "." || char === ",") && !hasSeparator) {
      result = result === "" || result === "-" ? `${result}0` : result;
      result += ".";
      hasSeparator = true;
    }
  }

  return trimLeadingZeros(result);
}

function buildMask({ allowNegative, decimal }: NumberMaskOptions): RegExp {
  const sign = allowNegative ? "-?" : "";
  const fraction = decimal ? String.raw`(?:\.\d*)?` : "";
  return new RegExp(`^${sign}\\d*${fraction}$`, "u");
}

function sanitizeData(data: string, options: NumberMaskOptions): string {
  if (data === "-") {
    return options.allowNegative ? "-" : "";
  }
  if (data === "." || data === ",") {
    return options.decimal ? "." : "";
  }
  return normalizeNumberValue(data, options);
}

/** A minimal Maskito number mask without locale grouping. */
export function compileNumberMask(options: NumberMaskOptions): MaskitoOptions {
  const preprocessor: MaskitoPreprocessor = ({ elementState, data }) => ({
    elementState: {
      ...elementState,
      value: normalizeNumberValue(elementState.value, options),
    },
    data: sanitizeData(data, options),
  });
  const postprocessor: MaskitoPostprocessor = (elementState) => ({
    ...elementState,
    value: normalizeNumberValue(elementState.value, options),
  });

  return {
    mask: buildMask(options),
    preprocessors: [preprocessor],
    postprocessors: [postprocessor],
    plugins: [maskitoInitialCalibrationPlugin(), maskitoChangeEventPlugin()],
  };
}

/** Parses a numeric mask value without locale grouping. */
export function parseNumber(value: string): number {
  const normalized = value.trim().replace(",", ".");
  if (normalized === "" || normalized === "-" || normalized === "." || normalized === "-.") {
    return Number.NaN;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

/** Formats a stepped number without floating-point noise. */
export function formatNumber(value: number): string {
  return Number.isFinite(value) ? String(Number(value.toFixed(10))) : "";
}

function rejectionMessage(value: number, constraints: NumberConstraints): string | undefined {
  if (constraints.min !== undefined && value < constraints.min) {
    return `Value must be greater than or equal to ${String(constraints.min)}.`;
  }
  if (constraints.max !== undefined && value > constraints.max) {
    return `Value must be less than or equal to ${String(constraints.max)}.`;
  }
  return undefined;
}

/** Validates a numeric mask value against the same bounds used by the stepper. */
export function numberValidity(value: string, constraints: NumberConstraints): NumberValidation {
  const parsed = parseNumber(value);
  const flags: ValidityStateFlags = {};
  if (value !== "" && Number.isNaN(parsed)) {
    return { flags: { badInput: true }, message: "Please enter a valid number." };
  }
  if (Number.isNaN(parsed)) {
    return { flags };
  }

  const message = rejectionMessage(parsed, constraints);
  if (constraints.min !== undefined && parsed < constraints.min) {
    flags.rangeUnderflow = true;
  }
  if (constraints.max !== undefined && parsed > constraints.max) {
    flags.rangeOverflow = true;
  }

  const { step } = constraints;
  if (step !== undefined && step > 0) {
    const base = constraints.min ?? 0;
    const steps = (parsed - base) / step;
    if (Math.abs(steps - Math.round(steps)) > 1e-9) {
      flags.stepMismatch = true;
      return {
        flags,
        message:
          base === 0
            ? `Value must be a multiple of ${String(step)}.`
            : `Value must be ${String(base)} plus a multiple of ${String(step)}.`,
      };
    }
  }

  return { flags, message };
}

/** Whether the value can move one step in the requested direction. */
export function canStepNumber(
  value: string,
  direction: 1 | -1,
  constraints: Pick<NumberConstraints, "min" | "max">,
): boolean {
  const parsed = parseNumber(value);
  if (Number.isNaN(parsed)) {
    return true;
  }
  const limit = direction > 0 ? constraints.max : constraints.min;
  if (limit === undefined) {
    return true;
  }
  return direction > 0 ? parsed < limit : parsed > limit;
}

/** Snaps a numeric value one step in the requested direction. */
export function stepNumber(
  current: number,
  direction: 1 | -1,
  constraints: NumberConstraints,
): number {
  const { step } = constraints;
  let next = current + direction;
  if (step !== undefined && step > 0) {
    const base = constraints.min ?? 0;
    const steps = (current - base) / step;
    const nextSteps = direction > 0 ? Math.floor(steps) + 1 : Math.ceil(steps) - 1;
    next = base + nextSteps * step;
  }
  if (constraints.min !== undefined) {
    next = Math.max(constraints.min, next);
  }
  if (constraints.max !== undefined) {
    next = Math.min(constraints.max, next);
  }
  return Number(next.toFixed(10));
}
