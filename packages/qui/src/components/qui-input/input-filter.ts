/** Options shared by the numeric and decimal input filters. */
export interface NumericOrDecimalFilterOptions {
  readonly allowNegative: boolean;
  readonly mode: "numeric" | "decimal";
}

function isSignOrSeparator(char: string): boolean {
  return char === "-" || char === "." || char === ",";
}

function normalizeLeadingZeros(value: string): string {
  const sign = value.startsWith("-") ? "-" : "";
  const body = value.slice(sign.length);
  if (!body.startsWith("0")) {
    return value;
  }
  let index = 0;
  while (index < body.length && body[index] === "0") {
    index += 1;
  }
  const next = body[index];
  const normalized =
    index < body.length && next >= "0" && next <= "9" ? body.slice(index) : `0${body.slice(index)}`;
  return sign + normalized;
}

/** Appends a character if it is valid in the current filter mode. */
export function appendAcceptedNumericOrDecimalCharacter(
  result: string,
  char: string,
  options: NumericOrDecimalFilterOptions,
): string | undefined {
  if (char >= "0" && char <= "9") {
    return result + char;
  }
  if (char === "-") {
    return options.allowNegative && result.length === 0 ? "-" : undefined;
  }
  if (options.mode === "decimal" && (char === "." || char === ",")) {
    if (result === "-") {
      return `-0${char}`;
    }
    const previous = result.at(-1);
    return previous !== undefined && isSignOrSeparator(previous) ? undefined : result + char;
  }
  return undefined;
}

/** Filters and normalizes a raw value for numeric or decimal input modes. */
export function filterNumericOrDecimalInput(
  raw: string,
  options: NumericOrDecimalFilterOptions,
): string {
  let result = "";
  for (const char of raw) {
    const next = appendAcceptedNumericOrDecimalCharacter(result, char, options);
    if (next !== undefined) {
      result = next;
    }
  }
  return normalizeLeadingZeros(result);
}
