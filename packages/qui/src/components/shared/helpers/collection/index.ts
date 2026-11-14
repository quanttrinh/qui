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
