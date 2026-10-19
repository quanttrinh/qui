import ExpandMore from "@iconify-solid/material-symbols/expand-more";
import {
  type Api,
  connect,
  type ItemProps,
  machine,
  type Props,
  props as accordionProps,
} from "@zag-js/accordion";
import { type PropTypes, normalizeProps, useMachine } from "@zag-js/solid";
import {
  type JSX,
  createContext,
  createMemo,
  createUniqueId,
  mergeProps,
  splitProps,
} from "solid-js";

import { css, cx } from "../../../../styled-system/css";
import { hstack } from "../../../../styled-system/patterns";
import { useContext } from "../../../utilities/context";

type AccordionApi = Api<PropTypes>;

interface AccordionContextValue {
  api: () => AccordionApi;
}

interface AccordionItemContextValue {
  api: () => AccordionApi;
  item: () => ItemProps;
}

const AccordionContext = createContext<AccordionContextValue>();
const AccordionItemContext = createContext<AccordionItemContextValue>();

const machinePropKeys = accordionProps.filter(
  (key): key is Exclude<keyof Props, "id"> => key !== "id",
);

interface AccordionProps extends Omit<Props, "id"> {
  class?: string;
  children?: JSX.Element;
}

interface AccordionItemProps {
  /** The value that uniquely identifies the item. */
  value: string;
  /** Whether the item is disabled. */
  disabled?: boolean;
  class?: string;
  children?: JSX.Element;
}

interface AccordionPartProps {
  class?: string;
  children?: JSX.Element;
}

const styles = {
  root: css({
    width: "full",
    borderWidth: "1px",
    borderColor: "outlineVariant",
    rounded: "xl",
    backgroundColor: "surface",
    overflow: "hidden",
  }),
  item: css({
    borderBottomWidth: "1px",
    borderColor: "outlineVariant",
    _last: { borderBottomWidth: "0" },
    _disabled: { opacity: 0.38, cursor: "not-allowed" },
  }),
  trigger: hstack({
    justify: "space-between",
    width: "full",
    paddingX: "4",
    paddingY: "3",
    borderWidth: "0",
    backgroundColor: "transparent",
    fontSize: "sm",
    fontWeight: "medium",
    color: "onSurface",
    textAlign: "start",
    cursor: "pointer",
    _hover: { backgroundColor: "surfaceContainerHigh" },
    _focusVisible: {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary",
      outlineOffset: "-2px",
    },
    _disabled: { cursor: "not-allowed" },
  }),
  content: css({
    display: "grid",
    gridTemplateRows: "0fr",
    opacity: 0,
    transition: "grid-template-rows 200ms ease, opacity 200ms ease",
    "&[data-state=open]": {
      gridTemplateRows: "1fr",
      opacity: 1,
    },
  }),
  contentBody: css({
    overflow: "hidden",
    minHeight: "0",
  }),
  contentPadding: css({
    paddingX: "4",
    paddingY: "3",
    fontSize: "sm",
    color: "onSurfaceVariant",
  }),
  indicator: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    width: "6",
    height: "6",
    color: "onSurfaceVariant",
    fontSize: "md",
    transition: "transform 200ms ease",
    "&[data-state=open]": { transform: "rotate(180deg)" },
  }),
};

function AccordionRoot(props: AccordionProps): JSX.Element {
  const [machineProps, localProps] = splitProps(props, machinePropKeys);
  const context = mergeProps(machineProps, { id: createUniqueId() });

  const service = useMachine(machine, context);
  const api = createMemo(() => connect(service, normalizeProps));

  return (
    <AccordionContext.Provider value={{ api }}>
      <div {...api().getRootProps()} class={cx(styles.root, localProps.class)}>
        {localProps.children}
      </div>
    </AccordionContext.Provider>
  );
}

function AccordionItem(props: AccordionItemProps): JSX.Element {
  const context = useContext(AccordionContext, "Accordion.Item", "Accordion");

  const [local] = splitProps(props, ["value", "disabled", "class", "children"]);
  const item = (): ItemProps => ({ value: local.value, disabled: local.disabled });

  return (
    <AccordionItemContext.Provider value={{ api: context.api, item }}>
      <div {...context.api().getItemProps(item())} class={cx(styles.item, local.class)}>
        {local.children}
      </div>
    </AccordionItemContext.Provider>
  );
}

function AccordionItemTrigger(props: AccordionPartProps): JSX.Element {
  const context = useContext(AccordionItemContext, "Accordion.ItemTrigger", "Accordion.Item");
  const [local] = splitProps(props, ["class", "children"]);

  return (
    <h3>
      <button
        {...context.api().getItemTriggerProps(context.item())}
        class={cx(styles.trigger, local.class)}
      >
        {local.children}
        <span {...context.api().getItemIndicatorProps(context.item())} class={styles.indicator}>
          <ExpandMore />
        </span>
      </button>
    </h3>
  );
}

function AccordionItemContent(props: AccordionPartProps): JSX.Element {
  const context = useContext(AccordionItemContext, "Accordion.ItemContent", "Accordion.Item");
  const [local] = splitProps(props, ["class", "children"]);

  const expanded = (): boolean => context.api().getItemState(context.item()).expanded;

  return (
    <div
      {...context.api().getItemContentProps(context.item())}
      hidden={false}
      inert={expanded() ? undefined : true}
      class={cx(styles.content, local.class)}
    >
      <div class={styles.contentBody}>
        <div class={styles.contentPadding}>{local.children}</div>
      </div>
    </div>
  );
}

const Accordion = Object.assign(AccordionRoot, {
  Item: AccordionItem,
  ItemTrigger: AccordionItemTrigger,
  ItemContent: AccordionItemContent,
});

export { Accordion };
