import { type VariantProps, cva } from "class-variance-authority";
import { type JSX, splitProps } from "solid-js";
import { Dynamic } from "solid-js/web";

import { cn } from "../../cn";

const textVariants = cva("", {
  defaultVariants: {
    secondary: false,
    size: "sm",
  },
  variants: {
    mono: {
      true: "font-mono",
    },
    secondary: {
      false: "text-md3-on-surface",
      true: "text-md3-on-surface-variant",
    },
    size: {
      md: "text-base",
      sm: "text-sm",
      xs: "text-xs",
    },
    weight: {
      bold: "font-bold",
      medium: "font-medium",
      semibold: "font-semibold",
    },
  },
});

export type TextProps = VariantProps<typeof textVariants> & {
  as?: "span" | "p" | "div" | "strong";
  class?: string;
  children?: JSX.Element;
};

export function Text(props: Readonly<TextProps>): JSX.Element {
  const [local, rest] = splitProps(props, [
    "size",
    "secondary",
    "mono",
    "weight",
    "as",
    "class",
    "children",
  ]);

  return (
    <Dynamic
      component={local.as ?? "span"}
      class={cn(
        textVariants({
          mono: local.mono,
          secondary: local.secondary,
          size: local.size,
          weight: local.weight,
        }),
        local.class,
      )}
      {...rest}
    >
      {local.children}
    </Dynamic>
  );
}
