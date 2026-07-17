import { type VariantProps, cva } from "class-variance-authority";
import { type JSX, type Ref, splitProps } from "solid-js";

import { cn } from "../../cn";

const blockVariants = cva("overflow-clip", {
  variants: {
    variant: {
      row: "flex items-center gap-3",
      column: "flex flex-col gap-4",
      grid: "grid grid-cols-1 gap-4 md:grid-cols-2",
      wrap: "flex flex-wrap items-center gap-3",
      between: "flex items-center justify-between",
      center: "flex items-center justify-center",
      page: "size-full",
      nested: "rounded-lg border border-md3-outline-variant bg-md3-surface-container-low p-3",
      toolbar:
        "flex shrink-0 flex-col gap-3 rounded-xl border border-md3-outline-variant bg-md3-surface-container px-4 py-3 shadow-md3-elevation-2 md:flex-row md:items-center md:justify-between",
    },
    gap: {
      none: "gap-0",
      xs: "gap-1",
      sm: "gap-2",
      md: "gap-3",
      lg: "gap-4",
      xl: "gap-6",
    },
    pad: {
      none: "p-0",
      sm: "p-3",
      md: "p-6",
      lg: "p-8",
    },
  },
});

type BlockProps = VariantProps<typeof blockVariants> & {
  class?: string;
  ref?: Ref<HTMLDivElement>;
  children?: JSX.Element;
  role?: JSX.IntrinsicElements["div"]["role"];
  id?: string;
};

export function Block(props: Readonly<BlockProps>): JSX.Element {
  const [local, rest] = splitProps(props, ["variant", "gap", "pad", "class", "ref", "children"]);

  return (
    <div
      ref={local.ref}
      class={cn(
        blockVariants({ variant: local.variant, gap: local.gap, pad: local.pad }),
        local.class,
      )}
      {...rest}
    >
      {local.children}
    </div>
  );
}

export type { BlockProps };
