/**
 * Test-only helpers for waiting on styles, frames, and timers.
 *
 * These utilities are intentionally not exported from a package entry point.
 */

import { shadowOf } from "./shadow";

/** Selector Stencil uses for the stylesheet it injects into a shadow root. */
export const SHADOW_STYLES_SELECTOR = "link[data-qui-styles]";

/* oxlint-disable promise/avoid-new -- These helpers wrap browser events and timers in promises. */

async function waitForLink(link: HTMLLinkElement): Promise<void> {
  if (link.sheet !== null) {
    return;
  }

  await new Promise<void>((resolve) => {
    link.addEventListener(
      "load",
      () => {
        resolve();
      },
      { once: true },
    );
    link.addEventListener(
      "error",
      () => {
        resolve();
      },
      { once: true },
    );
  });
}

/** Resolves after the browser has rendered the next animation frame. */
export async function nextFrame(): Promise<void> {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

/** Resolves after `ms` milliseconds have elapsed. */
export async function settle(ms: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

/** Waits until every injected stylesheet in `host`'s shadow root has loaded. */
export async function waitForShadowStyles(host: Element): Promise<void> {
  const links = [...shadowOf(host).querySelectorAll<HTMLLinkElement>(SHADOW_STYLES_SELECTOR)];
  await Promise.all(
    links.map(async (link) => {
      await waitForLink(link);
    }),
  );
  await nextFrame();
}
