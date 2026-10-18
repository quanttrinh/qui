import { type PropTypes, normalizeProps, useMachine } from "@zag-js/solid";
import { type Api, connect, machine, type Props, props as tabsProps } from "@zag-js/tabs";
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

import { css, cx } from "../../../../styled-system/css";
import { useContext } from "../../../utilities/context";

type TabsApi = Api<PropTypes>;
type TabsVariant = "primary" | "secondary";

interface TabsContextValue {
  api: Accessor<TabsApi>;
  variant: Accessor<TabsVariant>;
  orientation: Accessor<"horizontal" | "vertical">;
}

const TabsContext = createContext<TabsContextValue>();

const machinePropKeys = tabsProps.filter((key): key is Exclude<keyof Props, "id"> => key !== "id");

interface TabsProps extends Omit<Props, "id"> {
  /** MD3 tab type. Primary (default) or secondary. */
  variant?: TabsVariant;
  class?: string;
  children?: JSX.Element;
}

interface TabsTriggerProps {
  /** The value that links the trigger to its content. */
  value: string;
  /** Whether the tab is disabled. */
  disabled?: boolean;
  class?: string;
  children?: JSX.Element;
}

interface TabsContentProps {
  /** The value that links the content to its trigger. */
  value: string;
  class?: string;
  children?: JSX.Element;
}

interface TabsPartProps {
  class?: string;
  children?: JSX.Element;
}

const styles = {
  root: css({
    display: "flex",
    flexDirection: "column",
    width: "full",
    color: "onSurface",
    "&[data-orientation=vertical]": {
      flexDirection: "row",
      alignItems: "flex-start",
    },
  }),
  list: css({
    position: "relative",
    display: "flex",
    flexShrink: 0,
    borderBlockEndWidth: "1px",
    borderColor: "outlineVariant",
    "&[data-orientation=vertical]": {
      flexDirection: "column",
      borderBlockEndWidth: "0",
      borderInlineEndWidth: "1px",
    },
  }),
  trigger: css({
    position: "relative",
    isolation: "isolate",
    display: "flex",
    flex: "1",
    alignItems: "center",
    justifyContent: "center",
    paddingInline: "4",
    color: "onSurfaceVariant",
    fontSize: "sm",
    fontWeight: "medium",
    whiteSpace: "nowrap",
    cursor: "pointer",
    transition: "color 150ms",
    "& svg": { boxSize: "6" },
    "&::before": {
      content: '""',
      position: "absolute",
      inset: "0",
      zIndex: "-1",
      backgroundColor: "currentColor",
      opacity: 0,
      pointerEvents: "none",
      transition: "opacity 150ms",
    },
    "&:hover:not(:disabled)::before": { opacity: 0.08 },
    "&:focus-visible::before": { opacity: 0.1 },
    "&:active:not(:disabled)::before": { opacity: 0.1 },
    "&:hover:not([data-selected])": { color: "onSurface" },
    "&[data-selected]": { color: "primary" },
    "&[data-variant=secondary][data-selected]": { color: "onSurface" },
    _focusVisible: {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary",
      outlineOffset: "-2px",
    },
    _disabled: { cursor: "not-allowed", opacity: 0.38 },
    "&[data-orientation=vertical]": {
      flex: "none",
      justifyContent: "flex-start",
      width: "full",
    },
  }),
  tabContent: css({
    position: "relative",
    display: "inline-flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "1",
    minHeight: "12",
    paddingBlock: "2",
    "&[data-variant=secondary]": { flexDirection: "row", gap: "2" },
    "&[data-orientation=vertical]": { width: "full", justifyContent: "flex-start" },
  }),
  indicator: css({
    position: "absolute",
    backgroundColor: "primary",
    opacity: 0,
    transform: "scaleX(0.5)",
    transition: "opacity 150ms, transform 200ms cubic-bezier(0.2, 0, 0, 1)",
    "[data-selected] &": { opacity: 1, transform: "scaleX(1)" },
    insetBlockEnd: "0",
    insetInline: "0",
    marginInline: "0.5",
    height: "3px",
    borderTopLeftRadius: "3px",
    borderTopRightRadius: "3px",
    "&[data-variant=secondary]": {
      marginInline: "0",
      height: "0.5",
      borderTopLeftRadius: "0",
      borderTopRightRadius: "0",
    },
    "&[data-orientation=vertical]": {
      inset: "0 auto 0 0",
      marginBlock: "0.5",
      marginInline: "0",
      width: "3px",
      height: "auto",
      borderRadius: "3px 0 0 3px",
    },
    "&[data-orientation=vertical][data-variant=secondary]": {
      marginBlock: "0",
      width: "0.5",
      borderRadius: "0",
    },
  }),
  panel: css({
    flex: "1",
    paddingY: "3",
    outlineStyle: "none",
    fontSize: "sm",
    color: "onSurfaceVariant",
    "&[data-orientation=vertical]": { paddingY: "0", paddingInlineStart: "4" },
    _focusVisible: {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary",
      outlineOffset: "2px",
    },
  }),
};

function TabsRoot(props: TabsProps): JSX.Element {
  const [machineProps, local] = splitProps(props, machinePropKeys);
  const context = mergeProps(machineProps, { id: createUniqueId() });

  const service = useMachine(machine, context);
  const api = createMemo(() => connect(service, normalizeProps));
  const variant = (): TabsVariant => local.variant ?? "primary";
  const orientation = (): "horizontal" | "vertical" => machineProps.orientation ?? "horizontal";

  return (
    <TabsContext.Provider value={{ api, variant, orientation }}>
      <div {...api().getRootProps()} data-variant={variant()} class={cx(styles.root, local.class)}>
        {local.children}
      </div>
    </TabsContext.Provider>
  );
}

function TabsList(props: TabsPartProps): JSX.Element {
  const context = useContext(TabsContext, "Tabs.List", "Tabs");
  const [local] = splitProps(props, ["class", "children"]);

  return (
    <div
      {...context.api().getListProps()}
      data-variant={context.variant()}
      class={cx(styles.list, local.class)}
    >
      {local.children}
    </div>
  );
}

function TabsTrigger(props: TabsTriggerProps): JSX.Element {
  const context = useContext(TabsContext, "Tabs.Trigger", "Tabs");
  const [local] = splitProps(props, ["value", "disabled", "class", "children"]);

  const indicator = (): JSX.Element => (
    <span
      class={styles.indicator}
      data-variant={context.variant()}
      data-orientation={context.orientation()}
    />
  );

  return (
    <button
      {...context.api().getTriggerProps({ value: local.value, disabled: local.disabled })}
      data-variant={context.variant()}
      class={cx(styles.trigger, local.class)}
    >
      <span
        class={styles.tabContent}
        data-variant={context.variant()}
        data-orientation={context.orientation()}
      >
        {local.children}
        <Show when={context.variant() === "primary"}>{indicator()}</Show>
      </span>
      {/* Secondary spans the full tab width. */}
      <Show when={context.variant() === "secondary"}>{indicator()}</Show>
    </button>
  );
}

function TabsContent(props: TabsContentProps): JSX.Element {
  const context = useContext(TabsContext, "Tabs.Content", "Tabs");
  const [local] = splitProps(props, ["value", "class", "children"]);

  return (
    <div
      {...context.api().getContentProps({ value: local.value })}
      class={cx(styles.panel, local.class)}
    >
      {local.children}
    </div>
  );
}

const Tabs = Object.assign(TabsRoot, {
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
});

export { Tabs };
export type { TabsContentProps, TabsPartProps, TabsProps, TabsTriggerProps, TabsVariant };
