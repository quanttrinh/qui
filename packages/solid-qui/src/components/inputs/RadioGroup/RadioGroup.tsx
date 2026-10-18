import type { ItemProps, Props } from "@zag-js/radio-group";

import { type JSX, For, splitProps } from "solid-js";

import { cx } from "../../../../styled-system/css";
import { center, hstack, stack } from "../../../../styled-system/patterns";
import { radioGroupPropKeys, useRadioGroup } from "./useRadioGroup";

interface RadioGroupItemData {
  value: string;
  disabled?: boolean;
  invalid?: boolean;
}

type RadioGroupProps<T extends RadioGroupItemData> = Omit<Props, "id" | "ids"> & {
  items: readonly T[];
  render: (item: T) => JSX.Element;
  class?: string;
};

const styles = {
  root: stack({ gap: "2" }),
  item: hstack({
    display: "flex",
    gap: "2",
    cursor: "pointer",
    _disabled: { cursor: "not-allowed", opacity: 0.38 },
  }),
  control: center({
    flexShrink: 0,
    width: "5",
    height: "5",
    rounded: "full",
    borderWidth: "2px",
    borderColor: "outline",
    transition: "border-color 150ms",
    _checked: {
      borderColor: "primary",
      _after: {
        content: '""',
        width: "2.5",
        height: "2.5",
        rounded: "full",
        backgroundColor: "primary",
      },
    },
    _invalid: { borderColor: "error" },
    _focusVisible: {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary",
      outlineOffset: "2px",
    },
  }),
};

function itemProps(item: RadioGroupItemData): ItemProps {
  return { value: item.value, disabled: item.disabled, invalid: item.invalid };
}

function RadioGroupRoot<T extends RadioGroupItemData>(props: RadioGroupProps<T>): JSX.Element {
  const [machineProps, local] = splitProps(props, radioGroupPropKeys);
  const { api, rootProps } = useRadioGroup(machineProps);

  return (
    <div {...rootProps()} class={cx(styles.root, local.class)}>
      <For each={local.items}>
        {(item): JSX.Element => (
          <label {...api().getItemProps(itemProps(item))} class={styles.item}>
            <span {...api().getItemControlProps(itemProps(item))} class={styles.control} />
            {local.render(item)}
            <input {...api().getItemHiddenInputProps(itemProps(item))} />
          </label>
        )}
      </For>
    </div>
  );
}

export { RadioGroupRoot as RadioGroup };
export type { RadioGroupItemData, RadioGroupProps };
