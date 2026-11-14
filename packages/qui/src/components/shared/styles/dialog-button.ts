import { token } from "#styled-system/tokens";

import { type SystemStyleObject } from "../../../../styled-system/types";
import { focusRing } from "./focus-ring";

/** The shared button treatment for dialog trigger and close controls. */
export const dialogButtonBase: SystemStyleObject = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  h: "10",
  px: "4",
  borderWidth: "0",
  rounded: "full",
  bgColor: "transparent",
  color: `var(--qui-dialog-action-color, ${token("colors.primary")})`,
  font: "inherit",
  textStyle: "sm",
  fontWeight: "medium",
  cursor: "pointer",
  "&:hover": {
    bgColor: `var(--qui-dialog-action-hover-color, ${token("colors.surfaceContainerHigh")})`,
  },
  "&:focus-visible": {
    ...focusRing,
    ringColor: `var(--qui-dialog-action-focus-ring-color, ${token("colors.primary")})`,
  },
};
