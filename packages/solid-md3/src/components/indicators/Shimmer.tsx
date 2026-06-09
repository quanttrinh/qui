import { type VariantProps, cva } from "class-variance-authority";
import { type JSX, splitProps } from "solid-js";

import { cn } from "../../cn";

const shimmer = cva("bg-md3-surface-container-highest animate-pulse", {
  defaultVariants: {
    rounded: "sm",
  },
  variants: {
    rounded: {
      full: "rounded-full",
      lg: "rounded-md3-lg",
      md: "rounded-md3-md",
      none: "rounded-none",
      sm: "rounded-md3-sm",
    },
  },
});

type ShimmerProps = VariantProps<typeof shimmer> & {
  width?: string;
  height?: string;
  class?: string;
};

export function Shimmer(props: Readonly<ShimmerProps>): JSX.Element {
  const [local, rest] = splitProps(props, ["rounded", "width", "height", "class"]);
  return (
    <div
      class={cn(shimmer({ rounded: local.rounded }), local.class)}
      style={{
        height: local.height ?? "1.25rem",
        width: local.width ?? "100%",
      }}
      {...rest}
    />
  );
}

export type { ShimmerProps };
