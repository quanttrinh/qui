/** Decimal and grouping separators for a locale. */
export interface NumberSeparators {
  readonly decimal: string;
  readonly group: string;
}

const FALLBACK: NumberSeparators = { decimal: ".", group: "," };
const cache = new Map<string, NumberSeparators>();

function browserLocale(): string | undefined {
  if (typeof document !== "undefined" && document.documentElement.lang !== "") {
    return document.documentElement.lang;
  }
  if (typeof navigator !== "undefined" && navigator.language !== "") {
    return navigator.language;
  }
  return undefined;
}

/** Resolves locale separators through `Intl.NumberFormat`. */
export function resolveNumberSeparators(locale?: string): NumberSeparators {
  const resolvedLocale = locale ?? browserLocale();
  const key = resolvedLocale ?? "";

  const cached = cache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  let separators: NumberSeparators;
  try {
    const parts = new Intl.NumberFormat(resolvedLocale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
      useGrouping: true,
    }).formatToParts(12_345.6);
    separators = {
      decimal: parts.find((part) => part.type === "decimal")?.value ?? FALLBACK.decimal,
      group: parts.find((part) => part.type === "group")?.value ?? FALLBACK.group,
    };
  } catch {
    separators = FALLBACK;
  }

  cache.set(key, separators);
  return separators;
}
