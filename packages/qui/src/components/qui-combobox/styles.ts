import { css } from "#styled-system/css";

import { fieldSurface, focusRingFlush, focusRingInset } from "../shared/styles";

export const comboboxStyles = {
  host: css({ display: "block" }),
  root: css({ pos: "relative", w: "full" }),
  control: css({
    ...fieldSurface,
    display: "flex",
    alignItems: "center",
    w: "full",
    h: "10",
    "&:focus-within": {
      ...focusRingFlush,
      borderColor: "primary",
    },
    "&[data-invalid]": { borderColor: "error" },
    "&[data-disabled]": { opacity: 0.38, cursor: "not-allowed" },
  }),
  input: css({
    flex: "1",
    minW: "0",
    h: "full",
    px: "3",
    fontSize: "sm",
    color: "onSurface",
    bgColor: "transparent",
    outlineStyle: "none",
    ringWidth: "0",
    borderWidth: "0",
    "&::placeholder": { color: "onSurfaceVariant" },
  }),
  trigger: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    w: "9",
    h: "full",
    color: "onSurfaceVariant",
    cursor: "pointer",
    fontSize: "md",
    bgColor: "transparent",
    borderWidth: "0",
    "&:hover": { color: "onSurface" },
    "&:focus-visible": focusRingInset,
    "&:disabled": { cursor: "not-allowed" },
  }),
};
