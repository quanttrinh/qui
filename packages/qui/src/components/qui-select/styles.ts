import { css } from "#styled-system/css";

import { token } from "../../../styled-system/tokens";
import { fieldSurface, focusRingFlush } from "../shared/styles";

export const selectStyles = {
  host: css({ display: "block" }),
  root: css({ pos: "relative", w: "full" }),
  control: css({ w: "full" }),
  trigger: css({
    ...fieldSurface,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "2",
    w: "full",
    h: "10",
    ps: "3",
    pe: "1.5",
    fontSize: "sm",
    color: `var(--qui-field-text-color, ${token("colors.onSurface")})`,
    cursor: "pointer",
    textAlign: "start",
    "&:focus-visible": {
      ...focusRingFlush,
      ringColor: `var(--qui-field-focus-ring-color, ${token("colors.primary")})`,
      borderColor: `var(--qui-field-focus-border-color, ${token("colors.primary")})`,
    },
    "&[data-placeholder-shown]": {
      color: `var(--qui-field-placeholder-color, ${token("colors.onSurfaceVariant")})`,
    },
    "&[data-invalid]": { borderColor: `var(--qui-field-error-color, ${token("colors.error")})` },
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
    w: "6",
    h: "6",
    color: "onSurfaceVariant",
    fontSize: "md",
    "&[data-state=open]": { transform: "rotate(180deg)" },
  }),
};
