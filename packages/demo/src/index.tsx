import { render } from "solid-js/web";

import { type PersistedTheme, ThemeProvider } from "@quanttrinh/solid-qui";
import "./styles.css";
import App from "./App";
import { THEME_STORAGE_KEY } from "./theme";

/** Consumer-owned persistence — the provider never touches storage itself. */
function readTheme(): PersistedTheme | undefined {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedTheme) : undefined;
  } catch {
    return undefined;
  }
}

function writeTheme(theme: PersistedTheme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
  } catch {
    // Storage unavailable (private mode) — ignore.
  }
}

const root = document.querySelector("#root");
if (!root) {
  throw new Error("Root element not found");
}

render(
  () => (
    <ThemeProvider systemDark read={readTheme} write={writeTheme}>
      <App />
    </ThemeProvider>
  ),
  root,
);
