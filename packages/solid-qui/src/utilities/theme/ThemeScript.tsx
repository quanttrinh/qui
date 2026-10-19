import type { JSX } from "solid-js";

/**
 * The class toggled on the document element for the dark scheme. `panda.config.ts`
 * emits `.dark` alongside `:root`, so keep your pre-paint script and CSS in sync
 * with it.
 */
export const DARK_CLASS = "dark";

export interface ThemeScriptProps {
  /**
   * Your pre-paint JavaScript, e.g. restoring the saved theme from storage.
   * Runs before the app paints. Keep it dependency-free.
   */
  children?: string;
  /** CSP `nonce` for the script element. */
  nonce?: string;
}

/**
 * Renders your own pre-paint theme script. Put it in the document `<head>` —
 * e.g. inside your SSR/head manager — so it runs before first paint.
 *
 * The library never generates this code: how you read the saved theme is up to
 * you (and matches the `read`/`write` you pass to `ThemeProvider`). For example:
 *
 * ```tsx
 * <ThemeScript>{`
 *   try {
 *     var s = JSON.parse(localStorage.getItem("my-theme") || "null");
 *     document.documentElement.classList.toggle("dark", !!(s && s.dark));
 *   } catch (e) {}
 * `}</ThemeScript>
 * ```
 */
function ThemeScript(props: ThemeScriptProps): JSX.Element {
  return <script nonce={props.nonce}>{props.children}</script>;
}

export { ThemeScript };
