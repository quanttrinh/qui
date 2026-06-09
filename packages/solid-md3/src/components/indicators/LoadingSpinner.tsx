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
        <div class="h-8 w-8 animate-spin rounded-full border-2 border-md3-outline-variant border-t-md3-primary" />
        <span class="text-sm text-md3-on-surface-variant">
          {props.label ?? "Loading"}
          <Show when={props.animatedDots}>
            {" "}
            <span class="inline-block animate-bounce [animation-delay:0ms]">.</span>
            <span class="inline-block animate-bounce [animation-delay:200ms]">.</span>
            <span class="inline-block animate-bounce [animation-delay:400ms]">.</span>
          </Show>
        </span>
      </div>
    </div>
  );
}

export type { LoadingSpinnerProps };
