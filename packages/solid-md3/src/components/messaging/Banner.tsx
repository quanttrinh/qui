import { type VariantProps, cva } from "class-variance-authority";
import { type JSX, Show, splitProps } from "solid-js";

import { cn } from "../../cn";

const banner = cva("flex items-start gap-3 rounded-md3-md p-4 items-center", {
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

const bannerIcon = cva("material-symbols-outlined text-lg leading-none mt-0.5", {
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

type BannerProps = VariantProps<typeof banner> & {
  text: JSX.Element;
  onClose?: () => void;
  class?: string;
};

export function Banner(props: Readonly<BannerProps>): JSX.Element {
  const [local, rest] = splitProps(props, ["variant", "text", "onClose", "class"]);
  return (
    <div class={cn(banner({ variant: local.variant }), local.class)} {...rest}>
      <span class={cn(bannerIcon({ variant: local.variant }))} />
      <div class="flex-1 text-sm">{local.text}</div>
      <Show when={local.onClose}>
        <button
          onClick={() => local.onClose?.()}
          class="state-layer flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
        >
          <span class="material-symbols-outlined text-base leading-none after:content-['close']" />
        </button>
      </Show>
    </div>
  );
}

export type { BannerProps };
