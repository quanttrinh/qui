import { css } from "#styled-system/css";
import { token } from "#styled-system/tokens";

export const fieldStyles = {
  host: css({ display: "block" }),
  root: css({
    display: "flex",
    flexDir: "column",
    gap: "1.5",
    "&[data-disabled]": { cursor: "not-allowed" },
  }),
  label: css({
    textStyle: "sm",
    fontWeight: "medium",
    color: `var(--qui-field-label-color, ${token("colors.onSurface")})`,
    "&[data-disabled]": { opacity: 0.38 },
  }),
  helperText: css({
    fontSize: "xs",
    color: `var(--qui-field-helper-color, ${token("colors.onSurfaceVariant")})`,
  }),
  errorText: css({
    fontSize: "xs",
    color: `var(--qui-field-error-text-color, ${token("colors.error")})`,
    "&:not([data-invalid])": { display: "none" },
  }),
};
