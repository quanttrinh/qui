let sequence = 0;

/** Returns a stable, unique id with the given prefix. */
export function nextId(prefix: string): string {
  sequence += 1;
  return `${prefix}-${sequence}`;
}
