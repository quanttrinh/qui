import type { CollectionItem, ListCollection } from "@zag-js/collection";

import Check from "@iconify-solid/material-symbols/check";
import UnfoldMore from "@iconify-solid/material-symbols/unfold-more";
import {
  type Api,
  connect,
  machine,
  type PositioningOptions,
  type Props,
  props as selectProps,
  type ScrollToIndexDetails,
} from "@zag-js/select";
import { type PropTypes, normalizeProps, useMachine } from "@zag-js/solid";
import { type JSX, For, createMemo, createUniqueId, mergeProps, splitProps } from "solid-js";
import { Portal } from "solid-js/web";

import { css, cx } from "../../../../styled-system/css";
import { center, hstack } from "../../../../styled-system/patterns";
import { virtualList } from "../../../../styled-system/recipes";
import { createVirtualList } from "../../containers/VirtualList/createVirtualList";
import { VirtualList } from "../../containers/VirtualList/VirtualList";
import { useFieldContext } from "../Field/useFieldContext";

type SelectApi = Api<PropTypes>;

type SelectProps<T extends CollectionItem = CollectionItem> = Omit<
  Props,
  "id" | "ids" | "scrollToIndexFn" | "collection"
> & {
  /** The item collection. Build it with `collection({ items })`. */
  collection: ListCollection<T>;
  /** Text shown in the trigger while no value is selected. */
  placeholder?: string;
  class?: string;
};

const machinePropKeys = selectProps.filter(
  (key): key is Exclude<keyof Props, "id" | "ids" | "scrollToIndexFn" | "collection"> =>
    key !== "id" && key !== "ids" && key !== "scrollToIndexFn" && key !== "collection",
);

const defaultPositioning: PositioningOptions = {
  sameWidth: true,
  flip: true,
  placement: "bottom-start",
};

const styles = {
  root: css({ position: "relative", width: "full" }),
  control: css({ width: "full" }),
  trigger: hstack({
    justify: "space-between",
    gap: "2",
    width: "full",
    height: "10",
    paddingInlineStart: "3",
    paddingInlineEnd: "1.5",
    fontSize: "sm",
    color: "onSurface",
    backgroundColor: "surface",
    borderWidth: "1px",
    borderColor: "outlineVariant",
    rounded: "lg",
    cursor: "pointer",
    textAlign: "start",
    transition: "border-color 150ms, outline-color 150ms",
    _hover: { borderColor: "outline" },
    _focusVisible: {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary",
      outlineOffset: "0",
      borderColor: "primary",
    },
    _placeholderShown: { color: "onSurfaceVariant" },
    _invalid: { borderColor: "error" },
    _disabled: { opacity: 0.38, cursor: "not-allowed" },
  }),
  valueText: css({
    flex: "1",
    overflow: "hidden",
    textAlign: "start",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  }),
  indicator: center({
    flexShrink: 0,
    width: "6",
    height: "6",
    color: "onSurfaceVariant",
    fontSize: "md",
    _open: { transform: "rotate(180deg)" },
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

function Select<T extends CollectionItem = CollectionItem>(props: SelectProps<T>): JSX.Element {
  const field = useFieldContext();
  const [machineProps, local] = splitProps(props, machinePropKeys);
  const collection = (): ListCollection<T> => local.collection;

  const virtual = createVirtualList(() => collection().items.length);

  const context = mergeProps({ positioning: defaultPositioning }, machineProps, {
    id: createUniqueId(),
    get collection() {
      return collection();
    },
    get ids() {
      return field ? { hiddenSelect: field.ids.control, label: field.ids.label } : undefined;
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
  const api = createMemo((): SelectApi => connect(service, normalizeProps));

  const triggerProps = (): JSX.HTMLAttributes<HTMLButtonElement> => {
    if (!field) {
      return api().getTriggerProps();
    }
    const control = field.getInputProps();
    return {
      ...api().getTriggerProps(),
      "aria-describedby": control["aria-describedby"],
      "aria-errormessage": control["aria-errormessage"],
    };
  };

  const displayValue = (): string => {
    const text = api().valueAsString;
    if (text) {
      return text;
    }
    return local.placeholder ?? "Select an option";
  };

  return (
    <div {...api().getRootProps()} class={cx(styles.root, local.class)}>
      <select {...api().getHiddenSelectProps()}>
        <For each={collection().items}>
          {(item) => (
            <option value={collection().getItemValue(item) ?? ""}>
              {collection().stringifyItem(item) ?? ""}
            </option>
          )}
        </For>
      </select>

      <div {...api().getControlProps()} class={styles.control}>
        <button {...triggerProps()} class={styles.trigger}>
          <span {...api().getValueTextProps()} class={styles.valueText}>
            {displayValue()}
          </span>
          <span {...api().getIndicatorProps()} class={styles.indicator}>
            <UnfoldMore />
          </span>
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

export { Select };
