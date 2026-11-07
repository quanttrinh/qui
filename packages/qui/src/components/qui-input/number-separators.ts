/** Decimal and grouping separators for a locale. */
export interface NumberSeparators {
  readonly decimal: string;
  readonly group: string;
}

const FALLBACK: NumberSeparators = { decimal: ".", group: "," };
const FORMAT_OPTIONS = {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  useGrouping: true,
} satisfies Intl.NumberFormatOptions;
const SAMPLE_NUMBER = 12_345.6;
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

function canonicalLocale(locale?: string): string | undefined {
  if (locale === undefined || locale.trim() === "") {
    return undefined;
  }
  try {
    return Intl.getCanonicalLocales(locale)[0];
  } catch {
    return undefined;
  }
}

function readSeparators(locale?: string): NumberSeparators {
  const parts = new Intl.NumberFormat(canonicalLocale(locale), FORMAT_OPTIONS).formatToParts(
    SAMPLE_NUMBER,
  );
  const values = new Map(parts.map(({ type, value }) => [type, value]));

  return {
    decimal: values.get("decimal") ?? FALLBACK.decimal,
    group: values.get("group") ?? FALLBACK.group,
  };
}

/** Resolves locale separators through `Intl.NumberFormat`. */
export function resolveNumberSeparators(locale?: string): NumberSeparators {
  const resolvedLocale = locale ?? browserLocale();
  const key = resolvedLocale ?? "";

  const cached = cache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  const separators = readSeparators(resolvedLocale);
  cache.set(key, separators);
  return separators;
}
