import { type VariantProps, cva } from "class-variance-authority";
import { type JSX, splitProps } from "solid-js";

import { cn } from "../../cn";

const button = cva(
  "state-layer inline-flex items-center justify-center rounded-full font-medium transition-all cursor-pointer select-none disabled:opacity-38 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-md3-primary",
  {
    compoundVariants: [
      { class: "px-0 w-8", iconOnly: true, size: "sm" },
      { class: "px-0 w-10", iconOnly: true, size: "md" },
      { class: "px-0 w-12", iconOnly: true, size: "lg" },
    ],
    defaultVariants: {
      iconOnly: false,
      size: "md",
      variant: "filled",
    },
    variants: {
      iconOnly: {
        true: "",
      },
      size: {
        lg: "h-12 px-8 gap-2.5 text-base",
        md: "h-10 px-6 gap-2 text-sm",
        sm: "h-8 px-3 gap-1.5 text-sm",
      },
      variant: {
        elevated:
          "bg-md3-surface-container-low text-md3-primary shadow-md3-elevation-1 hover:shadow-md3-elevation-2",
        filled:
          "bg-md3-primary text-md3-on-primary shadow-md3-elevation-1 hover:shadow-md3-elevation-2",
        outlined: "border border-md3-outline text-md3-primary",
        text: "text-md3-primary",
        tonal: "bg-md3-secondary-container text-md3-on-secondary-container",
      },
    },
  },
);

type ButtonProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof button>;

export function Button(props: Readonly<ButtonProps>): JSX.Element {
  const [local, rest] = splitProps(props, ["variant", "size", "iconOnly", "class", "children"]);

  return (
    <button
      class={cn(
        button({
          iconOnly: local.iconOnly,
          size: local.size,
          variant: local.variant,
        }),
        local.class,
      )}
      {...rest}
    >
      {local.children}
    </button>
  );
}
