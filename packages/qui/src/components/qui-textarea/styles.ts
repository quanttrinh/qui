import { css } from "#styled-system/css";
import { token } from "#styled-system/tokens";

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
      ringColor: `var(--qui-field-focus-ring-color, ${token("colors.primary")})`,
      borderColor: `var(--qui-field-focus-border-color, ${token("colors.primary")})`,
    },
    "&[data-invalid]": { borderColor: `var(--qui-field-error-color, ${token("colors.error")})` },
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
    color: `var(--qui-field-text-color, ${token("colors.onSurface")})`,
    bgColor: "transparent",
    outlineStyle: "none",
    ringWidth: "0",
    borderWidth: "0",
    resize: "vertical",
    "&::placeholder": {
      color: `var(--qui-field-placeholder-color, ${token("colors.onSurfaceVariant")})`,
    },
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
