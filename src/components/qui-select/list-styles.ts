import { css } from "#styled-system/css";

export const listStyles = {
  positioner: css({
    zIndex: 50,
    width: "var(--reference-width)",
  }),
  content: css({
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
    // Off-screen rows skip layout and paint while keeping their DOM node.
    // This is CSS-native virtualization; browsers without support simply render
    // Every row renders normally in browsers without support.
    contentVisibility: "auto",
    containIntrinsicSize: "auto 40px",
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
