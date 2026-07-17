import { type VariantProps, cva } from "class-variance-authority";
import { type JSX, splitProps } from "solid-js";

import { cn } from "../../cn";

const labelVariants = cva("text-xs tracking-wide text-md3-on-surface-variant", {
  defaultVariants: {
    transform: "uppercase",
  },
  variants: {
    transform: {
      capitalize: "capitalize",
      lowercase: "lowercase",
      none: "",
      uppercase: "uppercase",
    },
  },
});

interface LabelProps extends VariantProps<typeof labelVariants> {
  class?: string;
  children: JSX.Element;
}

export function Label(props: Readonly<LabelProps>): JSX.Element {
  const [local, rest] = splitProps(props, ["class", "children", "transform"]);
  return (
    <label class={cn(labelVariants({ transform: local.transform }), local.class)} {...rest}>
      {local.children}
    </label>
  );
}

export type { LabelProps };
