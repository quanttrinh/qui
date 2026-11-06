type RecordFromKeys<Keys extends readonly string[], Value> = Record<Keys[number], Value>;

/** Builds a complete `Record` from a key tuple. */
export function buildRecord<Keys extends readonly string[], Value>(
  keys: Keys,
  createValue: (key: Keys[number]) => Value,
): RecordFromKeys<Keys, Value> {
  // The accumulator is `any` only at this internal boundary; the public signature narrows it.
  // oxlint-disable-next-line typescript/no-explicit-any
  function worker(): any {
    const accumulator: Record<string, Value> = {};
    for (const key of keys) {
      accumulator[key] = createValue(key);
    }
    return accumulator;
  }

  return worker();
}
