import type { JSX } from "solid-js";

import { cn } from "../../cn";
import { SectionTitle } from "../typography/Heading";

interface SectionProps {
  title: string;
  id?: string;
  class?: string;
  children: JSX.Element;
}

export function Section(props: Readonly<SectionProps>): JSX.Element {
  return (
    <section id={props.id} class={cn("mb-12 scroll-mt-4", props.class)}>
      <SectionTitle>{props.title}</SectionTitle>
      <div class="mt-4">{props.children}</div>
    </section>
  );
}

export type { SectionProps };
