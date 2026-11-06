import { type MaskitoMaskExpression, type MaskitoOptions } from "@maskito/core";

/** A compiled mask plus the helpers the input needs to report raw values. */
export interface CompiledMask {
  options: MaskitoOptions;
  /** Extracts user-typed characters from an already-masked value. */
  rawFromMasked: (value: string) => string;
  /** Maps a count of typed characters to a caret offset in a masked value. */
  caretForRaw: (value: string, rawCount: number) => number;
}

const DIGIT = /\d/u;
const NON_DIGIT = /\D/u;
const WORD = /[a-z0-9_]/iu;
const NON_WORD = /[^a-z0-9_]/iu;
const SPACE = /\s/u;
const NON_SPACE = /\S/u;

const cache = new Map<string, CompiledMask>();

const VARIABLE_QUANTIFIER =
  'Variable-width masks ("?", "*", "+", "{n,}", and "{n,m}") require a dynamic Maskito mask and are not supported yet.';

const ESCAPE_ATOMS: Record<string, RegExp> = {
  d: DIGIT,
  D: NON_DIGIT,
  w: WORD,
  W: NON_WORD,
  s: SPACE,
  S: NON_SPACE,
};

function atomForEscape(token: string): RegExp | undefined {
  return ESCAPE_ATOMS[token];
}

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
  if (character === "?" || character === "*" || character === "+") {
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
  const exact = /^(?<count>\d+)$/u.exec(body);
  const range = /^(?<min>\d+),(?<max>\d*)$/u.exec(body);
  if (exact === null) {
    if (range !== null) {
      throw new Error(VARIABLE_QUANTIFIER);
    }
    return { count: 1, next: start };
  }

  const count = Number(exact.groups?.count);
  return { count, next: end + 1 };
}

function parse(mask: string): MaskitoMaskExpression {
  const parts: (string | RegExp)[] = [];
  let index = 0;

  while (index < mask.length) {
    const character = mask[index];

    if (character === "\\") {
      const token = mask[index + 1];
      if (token === undefined) {
        throw new Error("Mask pattern cannot end with an unescaped backslash.");
      }
      const atom = atomForEscape(token);
      if (atom === undefined) {
        parts.push(token);
        index += 2;
      } else {
        const { count, next } = quantifier(mask, index + 2);
        for (let repetition = 0; repetition < count; repetition += 1) {
          parts.push(atom);
        }
        index = next;
      }
      continue;
    }

    if (character === "[") {
      const { regex, next } = characterClass(mask, index);
      const { count, next: afterQuantifier } = quantifier(mask, next);
      for (let repetition = 0; repetition < count; repetition += 1) {
        parts.push(regex);
      }
      index = afterQuantifier;
      continue;
    }

    parts.push(character);
    index += 1;
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
      continue;
    }

    while (index < value.length) {
      const character = value[index];
      index += 1;
      if (part.test(character)) {
        raw += character;
        break;
      }
    }
  }
  return raw;
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
    caretForRaw: (value: string, rawCount: number): number =>
      caretForRaw(value, expression, rawCount),
  };
  cache.set(mask, compiled);
  return compiled;
}

function caretForRaw(value: string, mask: MaskitoMaskExpression, rawCount: number): number {
  if (!Array.isArray(mask)) {
    return value.length;
  }
  if (rawCount <= 0) {
    return 0;
  }

  let seen = 0;
  let index = 0;
  for (const part of mask) {
    if (typeof part === "string") {
      if (value[index] === part) {
        index += 1;
      }
      continue;
    }

    while (index < value.length) {
      const character = value[index];
      index += 1;
      if (part.test(character)) {
        seen += 1;
        break;
      }
    }
    if (seen >= rawCount) {
      return index;
    }
  }
  return index;
}

/** Clears cached compiled masks. Useful for tests and hot reload. */
export function clearMaskCache(): void {
  cache.clear();
}
