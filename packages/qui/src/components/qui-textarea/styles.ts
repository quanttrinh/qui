import { css } from "#styled-system/css";

import { fieldSurface, focusRingFlush } from "../shared/styles";

export const styles = {
  host: css({ display: "block" }),
  root: css({ width: "full" }),
  control: css({
    ...fieldSurface,
    display: "flex",
    flexDirection: "column",
    width: "full",
    "&:focus-within": {
      ...focusRingFlush,
      borderColor: "primary",
    },
    "&[data-invalid]": { borderColor: "error" },
    "&[data-readonly]": { backgroundColor: "surfaceContainerLow" },
    "&[data-disabled]": { opacity: 0.38, cursor: "not-allowed" },
  }),
  textarea: css({
    display: "block",
    width: "full",
    minHeight: "0",
    padding: "3",
    fontSize: "sm",
    lineHeight: "snug",
    color: "onSurface",
    backgroundColor: "transparent",
    outlineStyle: "none",
    outlineWidth: "0",
    borderWidth: "0",
    resize: "vertical",
    "&::placeholder": { color: "onSurfaceVariant" },
    "&:disabled": { cursor: "not-allowed" },
    "&[data-resize=auto], &[data-resize=none]": { resize: "none" },
  }),
  counter: css({
    paddingInline: "3",
    paddingBottom: "2",
    textAlign: "end",
    fontSize: "xs",
    color: "onSurfaceVariant",
  }),
};
