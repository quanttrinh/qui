/**
 * Test-only loader for the Stencil hydrate bundle.
 *
 * The bundle is produced by a Stencil build, so the import stays dynamic and
 * no module-level work happens when this helper is imported.
 */

/** The subset of the hydrate bundle used by the SSR tests. */
export interface HydrateModule {
  renderToString: (
    html: string,
    options?: Record<string, unknown>,
  ) => Promise<{ html: string; diagnostics: unknown[] }>;
  streamToString: (html: string, options?: Record<string, unknown>) => AsyncIterable<unknown>;
}

/** Loads the built Stencil hydrate bundle. */
export async function loadHydrate(): Promise<HydrateModule> {
  const hydratePath = new URL("../../dist/hydrate/shared/index.mjs", import.meta.url).href;
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The built bundle is untyped.
  return (await import(hydratePath)) as HydrateModule;
}
