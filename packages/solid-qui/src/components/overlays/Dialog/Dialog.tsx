import { type Api, connect, machine, type Props, props as dialogProps } from "@zag-js/dialog";
import { type PropTypes, normalizeProps, useMachine } from "@zag-js/solid";
import {
  type Accessor,
  type JSX,
  createContext,
  createMemo,
  createUniqueId,
  mergeProps,
  Show,
  splitProps,
} from "solid-js";
import { Portal } from "solid-js/web";

import { css, cx } from "../../../../styled-system/css";
import { useContext } from "../../../utilities/context";
import { Button, type ButtonButtonProps } from "../../buttons/Button";

type DialogApi = Api<PropTypes>;

interface DialogContextValue {
  api: Accessor<DialogApi>;
}

const DialogContext = createContext<DialogContextValue>();

const machinePropKeys = dialogProps.filter(
  (key): key is Exclude<keyof Props, "id"> => key !== "id",
);

interface DialogProps extends Omit<Props, "id"> {
  children?: JSX.Element;
}

interface DialogPartProps {
  class?: string;
  children?: JSX.Element;
}

type DialogTriggerProps = ButtonButtonProps & {
  /** Identifies this trigger when a dialog is shared across multiple triggers. */
  value?: string;
};

const styles = {
  scrim: css({
    position: "fixed",
    inset: "0",
    zIndex: "50",
    backgroundColor: "scrim",
    opacity: 0.32,
  }),
  positioner: css({
    position: "fixed",
    inset: "0",
    zIndex: "50",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6",
  }),
  // MD3 basic dialog: surfaceContainerHigh, 28dp corners, level-3 elevation.
  content: css({
    display: "flex",
    flexDirection: "column",
    gap: "4",
    width: "full",
    minWidth: "72",
    maxWidth: "xl",
    padding: "6",
    rounded: "3xl",
    backgroundColor: "surfaceContainerHigh",
    boxShadow: "xl",
    color: "onSurface",
  }),
  // MD3 headline-small.
  title: css({
    fontSize: "2xl",
    fontWeight: "normal",
    lineHeight: "snug",
    color: "onSurface",
  }),
  description: css({
    fontSize: "sm",
    color: "onSurfaceVariant",
  }),
  actions: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "2",
    marginBlockStart: "2",
  }),
};

function DialogRoot(props: DialogProps): JSX.Element {
  const [machineProps, local] = splitProps(props, machinePropKeys);
  const context = mergeProps(machineProps, { id: createUniqueId() });

  const service = useMachine(machine, context);
  const api = createMemo(() => connect(service, normalizeProps));

  return <DialogContext.Provider value={{ api }}>{local.children}</DialogContext.Provider>;
}

function DialogTrigger(props: DialogTriggerProps): JSX.Element {
  const context = useContext(DialogContext, "Dialog.Trigger", "Dialog");
  const [local, rest] = splitProps(props, ["value", "class", "children"]);

  return (
    <Button
      {...rest}
      {...context.api().getTriggerProps({ value: local.value })}
      class={local.class}
    >
      {local.children}
    </Button>
  );
}

function DialogContent(props: DialogPartProps): JSX.Element {
  const context = useContext(DialogContext, "Dialog.Content", "Dialog");
  const [local] = splitProps(props, ["class", "children"]);

  return (
    <Show when={context.api().open}>
      <Portal>
        <div {...context.api().getBackdropProps()} class={styles.scrim} />
        <div {...context.api().getPositionerProps()} class={styles.positioner}>
          <div {...context.api().getContentProps()} class={cx(styles.content, local.class)}>
            {local.children}
          </div>
        </div>
      </Portal>
    </Show>
  );
}

function DialogTitle(props: DialogPartProps): JSX.Element {
  const context = useContext(DialogContext, "Dialog.Title", "Dialog");
  const [local] = splitProps(props, ["class", "children"]);

  return (
    <h2 {...context.api().getTitleProps()} class={cx(styles.title, local.class)}>
      {local.children}
    </h2>
  );
}

function DialogDescription(props: DialogPartProps): JSX.Element {
  const context = useContext(DialogContext, "Dialog.Description", "Dialog");
  const [local] = splitProps(props, ["class", "children"]);

  return (
    <p {...context.api().getDescriptionProps()} class={cx(styles.description, local.class)}>
      {local.children}
    </p>
  );
}

/** Right-aligned row of action buttons. */
function DialogActions(props: DialogPartProps): JSX.Element {
  const [local] = splitProps(props, ["class", "children"]);

  return <div class={cx(styles.actions, local.class)}>{local.children}</div>;
}

function DialogClose(props: ButtonButtonProps): JSX.Element {
  const context = useContext(DialogContext, "Dialog.Close", "Dialog");
  const [local, rest] = splitProps(props, ["variant", "class", "children"]);

  return (
    <Button
      {...rest}
      variant={local.variant ?? "text"}
      {...context.api().getCloseTriggerProps()}
      class={local.class}
    >
      {local.children}
    </Button>
  );
}

const Dialog = Object.assign(DialogRoot, {
  Trigger: DialogTrigger,
  Content: DialogContent,
  Title: DialogTitle,
  Description: DialogDescription,
  Actions: DialogActions,
  Close: DialogClose,
});

export { Dialog };
export type { DialogPartProps, DialogProps, DialogTriggerProps };
