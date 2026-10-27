import { css } from "#styled-system/css";

export const fieldStyles = {
  host: css({ display: "block" }),
  root: css({
    display: "flex",
    flexDirection: "column",
    gap: "1.5",
    "&[data-disabled]": { cursor: "not-allowed" },
  }),
  label: css({
    fontSize: "sm",
    fontWeight: "medium",
    color: "onSurface",
    "&[data-disabled]": { opacity: 0.38 },
  }),
  helperText: css({
    fontSize: "xs",
    color: "onSurfaceVariant",
  }),
  errorText: css({
    fontSize: "xs",
    color: "error",
    "&:not([data-invalid])": { display: "none" },
  }),
};
