import { type VariantProps, cva } from "class-variance-authority";
import { type JSX, splitProps } from "solid-js";

import { cn } from "../../cn";

const dividerVariants = cva("flex shrink-0", {
  defaultVariants: {
    orientation: "horizontal",
    weight: "regular",
  },
  variants: {
    orientation: {
      horizontal: "h-px w-full",
      vertical: "w-px self-stretch",
    },
    weight: {
      regular: "bg-md3-outline-variant",
      strong: "bg-md3-outline",
    },
  },
});

type DividerProps = VariantProps<typeof dividerVariants> & {
  class?: string;
};

export function Divider(props: Readonly<DividerProps>): JSX.Element {
  const [local, rest] = splitProps(props, ["weight", "orientation", "class"]);
  return (
    <div
      class={cn(
        dividerVariants({ orientation: local.orientation, weight: local.weight }),
        local.class,
      )}
      {...rest}
    />
  );
}

export type { DividerProps };
