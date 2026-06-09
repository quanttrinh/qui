import { type JSX, splitProps } from "solid-js";

import { cn } from "../../cn";

interface HeadingProps {
  class?: string;
  children: JSX.Element;
}

export function PageTitle(props: Readonly<HeadingProps>): JSX.Element {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <h1 class={cn("text-md3-headline-sm leading-tight font-medium", local.class)} {...rest}>
      {local.children}
    </h1>
  );
}

export function SectionTitle(props: Readonly<HeadingProps>): JSX.Element {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <h2 class={cn("text-lg font-medium text-md3-primary", local.class)} {...rest}>
      {local.children}
    </h2>
  );
}
