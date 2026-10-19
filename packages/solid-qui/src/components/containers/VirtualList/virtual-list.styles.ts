import { defineSlotRecipe } from "@pandacss/dev";

/**
 * Slots for the virtualized list shared by `VirtualList`, `Select` and `Combobox`.
 *
 * Defined alongside the component and registered in `panda.config.ts`, so the
 * styles are still part of the design system consumers compile against.
 */
export const virtualListRecipe = defineSlotRecipe({
  className: "virtual-list",
  slots: ["positioner", "content", "spacer", "item", "itemText", "itemIndicator"],
  base: {
    positioner: {
      zIndex: 50,
      width: "var(--reference-width)",
    },
    content: {
      width: "full",
      maxHeight: "min(320px, var(--available-height))",
      overflowY: "auto",
      backgroundColor: "surface",
      borderWidth: "1px",
      borderColor: "outlineVariant",
      rounded: "xl",
      boxShadow: "md",
      paddingY: "1",
      outlineWidth: 0,
    },
    spacer: {
      position: "relative",
      width: "full",
      height: "var(--total-size)",
    },
    item: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "2",
      position: "absolute",
      top: "0",
      left: "0",
      width: "full",
      height: "var(--item-size)",
      transform: "translateY(var(--item-offset))",
      paddingX: "3",
      fontSize: "sm",
      color: "onSurface",
      cursor: "pointer",
      _highlighted: { backgroundColor: "surfaceContainerHighest" },
      _checked: {
        backgroundColor: "secondaryContainer",
        color: "onSecondaryContainer",
        fontWeight: "medium",
      },
      _disabled: { opacity: 0.38, cursor: "not-allowed" },
    },
    itemText: {
      flex: "1",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    itemIndicator: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      width: "5",
      color: "primary",
      fontSize: "sm",
    },
  },
});
