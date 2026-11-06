/**
 * Test-only loader for the Stencil hydrate bundle.
 *
 * The bundle is produced by a Stencil build, so the import stays dynamic and
 * no module-level work happens when this helper is imported.
 */

/** The subset of the hydrate bundle used by the SSR tests. */
export interface HydrateResult {
  html: string | null;
  diagnostics: unknown[];
}

export interface RenderResult {
  html: string;
  diagnostics: unknown[];
}

export interface HydrateWindow {
  document: Document;
}

export interface HydrateModule {
  createWindowFromHtml: (html: string, uniqueId: string) => HydrateWindow;
  hydrateDocument: (
    document: Document,
    options?: Record<string, unknown>,
  ) => Promise<HydrateResult>;
  renderToString: (html: string, options?: Record<string, unknown>) => Promise<RenderResult>;
  streamToString: (html: string, options?: Record<string, unknown>) => AsyncIterable<unknown>;
}

/** Loads the built Stencil hydrate bundle. */
export async function loadHydrate(): Promise<HydrateModule> {
  const hydratePath = new URL("../../dist/hydrate/index.mjs", import.meta.url).href;
  return (await import(hydratePath)) as HydrateModule;
}
