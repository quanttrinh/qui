import { css } from "#styled-system/css";

import { fieldSurface, focusRingFlush, focusRingInset } from "../shared/styles";

export const comboboxStyles = {
  host: css({ display: "block" }),
  root: css({ position: "relative", width: "full" }),
  control: css({
    ...fieldSurface,
    display: "flex",
    alignItems: "center",
    width: "full",
    height: "10",
    "&:focus-within": {
      ...focusRingFlush,
      borderColor: "primary",
    },
    "&[data-invalid]": { borderColor: "error" },
    "&[data-disabled]": { opacity: 0.38, cursor: "not-allowed" },
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
    borderWidth: "0",
    "&::placeholder": { color: "onSurfaceVariant" },
  }),
  trigger: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    width: "9",
    height: "full",
    color: "onSurfaceVariant",
    cursor: "pointer",
    fontSize: "md",
    backgroundColor: "transparent",
    borderWidth: "0",
    "&:hover": { color: "onSurface" },
    "&:focus-visible": focusRingInset,
    "&:disabled": { cursor: "not-allowed" },
    "& svg": { width: "1em", height: "1em" },
  }),
};
