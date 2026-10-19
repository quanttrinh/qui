import {
  type Accessor,
  type JSX,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  untrack,
} from "solid-js";

import { useContext } from "../context";
import { clearColors, setColors } from "./apply";
import {
  type ColorRole,
  type ColorVariables,
  type SchemeVariant,
  type ThemeOptions,
  colorsToVariables,
  createScheme,
  DEFAULT_CONTRAST,
  DEFAULT_SOURCE,
  DEFAULT_VARIANT,
  schemeToColors,
} from "./color";
import { DARK_CLASS } from "./ThemeScript";

/** The current, fully-resolved theme options. */
interface ResolvedThemeOptions {
  source: string;
  variant: SchemeVariant;
  contrast: number;
  dark: boolean;
}

/**
 * A resolved theme, as saved and restored by the consumer.
 *
 * `variables` holds the resolved `--md-sys-color-*` values so a custom seed can
 * be replayed before first paint (see `themeInitScript`) without re-running the
 * color algorithm.
 */
export interface PersistedTheme {
  dark: boolean;
  source: string;
  variant: SchemeVariant;
  contrast: number;
  variables: ColorVariables;
}

interface ThemeContextValue {
  /** The current theme options. */
  theme: Accessor<ResolvedThemeOptions>;
  /** Every resolved role as a hex color. */
  colors: Accessor<Record<ColorRole, string>>;
  /** Every role as MD3 CSS custom properties. */
  cssVariables: Accessor<ColorVariables>;
  /** Apply any subset of theme options. */
  setTheme: (options: ThemeOptions) => void;
}

const ThemeContext = createContext<ThemeContextValue>();

interface ThemeProviderProps extends ThemeOptions {
  /** Follow `prefers-color-scheme` for the initial dark value. */
  systemDark?: boolean;
  /**
   * Read the saved theme once, on mount. The storage mechanism is yours —
   * `localStorage`, a cookie, an API — the provider only calls this.
   */
  read?: () => PersistedTheme | undefined;
  /**
   * Save the resolved theme whenever it changes, so the next load can seed
   * (and, via `themeInitScript`, paint) the same theme.
   */
  write?: (theme: PersistedTheme) => void;
  /**
   * Authoritative initial theme, e.g. resolved from a cookie during SSR. Takes
   * precedence over saved state and props for the initial render.
   */
  initialTheme?: ThemeOptions;
  /** Element to write the variables to. Defaults to `document.documentElement`. */
  target?: HTMLElement;
  children?: JSX.Element;
}

function prefersDark(): boolean {
  return (
    typeof globalThis.matchMedia === "function" &&
    globalThis.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function defaultTarget(): HTMLElement | undefined {
  return typeof document === "undefined" ? undefined : document.documentElement;
}

/** First argument that is not `undefined`. */
function firstDefined<T>(...values: (T | undefined)[]): T | undefined {
  for (const value of values) {
    if (value !== undefined) {
      return value;
    }
  }
  return undefined;
}

/** The plain, already-read theme inputs used to seed the provider. */
interface ThemeSeed extends ThemeOptions {
  read?: () => PersistedTheme | undefined;
  systemDark?: boolean;
  initialTheme?: ThemeOptions;
}

/**
 * Seed the theme in priority order: an SSR-provided `initialTheme`, then the
 * saved theme (so the pre-paint `themeInitScript` and the provider agree), then
 * explicit props, then defaults / `systemDark`.
 */
function resolveInitial(seed: ThemeSeed): ResolvedThemeOptions {
  const stored = seed.read?.();
  const initial = seed.initialTheme;

  return {
    source: firstDefined(initial?.source, stored?.source, seed.source) ?? DEFAULT_SOURCE,
    variant: firstDefined(initial?.variant, stored?.variant, seed.variant) ?? DEFAULT_VARIANT,
    contrast: firstDefined(initial?.contrast, stored?.contrast, seed.contrast) ?? DEFAULT_CONTRAST,
    dark:
      firstDefined(initial?.dark, stored?.dark, seed.dark) ??
      (seed.systemDark ? prefersDark() : false),
  };
}

/**
 * Derives an MD3 color scheme from a seed and keeps `--md-sys-color-*` in sync.
 *
 * Wrap the app (or any subtree via `target`) and drive it through `useTheme()`.
 * Pass `read`/`write` to persist the theme yourself.
 */
function ThemeProvider(props: ThemeProviderProps): JSX.Element {
  const initial = untrack(() =>
    resolveInitial({
      read: props.read,
      systemDark: props.systemDark,
      initialTheme: props.initialTheme,
      source: props.source,
      variant: props.variant,
      contrast: props.contrast,
      dark: props.dark,
    }),
  );
  const [source, setSource] = createSignal(initial.source);
  const [variant, setVariant] = createSignal<SchemeVariant>(initial.variant);
  const [contrast, setContrast] = createSignal(initial.contrast);
  const [dark, setDark] = createSignal(initial.dark);

  const theme = createMemo<ResolvedThemeOptions>(() => ({
    source: source(),
    variant: variant(),
    contrast: contrast(),
    dark: dark(),
  }));

  const colors = createMemo(() => schemeToColors(createScheme(theme())));

  createEffect(() => {
    const element = props.target ?? defaultTarget();
    if (!element) {
      return;
    }

    element.classList.toggle(DARK_CLASS, dark());
    element.style.colorScheme = dark() ? "dark" : "light";
    setColors(colors(), element);
  });

  // Hand the resolved theme to the consumer so it can be restored next time.
  createEffect(() => {
    const { write } = props;
    if (!write) {
      return;
    }

    write({
      dark: dark(),
      source: source(),
      variant: variant(),
      contrast: contrast(),
      variables: colorsToVariables(colors()),
    });
  });

  onCleanup(() => {
    const element = props.target ?? defaultTarget();
    if (!element) {
      return;
    }

    clearColors(element);
    element.style.removeProperty("color-scheme");
    element.classList.remove(DARK_CLASS);
  });

  const setTheme = (options: ThemeOptions): void => {
    if (options.source !== undefined) {
      setSource(options.source);
    }
    if (options.variant !== undefined) {
      setVariant(options.variant);
    }
    if (options.contrast !== undefined) {
      setContrast(options.contrast);
    }
    if (options.dark !== undefined) {
      setDark(options.dark);
    }
  };

  const value: ThemeContextValue = {
    theme,
    colors,
    cssVariables: () => colorsToVariables(colors()),
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{props.children}</ThemeContext.Provider>;
}

/** Read and control the surrounding `ThemeProvider`. */
function useTheme(): ThemeContextValue {
  return useContext(ThemeContext, "useTheme", "ThemeProvider");
}

export { ThemeProvider, useTheme };
export type { ResolvedThemeOptions, ThemeContextValue, ThemeProviderProps };
