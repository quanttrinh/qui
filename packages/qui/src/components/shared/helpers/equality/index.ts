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
