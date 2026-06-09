import { type JSX, splitProps } from "solid-js";

import { cn } from "../../cn";

interface LabelProps {
  class?: string;
  children: JSX.Element;
}

export function Label(props: Readonly<LabelProps>): JSX.Element {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <label
      class={cn("text-xs tracking-wide text-md3-on-surface-variant uppercase", local.class)}
      {...rest}
    >
      {local.children}
    </label>
  );
}

export type { LabelProps };
