import { type JSX, Show } from "solid-js";

import { Shimmer } from "./Shimmer";

interface DataBlockProps<T> {
  value: T | undefined | null;
  children: (value: T) => JSX.Element;
  placeholder?: JSX.Element;
}

function hasValue<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

export function DataBlock<T>(props: Readonly<DataBlockProps<T>>): JSX.Element {
  return (
    <Show
      when={hasValue(props.value)}
      fallback={props.placeholder ?? <Shimmer width="8rem" height="1.25rem" />}
    >
      {props.value && props.children(props.value)}
    </Show>
  );
}

export type { DataBlockProps };
