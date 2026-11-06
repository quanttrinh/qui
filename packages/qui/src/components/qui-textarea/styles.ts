import { css } from "#styled-system/css";

import { fieldSurface, focusRingFlush } from "../shared/styles";

export const styles = {
  host: css({ display: "block" }),
  root: css({ w: "full" }),
  control: css({
    ...fieldSurface,
    display: "flex",
    flexDir: "column",
    w: "full",
    "&:focus-within": {
      ...focusRingFlush,
      borderColor: "primary",
    },
    "&[data-invalid]": { borderColor: "error" },
    "&[data-readonly]": { bgColor: "surfaceContainerLow" },
    "&[data-disabled]": { opacity: 0.38, cursor: "not-allowed" },
  }),
  textarea: css({
    display: "block",
    w: "full",
    minH: "0",
    p: "3",
    textStyle: "sm",
    lineHeight: "snug",
    color: "onSurface",
    bgColor: "transparent",
    outlineStyle: "none",
    ringWidth: "0",
    borderWidth: "0",
    resize: "vertical",
    "&::placeholder": { color: "onSurfaceVariant" },
    "&:disabled": { cursor: "not-allowed" },
    "&[data-resize=auto], &[data-resize=none]": { resize: "none" },
  }),
  counter: css({
    px: "3",
    paddingBlockEnd: "2",
    textAlign: "end",
    fontSize: "xs",
    color: "onSurfaceVariant",
  }),
};
