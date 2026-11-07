import {
  maskitoChangeEventPlugin,
  maskitoInitialCalibrationPlugin,
  type MaskitoOptions,
  type MaskitoPreprocessor,
} from "@maskito/core";

import { type TextCase } from "./case";
import { compileMask, extractRawFromMasked } from "./mask";
import { compileNumberMask } from "./number-mask";
import { type NumberSeparators } from "./number-separators";
import { createNumericFilterPreprocessor, createTextCasePreprocessor } from "./preprocessors";

/** Numeric filter modes that also drive Maskito preprocessing. */
export type MaskFilterMode = "numeric" | "decimal";

/** Everything the component needs to know about the active Maskito mask. */
export interface InputMaskConfig {
  /** Cache key describing the settings used to build this configuration. */
  readonly key: string;
  readonly options: MaskitoOptions;
  /** Native mask reference used to invalidate the cache. */
  readonly sourceMask?: MaskitoOptions["mask"];
  /** Extracts user-typed characters from an already-masked value. */
  readonly rawFromMasked: (value: string) => string;
}

/** The component state that affects Maskito configuration. */
export interface InputMaskSettings {
  readonly isNumber: boolean;
  readonly mask?: string;
  readonly maskExpression?: MaskitoOptions["mask"];
  readonly textCase: TextCase;
  readonly filterMode?: MaskFilterMode;
  readonly allowNegative: boolean;
  readonly numberDecimal: boolean;
  readonly numberSeparators: NumberSeparators;
}

const PASS_THROUGH_MASK = /^[\s\S]*$/u;
const identity = (value: string): string => value;

function cacheKey(settings: InputMaskSettings): string {
  const textMask = settings.maskExpression === undefined ? (settings.mask ?? "") : "";
  return [
    settings.isNumber ? "number" : "text",
    textMask,
    settings.textCase,
    settings.filterMode ?? "",
    settings.allowNegative ? "negative" : "positive",
    settings.numberDecimal ? "decimal" : "integer",
    settings.numberSeparators.decimal,
    settings.numberSeparators.group,
  ].join("\u0000");
}

function createNumberMask(settings: InputMaskSettings): MaskitoOptions {
  return compileNumberMask({
    allowNegative: settings.allowNegative,
    decimal: settings.numberDecimal,
    separators: settings.numberSeparators,
  });
}

function createTextMask(settings: InputMaskSettings): Omit<InputMaskConfig, "key"> {
  let maskExpression: MaskitoOptions["mask"] = PASS_THROUGH_MASK;
  let rawFromMasked = identity;

  if (settings.maskExpression !== undefined) {
    const nativeMask = settings.maskExpression;
    maskExpression = nativeMask;
    rawFromMasked = (value: string): string => extractRawFromMasked(value, nativeMask);
  } else if (settings.mask !== undefined && settings.mask.length > 0) {
    const compiled = compileMask(settings.mask);
    const { options, rawFromMasked: compiledRaw } = compiled;
    maskExpression = options.mask;
    rawFromMasked = compiledRaw;
  }

  const preprocessors: MaskitoPreprocessor[] = [createTextCasePreprocessor(settings.textCase)];

  const hasTextMask =
    settings.maskExpression !== undefined ||
    (settings.mask !== undefined && settings.mask.length > 0);
  if (settings.filterMode !== undefined && !hasTextMask) {
    preprocessors.push(
      createNumericFilterPreprocessor({
        allowNegative: settings.allowNegative,
        mode: settings.filterMode,
      }),
    );
  }

  return {
    options: {
      mask: maskExpression,
      preprocessors,
      plugins: [maskitoInitialCalibrationPlugin(), maskitoChangeEventPlugin()],
    },
    rawFromMasked,
  };
}

/**
 * Reuses the previous configuration when its settings have not changed.
 * Number inputs get a Maskito number mask; everything else gets the text mask,
 * case normalization, and optional numeric filtering.
 */
export function resolveInputMaskConfig(
  previous: InputMaskConfig | undefined,
  settings: InputMaskSettings,
): InputMaskConfig {
  const key = cacheKey(settings);
  if (previous?.key === key && previous.sourceMask === settings.maskExpression) {
    return previous;
  }

  if (settings.isNumber) {
    return {
      key,
      sourceMask: settings.maskExpression,
      options: createNumberMask(settings),
      rawFromMasked: identity,
    };
  }

  return { key, sourceMask: settings.maskExpression, ...createTextMask(settings) };
}
