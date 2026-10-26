import { css } from "#styled-system/css";

import { fieldSurface, focusRingFlush } from "../shared/styles";

export const selectStyles = {
  host: css({ display: "block" }),
  root: css({ position: "relative", width: "full" }),
  control: css({ width: "full" }),
  trigger: css({
    ...fieldSurface,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "2",
    width: "full",
    height: "10",
    paddingInlineStart: "3",
    paddingInlineEnd: "1.5",
    fontSize: "sm",
    color: "onSurface",
    cursor: "pointer",
    textAlign: "start",
    "&:focus-visible": {
      ...focusRingFlush,
      borderColor: "primary",
    },
    "&[data-placeholder-shown]": { color: "onSurfaceVariant" },
    "&[data-invalid]": { borderColor: "error" },
    "&:disabled": { opacity: 0.38, cursor: "not-allowed" },
  }),
  valueText: css({
    flex: "1",
    overflow: "hidden",
    textAlign: "start",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
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
    "& svg": { width: "1em", height: "1em" },
    "&[data-state=open]": { transform: "rotate(180deg)" },
  }),
};
