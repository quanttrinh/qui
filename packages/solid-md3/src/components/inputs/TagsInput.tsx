import { TagsInput as ArkTagsInput } from "@ark-ui/solid/tags-input";
import Close from "@iconify-solid/material-symbols/close";
import { type JSX, Index, splitProps } from "solid-js";

import { cn } from "../../cn";
import { Pill } from "../indicators/Pill";

interface TagsInputProps {
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  readOnly?: boolean;
  required?: boolean;
  validate?: (details: { inputValue: string; value: string[] }) => boolean;
  class?: string;
}

export function TagsInput(props: Readonly<TagsInputProps>): JSX.Element {
  const [local] = splitProps(props, [
    "value",
    "onValueChange",
    "placeholder",
    "disabled",
    "invalid",
    "readOnly",
    "required",
    "validate",
    "class",
  ]);

  return (
    <ArkTagsInput.Root
      value={local.value}
      onValueChange={(details) => {
        local.onValueChange(details.value);
      }}
      disabled={local.disabled}
      invalid={local.invalid}
      readOnly={local.readOnly}
      required={local.required}
      validate={local.validate}
      class={cn("flex flex-col gap-1.5", local.class)}
    >
      <ArkTagsInput.Context>
        {(api) => (
          <>
            <ArkTagsInput.Control class="flex min-h-10 flex-wrap items-center gap-1.5 rounded-md3-sm border border-md3-outline-variant bg-md3-surface-container-lowest px-3 py-1.5 transition-colors focus-within:border-md3-primary focus-within:ring-1 focus-within:ring-md3-primary">
              <Index each={api().value}>
                {(value, index) => (
                  <ArkTagsInput.Item
                    index={index}
                    value={value()}
                    class="inline-flex cursor-default items-center outline-none"
                  >
                    <ArkTagsInput.ItemPreview
                      asChild={(previewProps) => {
                        const pillProps = previewProps();
                        return (
                          <Pill {...pillProps} class="inline-flex items-center gap-1">
                            <ArkTagsInput.ItemText>{value()}</ArkTagsInput.ItemText>
                            <ArkTagsInput.ItemDeleteTrigger
                              aria-label={`Remove ${value()}`}
                              class="flex items-center justify-center text-md3-on-secondary-container/60 hover:text-md3-on-secondary-container"
                            >
                              <Close />
                            </ArkTagsInput.ItemDeleteTrigger>
                          </Pill>
                        );
                      }}
                    />
                    <ArkTagsInput.ItemInput class="hidden" />
                  </ArkTagsInput.Item>
                )}
              </Index>
              <ArkTagsInput.Input
                placeholder={local.placeholder}
                class="min-w-16 flex-1 border-none bg-transparent text-sm text-md3-on-surface outline-none placeholder:text-md3-on-surface-variant"
              />
            </ArkTagsInput.Control>
            <ArkTagsInput.HiddenInput />
          </>
        )}
      </ArkTagsInput.Context>
    </ArkTagsInput.Root>
  );
}

export type { TagsInputProps };
