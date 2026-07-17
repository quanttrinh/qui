import { type JSX, Show } from "solid-js";

interface LoadingSpinnerProps {
  label?: string;
  animatedDots?: boolean;
}

export function LoadingSpinner(props: Readonly<LoadingSpinnerProps>): JSX.Element {
  return (
    <div
      class="flex items-center justify-center py-12"
      role="status"
      aria-live="polite"
      aria-label={props.label ?? "Loading"}
    >
      <span class="sr-only">{props.label ?? "Loading"}</span>
      <div class="flex flex-col items-center gap-3" aria-hidden="true">
        <div class="h-8 w-8 rounded-full border-2 border-md3-outline-variant border-t-md3-primary motion-safe:h-8 motion-safe:w-8 motion-safe:animate-spin" />
        <span class="text-sm text-md3-on-surface-variant">
          {props.label ?? "Loading"}
          <Show when={props.animatedDots}>
            {" "}
            <span class="inline-block [animation-delay:0ms] motion-safe:animate-pulse-dot">.</span>
            <span class="inline-block [animation-delay:200ms] motion-safe:animate-pulse-dot">
              .
            </span>
            <span class="inline-block [animation-delay:400ms] motion-safe:animate-pulse-dot">
              .
            </span>
          </Show>
        </span>
      </div>
    </div>
  );
}

export type { LoadingSpinnerProps };
