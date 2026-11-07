import { type MaskitoMaskExpression, type MaskitoOptions } from "@maskito/core";

/** A compiled mask plus the helper the input needs to report raw values. */
export interface CompiledMask {
  options: MaskitoOptions;
  /** Extracts user-typed characters from an already-masked value. */
  rawFromMasked: (value: string) => string;
}

const DIGIT = /\d/u;
const LETTER = /[a-z]/iu;
const WORD = /[a-z0-9_]/iu;
const ANY = /[^\r\n]/u;

const EXACT_QUANTIFIER = /^(?<count>\d+)$/u;
const RANGE_QUANTIFIER = /^(?<min>\d+),(?<max>\d*)$/u;

const MAX_REPETITION = 1000;
const MASK_CACHE_LIMIT = 100;
const cache = new Map<string, CompiledMask>();

const VARIABLE_QUANTIFIER =
  'Variable-width masks ("*", "+", "{n,}", and "{n,m}") require a dynamic Maskito mask and are not supported yet.';

/** Shorthand atoms for the compact mask DSL. Escape one to use it literally. */
const TOKEN_ATOMS: Record<string, RegExp> = {
  "#": DIGIT,
  A: LETTER,
  W: WORD,
  "?": ANY,
};

function characterClass(mask: string, start: number): { regex: RegExp; next: number } {
  let index = start + 1;
  let escaped = false;
  while (index < mask.length) {
    const character = mask[index];
    if (escaped) {
      escaped = false;
    } else if (character === "\\") {
      escaped = true;
    } else if (character === "]") {
      const source = mask.slice(start + 1, index);
      if (source.length === 0) {
        throw new Error("Mask character class cannot be empty.");
      }
      let regex: RegExp;
      try {
        regex = new RegExp(`^[${source}]$`, "u");
      } catch (error) {
        throw new Error(`Invalid mask character class "[${source}]".`, { cause: error });
      }
      return { regex, next: index + 1 };
    }
    index += 1;
  }
  throw new Error("Mask character class is missing its closing ].");
}

function quantifier(mask: string, start: number): { count: number; next: number } {
  const character = mask[start];
  if (character === "*" || character === "+") {
    throw new Error(VARIABLE_QUANTIFIER);
  }
  if (character !== "{") {
    return { count: 1, next: start };
  }

  const end = mask.indexOf("}", start + 1);
  if (end === -1) {
    return { count: 1, next: start };
  }
  const body = mask.slice(start + 1, end);
  const exact = EXACT_QUANTIFIER.exec(body);
  const range = RANGE_QUANTIFIER.exec(body);
  if (exact === null) {
    if (range !== null) {
      throw new Error(VARIABLE_QUANTIFIER);
    }
    return { count: 1, next: start };
  }

  const count = Number(exact.groups?.count);
  if (!Number.isSafeInteger(count) || count < 1 || count > MAX_REPETITION) {
    throw new Error(`Mask repetition count must be between 1 and ${String(MAX_REPETITION)}.`);
  }
  return { count, next: end + 1 };
}

function parse(mask: string): MaskitoMaskExpression {
  const parts: (string | RegExp)[] = [];
  let index = 0;

  while (index < mask.length) {
    const character = mask[index];

    if (character === "\\") {
      const literal = mask.charAt(index + 1);
      if (literal === "") {
        throw new Error("Mask pattern cannot end with an unescaped backslash.");
      }
      const { count, next } = quantifier(mask, index + 2);
      for (let repetition = 0; repetition < count; repetition += 1) {
        parts.push(literal);
      }
      index = next;
    } else if (character === "[") {
      const { regex, next } = characterClass(mask, index);
      const { count, next: afterQuantifier } = quantifier(mask, next);
      for (let repetition = 0; repetition < count; repetition += 1) {
        parts.push(regex);
      }
      index = afterQuantifier;
    } else if (character in TOKEN_ATOMS) {
      const atom = TOKEN_ATOMS[character];
      const { count, next } = quantifier(mask, index + 1);
      for (let repetition = 0; repetition < count; repetition += 1) {
        parts.push(atom);
      }
      index = next;
    } else {
      parts.push(character);
      index += 1;
    }
  }

  return parts;
}

function rawFromMasked(value: string, mask: MaskitoMaskExpression): string {
  if (!Array.isArray(mask)) {
    return value;
  }

  let raw = "";
  let index = 0;
  for (const part of mask) {
    if (typeof part === "string") {
      if (value[index] === part) {
        index += 1;
      }
    } else {
      while (index < value.length) {
        const character = value[index];
        index += 1;
        if (part.test(character)) {
          raw += character;
          break;
        }
      }
    }
  }
  return raw;
}

/** Extracts the raw value for a native Maskito mask expression. */
export function extractRawFromMasked(value: string, mask: MaskitoOptions["mask"]): string {
  const expression =
    typeof mask === "function" ? mask({ value, selection: [value.length, value.length] }) : mask;
  return Array.isArray(expression) ? rawFromMasked(value, expression) : value;
}

/**
 * Compiles a Maskito-compatible mask expression with an ergonomic regex-like
 * syntax. Fixed-width tokens support `{n}`; variable-width quantifiers are
 * rejected until dynamic masks are implemented.
 */
export function compileMask(mask: string): CompiledMask {
  const cached = cache.get(mask);
  if (cached !== undefined) {
    return cached;
  }

  const expression = parse(mask);
  const compiled: CompiledMask = {
    options: { mask: expression },
    rawFromMasked: (value: string): string => rawFromMasked(value, expression),
  };
  cache.set(mask, compiled);
  if (cache.size > MASK_CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) {
      cache.delete(oldest);
    }
  }
  return compiled;
}

/** Clears cached compiled masks. Useful for tests and hot reload. */
export function clearMaskCache(): void {
  cache.clear();
}
