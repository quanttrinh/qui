import {
  maskitoChangeEventPlugin,
  maskitoInitialCalibrationPlugin,
  type MaskitoOptions,
  type MaskitoPreprocessor,
} from "@maskito/core";

import { type TextCase } from "./case";
import { compileMask } from "./mask";
import { compileNumberMask } from "./number-mask";
import { createNumericFilterPreprocessor, createTextCasePreprocessor } from "./preprocessors";

/** Numeric filter modes that also drive Maskito preprocessing. */
export type MaskFilterMode = "numeric" | "decimal";

/** Everything the component needs to know about the active Maskito mask. */
export interface InputMaskConfig {
  /** Cache key describing the settings used to build this configuration. */
  readonly key: string;
  readonly options: MaskitoOptions;
  /** Extracts user-typed characters from an already-masked value. */
  readonly rawFromMasked: (value: string) => string;
}

/** The component state that affects Maskito configuration. */
export interface InputMaskSettings {
  readonly isNumber: boolean;
  readonly mask?: string;
  readonly textCase: TextCase;
  readonly filterMode?: MaskFilterMode;
  readonly allowNegative: boolean;
  readonly numberDecimal: boolean;
}

const PASS_THROUGH_MASK = /^[\s\S]*$/u;
const identity = (value: string): string => value;

function cacheKey(settings: InputMaskSettings): string {
  return [
    settings.isNumber ? "number" : "text",
    settings.mask ?? "",
    settings.textCase,
    settings.filterMode ?? "",
    settings.allowNegative ? "negative" : "positive",
    settings.numberDecimal ? "decimal" : "integer",
  ].join("\u0000");
}

function createNumberMask(settings: InputMaskSettings): MaskitoOptions {
  return compileNumberMask({
    allowNegative: settings.allowNegative,
    decimal: settings.numberDecimal,
  });
}

function createTextMask(settings: InputMaskSettings): Omit<InputMaskConfig, "key"> {
  let maskExpression: MaskitoOptions["mask"] = PASS_THROUGH_MASK;
  let rawFromMasked = identity;

  if (settings.mask !== undefined && settings.mask.length > 0) {
    const compiled = compileMask(settings.mask);
    const { options, rawFromMasked: compiledRaw } = compiled;
    maskExpression = options.mask;
    rawFromMasked = compiledRaw;
  }

  const preprocessors: MaskitoPreprocessor[] = [createTextCasePreprocessor(settings.textCase)];

  const hasTextMask = settings.mask !== undefined && settings.mask.length > 0;
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
  if (previous?.key === key) {
    return previous;
  }

  if (settings.isNumber) {
    return {
      key,
      options: createNumberMask(settings),
      rawFromMasked: identity,
    };
  }

  return { key, ...createTextMask(settings) };
}
