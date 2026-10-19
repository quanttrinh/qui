import Check from "@iconify-solid/material-symbols/check";
import Remove from "@iconify-solid/material-symbols/remove";
import { type Api, connect, machine, type Props, props as checkboxProps } from "@zag-js/checkbox";
import { type PropTypes, normalizeProps, useMachine } from "@zag-js/solid";
import { type JSX, Show, createMemo, createUniqueId, mergeProps, splitProps } from "solid-js";

import { css, cx } from "../../../../styled-system/css";
import { center, hstack, square } from "../../../../styled-system/patterns";
import { useFieldContext } from "../Field/useFieldContext";

type CheckboxApi = Api<PropTypes>;

type CheckboxProps = Omit<Props, "id" | "ids"> & {
  class?: string;
  children?: JSX.Element;
};

const machinePropKeys = checkboxProps.filter(
  (key): key is Exclude<keyof Props, "id" | "ids"> => key !== "id" && key !== "ids",
);

const styles = {
  root: hstack({
    display: "inline-flex",
    gap: "2",
    minHeight: "11",
    cursor: "pointer",
    userSelect: "none",
    _disabled: {
      cursor: "not-allowed",
      opacity: 0.38,
    },
  }),
  control: square({
    size: "5",
    rounded: "sm",
    borderWidth: "2px",
    borderStyle: "solid",
    borderColor: "outline",
    color: "transparent",
    backgroundColor: "transparent",
    transition: "background-color 150ms, border-color 150ms, color 150ms",
    _hover: {
      borderColor: "onSurface",
    },
    _checked: {
      borderColor: "primary",
      backgroundColor: "primary",
      color: "onPrimary",
    },
    _indeterminate: {
      borderColor: "primary",
      backgroundColor: "primary",
      color: "onPrimary",
    },
    _invalid: {
      borderColor: "error",
    },
    _focusVisible: {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary",
      outlineOffset: "2px",
    },
  }),
  indicator: center({
    fontSize: "sm",
    lineHeight: 1,
  }),
  label: css({
    cursor: "pointer",
    fontSize: "sm",
    fontWeight: "medium",
    color: "onSurface",
  }),
};

function Checkbox(props: CheckboxProps): JSX.Element {
  const field = useFieldContext();
  const [machineProps, local] = splitProps(props, machinePropKeys);

  const context = mergeProps(machineProps, {
    id: createUniqueId(),
    get ids() {
      return field ? { hiddenInput: field.ids.control } : undefined;
    },
    get disabled() {
      return field?.disabled() ?? machineProps.disabled;
    },
    get invalid() {
      return field?.invalid() ?? machineProps.invalid;
    },
    get readOnly() {
      return field?.readOnly() ?? machineProps.readOnly;
    },
    get required() {
      return field?.required() ?? machineProps.required;
    },
  });

  const service = useMachine(machine, context);
  const api = createMemo((): CheckboxApi => connect(service, normalizeProps));

  const hiddenInputProps = (): JSX.InputHTMLAttributes<HTMLInputElement> => {
    if (!field) {
      return api().getHiddenInputProps();
    }
    return {
      ...field.getInputProps(),
      ...api().getHiddenInputProps(),
    };
  };

  return (
    <label {...api().getRootProps()} class={cx(styles.root, local.class)}>
      <span {...api().getControlProps()} class={styles.control}>
        <span {...api().getIndicatorProps()} class={styles.indicator}>
          <Show when={api().indeterminate} fallback={<Check />}>
            <Remove />
          </Show>
        </span>
      </span>
      <span {...api().getLabelProps()} class={styles.label}>
        {local.children}
      </span>
      <input {...hiddenInputProps()} />
    </label>
  );
}

export { Checkbox };
