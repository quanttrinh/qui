/** Returns the distinct non-nullish strings in argument order. */
export function uniqueValues(...values: (string | undefined)[]): string[] {
  const unique = new Set<string>();
  for (const value of values) {
    if (value !== undefined) {
      unique.add(value);
    }
  }
  return [...unique];
}

/** Compares two values, or two arrays element by element, without deep recursion. */
export function shallowEqual(previous: unknown, next: unknown): boolean {
  if (Object.is(previous, next)) {
    return true;
  }
  if (!Array.isArray(previous) || !Array.isArray(next) || previous.length !== next.length) {
    return false;
  }
  return previous.every((value, index) => Object.is(value, next[index]));
}
