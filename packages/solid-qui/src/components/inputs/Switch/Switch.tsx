import Check from "@iconify-solid/material-symbols/check";
import { type PropTypes, normalizeProps, useMachine } from "@zag-js/solid";
import { type Api, connect, machine, type Props, props as switchProps } from "@zag-js/switch";
import { type JSX, createMemo, createUniqueId, mergeProps, splitProps } from "solid-js";

import { css, cx } from "../../../../styled-system/css";
import { hstack } from "../../../../styled-system/patterns";
import { useFieldContext } from "../Field/useFieldContext";

type SwitchApi = Api<PropTypes>;

type SwitchProps = Omit<Props, "id" | "ids"> & {
  class?: string;
  children?: JSX.Element;
};

const machinePropKeys = switchProps.filter(
  (key): key is Exclude<keyof Props, "id" | "ids"> => key !== "id" && key !== "ids",
);

const styles = {
  root: hstack({
    display: "inline-flex",
    gap: "2",
    cursor: "pointer",
    _disabled: { cursor: "not-allowed", opacity: 0.38 },
  }),
  control: css({
    position: "relative",
    display: "inline-flex",
    flexShrink: 0,
    width: "calc(token(spacing.12) + token(spacing.1))",
    height: "8",
    rounded: "full",
    borderWidth: "token(spacing.0.5)",
    borderStyle: "solid",
    borderColor: "outline",
    backgroundColor: "surfaceContainerHighest",
    transition: "background-color 150ms ease, border-color 150ms ease",
    _checked: {
      backgroundColor: "primary",
      borderColor: "primary",
    },
    _focusVisible: {
      outlineWidth: "token(spacing.0.5)",
      outlineStyle: "solid",
      outlineColor: "primary",
      outlineOffset: "token(spacing.0.5)",
    },
  }),
  thumb: css({
    position: "absolute",
    top: "50%",
    insetInlineStart: "1.5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "4",
    height: "4",
    rounded: "full",
    overflow: "hidden",
    color: "primary",
    backgroundColor: "outline",
    transform: "translateY(-50%)",
    transition:
      "inset-inline-start 150ms ease, width 150ms ease, height 150ms ease, background-color 150ms ease",
    "& svg": {
      boxSize: "5",
      opacity: 0,
      transition: "opacity 150ms ease",
    },
    _checked: {
      insetInlineStart: "calc(100% - token(spacing.6) - token(spacing.1))",
      width: "6",
      height: "6",
      backgroundColor: "onPrimary",
      "& svg": { opacity: 1 },
    },
  }),
  label: css({
    cursor: "pointer",
    fontSize: "sm",
    fontWeight: "medium",
    color: "onSurface",
  }),
};

function Switch(props: SwitchProps): JSX.Element {
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
  const api = createMemo((): SwitchApi => connect(service, normalizeProps));

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
      <input {...hiddenInputProps()} />
      <span {...api().getControlProps()} class={styles.control}>
        <span {...api().getThumbProps()} class={styles.thumb}>
          <Check />
        </span>
      </span>
      <span {...api().getLabelProps()} class={styles.label}>
        {local.children}
      </span>
    </label>
  );
}

export { Switch };
