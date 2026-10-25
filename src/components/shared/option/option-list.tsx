import { h, type VNode } from "@stencil/core";

import { css } from "#styled-system/css";

import { CheckIcon } from "../../qui-icon/icons";
import { type PopoverDismissEvent } from "../../qui-popover/qui-popover";
import { type ListEntry, type ListWindow } from "../list-window/model";
import { type OptionItem, type OptionRender, type OptionRenderState } from "./option";

/** Maximum height of the list panel. */
export const PANEL_MAX_HEIGHT = 320;

export const listStyles = {
  listbox: css({
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    minHeight: "0",
    overflow: "hidden",
    width: "full",
    backgroundColor: "surface",
    borderWidth: "1px",
    borderColor: "outlineVariant",
    rounded: "xl",
    boxShadow: "md",
  }),
  viewport: css({
    flex: "1 1 auto",
    minHeight: "0",
    overflowY: "auto",
    paddingY: "1",
  }),
  canvas: css({ position: "relative" }),
  block: css({ position: "absolute", insetInline: "0", top: "0" }),
  empty: css({
    paddingX: "3",
    paddingY: "2",
    fontSize: "sm",
    color: "onSurfaceVariant",
  }),
  srOnly: css({
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: "0",
    margin: "-1px",
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    borderWidth: "0",
  }),
  item: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "2",
    width: "full",
    minHeight: "10",
    paddingX: "3",
    fontSize: "sm",
    color: "onSurface",
    cursor: "pointer",
    "&[data-highlighted]": { backgroundColor: "surfaceContainerHighest" },
    "&[data-state=checked]": {
      backgroundColor: "secondaryContainer",
      color: "onSecondaryContainer",
      fontWeight: "medium",
    },
    "&[data-disabled]": { opacity: 0.38, cursor: "not-allowed" },
  }),
  itemText: css({
    flex: "1",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  }),
  itemIndicator: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    width: "5",
    color: "primary",
    fontSize: "sm",
  }),
};

interface OptionListProps<TItem extends OptionItem> {
  list: ListWindow<TItem>;
  listId: string;
  open: boolean;
  multiple: boolean;
  status: string;
  viewportRef: (element?: HTMLDivElement) => void;
  onDismiss: (event: CustomEvent<PopoverDismissEvent>) => void;
  onScroll: (event: Event) => void;
  renderItem: (entry: ListEntry<TItem>) => VNode;
  renderEmpty?: () => VNode;
}

interface OptionRowProps<TItem extends OptionItem> {
  entry: ListEntry<TItem>;
  listId: string;
  total: number;
  activeValue?: string;
  selected: boolean;
  optionRender?: OptionRender<TItem>;
  onSelect: (value: string) => void;
  onHighlight: (value: string) => void;
}

/** Shared popover + listbox markup used by select and combobox. */
export function renderOptionList<TItem extends OptionItem>({
  list,
  listId,
  open,
  multiple,
  status,
  viewportRef,
  onDismiss,
  onScroll,
  renderItem,
  renderEmpty,
}: OptionListProps<TItem>): VNode {
  return (
    <qui-popover
      open={open}
      sameWidth
      placement="bottom-start"
      maxHeight={PANEL_MAX_HEIGHT}
      bare
      closeOnEscape={false}
      onDismiss={onDismiss}
    >
      <div
        id={listId}
        role="listbox"
        class={listStyles.listbox}
        part="listbox"
        aria-multiselectable={multiple ? "true" : undefined}
      >
        <div ref={viewportRef} class={listStyles.viewport} part="viewport" onScroll={onScroll}>
          {/* Stencil applies style objects through CSSOM, which is CSP-safe. */}
          <div class={listStyles.canvas} style={{ height: `${list.totalSize}px` }}>
            <div class={listStyles.block} style={{ transform: `translateY(${list.offset}px)` }}>
              {list.entries.map((entry) => renderItem(entry))}
            </div>
          </div>
          {list.total === 0 ? renderEmpty?.() : undefined}
          <output class={listStyles.srOnly} aria-live="polite">
            {status}
          </output>
        </div>
      </div>
    </qui-popover>
  );
}

/** Shared option row used by select and combobox. */
export function renderOptionRow<TItem extends OptionItem>({
  entry,
  listId,
  total,
  activeValue,
  selected,
  optionRender,
  onSelect,
  onHighlight,
}: OptionRowProps<TItem>): VNode {
  const { item } = entry;
  const state: OptionRenderState = {
    index: entry.index,
    selected,
    active: item.value === activeValue,
    disabled: item.disabled,
  };
  return (
    <div
      key={entry.index}
      id={`${listId}-${entry.index}`}
      role="option"
      class={listStyles.item}
      part="option"
      data-index={entry.index}
      data-value={item.value}
      data-highlighted={item.value === activeValue ? "" : undefined}
      data-state={selected ? "checked" : "unchecked"}
      data-disabled={item.disabled ? "" : undefined}
      aria-selected={selected ? "true" : "false"}
      aria-disabled={item.disabled ? "true" : undefined}
      aria-posinset={entry.index + 1}
      aria-setsize={total}
      onMouseDown={(event) => {
        event.preventDefault();
      }}
      onPointerMove={() => {
        if (!item.disabled) {
          onHighlight(item.value);
        }
      }}
      onClick={() => {
        onSelect(item.value);
      }}
    >
      {optionRender === undefined
        ? [
            <span key="text" class={listStyles.itemText} part="option-text">
              {item.label}
            </span>,
            <span
              key="indicator"
              class={listStyles.itemIndicator}
              part="option-indicator"
              hidden={!selected}
            >
              <CheckIcon />
            </span>,
          ]
        : optionRender(item, state)}
    </div>
  );
}
