import type { CollectionItem, ListCollection } from "@zag-js/collection";

import Check from "@iconify-solid/material-symbols/check";
import UnfoldMore from "@iconify-solid/material-symbols/unfold-more";
import {
  type Api,
  connect,
  machine,
  type PositioningOptions,
  type Props,
  props as comboboxProps,
  type ScrollToIndexDetails,
} from "@zag-js/combobox";
import { type PropTypes, normalizeProps, useMachine } from "@zag-js/solid";
import { type JSX, createMemo, createUniqueId, mergeProps, splitProps } from "solid-js";
import { Portal } from "solid-js/web";

import { css, cx } from "../../../../styled-system/css";
import { center, flex } from "../../../../styled-system/patterns";
import { virtualList } from "../../../../styled-system/recipes";
import { createVirtualList } from "../../containers/VirtualList/createVirtualList";
import { VirtualList } from "../../containers/VirtualList/VirtualList";
import { useFieldContext } from "../Field/useFieldContext";

type ComboboxApi = Api<PropTypes>;

type ComboboxProps<T extends CollectionItem = CollectionItem> = Omit<
  Props,
  "id" | "ids" | "scrollToIndexFn" | "collection"
> & {
  /** The item collection. Build it with `collection({ items })`. */
  collection: ListCollection<T>;
  class?: string;
};

const machinePropKeys = comboboxProps.filter(
  (key): key is Exclude<keyof Props, "id" | "ids" | "scrollToIndexFn" | "collection"> =>
    key !== "id" && key !== "ids" && key !== "scrollToIndexFn" && key !== "collection",
);

const defaultPositioning: PositioningOptions = {
  sameWidth: true,
  flip: true,
  placement: "bottom-start",
};

const defaultProps: Pick<Props, "positioning" | "inputBehavior"> = {
  positioning: defaultPositioning,
  inputBehavior: "autohighlight",
};

const styles = {
  root: css({ position: "relative", width: "full" }),
  control: flex({
    align: "center",
    width: "full",
    height: "10",
    backgroundColor: "surface",
    borderWidth: "1px",
    borderColor: "outlineVariant",
    rounded: "lg",
    overflow: "hidden",
    transition: "border-color 150ms, outline-color 150ms",
    _hover: { borderColor: "outline" },
    _focusWithin: {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary",
      outlineOffset: "0",
      borderColor: "primary",
    },
    _invalid: { borderColor: "error" },
    _disabled: { opacity: 0.38, cursor: "not-allowed" },
  }),
  input: css({
    flex: "1",
    minWidth: "0",
    height: "full",
    paddingX: "3",
    fontSize: "sm",
    color: "onSurface",
    backgroundColor: "transparent",
    outlineStyle: "none",
    outlineWidth: "0",
    _placeholder: { color: "onSurfaceVariant" },
  }),
  trigger: center({
    flexShrink: 0,
    width: "9",
    height: "full",
    color: "onSurfaceVariant",
    cursor: "pointer",
    fontSize: "md",
    _hover: { color: "onSurface" },
    _focusVisible: {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary",
      outlineOffset: "-2px",
    },
    _disabled: { cursor: "not-allowed" },
  }),
  listContent: css({
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    paddingBlock: "2",
  }),
  listViewport: css({
    flex: "1 1 auto",
    minHeight: "0",
    overflowY: "auto",
  }),
};

const listStyles = virtualList();

function Combobox<T extends CollectionItem = CollectionItem>(props: ComboboxProps<T>): JSX.Element {
  const field = useFieldContext();
  const [machineProps, local] = splitProps(props, machinePropKeys);
  const collection = (): ListCollection<T> => local.collection;

  const virtual = createVirtualList(() => collection().items.length);

  const context = mergeProps(defaultProps, machineProps, {
    id: createUniqueId(),
    get collection() {
      return collection();
    },
    get ids() {
      return field ? { input: field.ids.control, label: field.ids.label } : undefined;
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
    scrollToIndexFn(details: ScrollToIndexDetails) {
      virtual.scrollToIndex(details.index, details.immediate);
    },
  });

  const service = useMachine(machine, context);
  const api = createMemo((): ComboboxApi => connect(service, normalizeProps));

  const inputProps = (): JSX.InputHTMLAttributes<HTMLInputElement> => {
    if (!field) {
      return api().getInputProps();
    }
    const control = field.getInputProps();
    return {
      ...api().getInputProps(),
      "aria-describedby": control["aria-describedby"],
      "aria-errormessage": control["aria-errormessage"],
    };
  };

  return (
    <div {...api().getRootProps()} class={cx(styles.root, local.class)}>
      <div {...api().getControlProps()} class={styles.control}>
        <input {...inputProps()} class={styles.input} />
        <button {...api().getTriggerProps()} class={styles.trigger}>
          <UnfoldMore />
        </button>
      </div>

      <Portal>
        <div {...api().getPositionerProps()} class={listStyles.positioner}>
          <div {...api().getContentProps()} class={cx(listStyles.content, styles.listContent)}>
            <div ref={virtual.setScrollElement} class={styles.listViewport}>
              <VirtualList
                controller={virtual}
                getItem={(index) => collection().items[index]}
                getItemProps={(item) => ({ ...api().getItemProps({ item }) })}
                render={(item) => (
                  <>
                    <span {...api().getItemTextProps({ item })} class={listStyles.itemText}>
                      {collection().stringifyItem(item) ?? ""}
                    </span>
                    <span
                      {...api().getItemIndicatorProps({ item })}
                      class={listStyles.itemIndicator}
                    >
                      <Check />
                    </span>
                  </>
                )}
              />
            </div>
          </div>
        </div>
      </Portal>
    </div>
  );
}

export { Combobox };
