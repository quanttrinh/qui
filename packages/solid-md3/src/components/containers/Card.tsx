import type { JSX } from "solid-js";

import { type VariantProps, cva } from "class-variance-authority";

import { cn } from "../../cn";

const card = cva("rounded-md3-lg p-6 transition-all", {
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

type CardProps = VariantProps<typeof card> & {
  class?: string;
  children: JSX.Element;
};

export function Card(props: Readonly<CardProps>): JSX.Element {
  return <div class={cn(card({ variant: props.variant }), props.class)}>{props.children}</div>;
}

export type { CardProps };
