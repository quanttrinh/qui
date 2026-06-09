import { type VariantProps, cva } from "class-variance-authority";
import { type JSX, splitProps } from "solid-js";

import { cn } from "../../cn";

const pill = cva("rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase", {
  defaultVariants: {
    variant: "tonal",
  },
  variants: {
    variant: {
      error: "bg-md3-error-container text-md3-on-error-container",
      filled: "bg-md3-primary-container text-md3-on-primary-container",
      outlined: "border border-md3-outline text-md3-on-surface",
      surface: "bg-md3-surface-container-high text-md3-on-surface",
      tonal: "bg-md3-secondary-container text-md3-on-secondary-container",
      warning: "bg-md3-warning-container text-md3-on-warning-container",
    },
  },
});

export type PillProps = VariantProps<typeof pill> & {
  class?: string;
  children: JSX.Element;
};

export function Pill(props: Readonly<PillProps>): JSX.Element {
  const [local, rest] = splitProps(props, ["variant", "class", "children"]);

  return (
    <span class={cn(pill({ variant: local.variant }), local.class)} {...rest}>
      {local.children}
    </span>
  );
}
