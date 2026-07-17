import type { JSX } from "solid-js";

import { type VariantProps, cva } from "class-variance-authority";

import { cn } from "../../cn";

const cardVariants = cva("rounded-md3-lg p-4 sm:p-6 transition-all", {
  defaultVariants: {
    variant: "elevated",
  },
  variants: {
    variant: {
      elevated: "bg-md3-surface-container-low shadow-md3-elevation-1",
      filled: "bg-md3-surface-container-highest",
      outlined: "border border-md3-outline-variant bg-md3-surface",
    },
  },
});

type CardProps = VariantProps<typeof cardVariants> & {
  class?: string;
  children: JSX.Element;
};

export function Card(props: Readonly<CardProps>): JSX.Element {
  return (
    <div class={cn(cardVariants({ variant: props.variant }), props.class)}>{props.children}</div>
  );
}

export type { CardProps };
