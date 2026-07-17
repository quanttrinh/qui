import { type VariantProps, cva } from "class-variance-authority";
import { type JSX, Show, splitProps } from "solid-js";

import { cn } from "../../cn";

const bannerVariants = cva("flex items-start gap-3 rounded-md3-md p-4 items-center", {
  defaultVariants: {
    variant: "info",
  },
  variants: {
    variant: {
      error: "bg-md3-error-container text-md3-on-error-container",
      info: "bg-md3-surface-container-high text-md3-on-surface",
      success: "bg-md3-primary-container text-md3-on-primary-container",
      warning: "bg-md3-warning-container text-md3-on-warning-container",
    },
  },
});

const bannerIconVariants = cva("material-symbols-outlined text-lg leading-none mt-0.5", {
  defaultVariants: {
    variant: "info",
  },
  variants: {
    variant: {
      error: "after:content-['error']",
      info: "after:content-['info']",
      success: "after:content-['check\\\\_circle']",
      warning: "after:content-['warning']",
    },
  },
});

type BannerProps = VariantProps<typeof bannerVariants> & {
  text: JSX.Element;
  onClose?: () => void;
  class?: string;
};

export function Banner(props: Readonly<BannerProps>): JSX.Element {
  const [local, rest] = splitProps(props, ["variant", "text", "onClose", "class"]);
  return (
    <div class={cn(bannerVariants({ variant: local.variant }), local.class)} {...rest}>
      <span class={cn(bannerIconVariants({ variant: local.variant }))} aria-hidden="true" />
      <div class="flex-1 text-sm">{local.text}</div>
      <Show when={local.onClose}>
        <button
          onClick={() => local.onClose?.()}
          aria-label="Dismiss"
          class="state-layer flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
        >
          <span
            class="material-symbols-outlined text-base leading-none after:content-['close']"
            aria-hidden="true"
          />
        </button>
      </Show>
    </div>
  );
}

export type { BannerProps };
