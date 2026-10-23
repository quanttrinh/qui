/** The outcome of applying a mask, including where the caret should land. */
interface MaskResult {
  /** The formatted value. */
  value: string;
  /** The caret position that keeps the placeholder boundary stable. */
  caret: number;
}

// Hoisted so per-keystroke masking never allocates regexes (all stateless: no `g`).
const DIGIT = /\d/u;
const LETTER = /[a-z]/iu;
const ALPHANUMERIC = /[a-z0-9]/iu;
const NON_ALPHANUMERIC = /[^a-z0-9]/giu;

/**
 * Returns the matcher for a pattern placeholder token:
 * - `#` matches a digit
 * - `a` matches a letter
 * - `*` matches a letter or digit
 *
 * Every other pattern character is a literal.
 */
function placeholderRegex(token: string): RegExp | undefined {
  if (token === "#") {
    return DIGIT;
  }
  if (token === "a") {
    return LETTER;
  }
  if (token === "*") {
    return ALPHANUMERIC;
  }
  return undefined;
}

/** Removes every character that cannot fill a placeholder. */
function unmask(value: string): string {
  return value.replaceAll(NON_ALPHANUMERIC, "");
}

/**
 * Applies a pattern to a raw value.
 *
 * Placeholders (`#` digit, `a` letter, `*` alphanumeric) each consume the next
 * matching character; every other pattern character is a literal. A literal is
 * only kept when a following placeholder is filled, so a trailing separator is
 * never shown on its own.
 *
 * @example applyMask("1234", "#### #### #### ####") //=> "1234"
 * @example applyMask("ab123456c", "aa-######-a") //=> "ab-123456-c"
 */
function applyMask(value: string, pattern: string): string {
  let result = "";
  let index = 0;
  // End of the last filled placeholder; the tail (unfilled literals) is dropped.
  let end = 0;

  for (const token of pattern) {
    const regex = placeholderRegex(token);
    if (regex === undefined) {
      result += token;
    } else {
      let character: string | undefined = undefined;
      while (index < value.length) {
        const candidate = value[index];
        index += 1;
        if (regex.test(candidate)) {
          character = candidate;
          break;
        }
      }
      if (character === undefined) {
        break;
      }
      result += character;
      end = result.length;
    }
  }

  return result.slice(0, end);
}

/** Applies a mask while keeping the caret next to the same placeholder it was before. */
function formatMask(value: string, pattern: string, caret: number): MaskResult {
  const placeholdersBeforeCaret = unmask(value.slice(0, caret)).length;
  const masked = applyMask(value, pattern);

  let position = 0;
  let seen = 0;
  while (position < masked.length && seen < placeholdersBeforeCaret) {
    if (ALPHANUMERIC.test(masked[position] ?? "")) {
      seen += 1;
    }
    position += 1;
  }

  return { value: masked, caret: position };
}

export { applyMask, formatMask, unmask };
export type { MaskResult };
