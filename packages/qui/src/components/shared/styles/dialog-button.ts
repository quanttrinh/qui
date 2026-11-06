import { type SystemStyleObject } from "../../../../styled-system/types";
import { focusRing } from "./focus-ring";

/** The shared button treatment for dialog trigger and close controls. */
export const dialogButtonBase: SystemStyleObject = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: "10",
  paddingInline: "4",
  borderWidth: "0",
  rounded: "full",
  backgroundColor: "transparent",
  color: "primary",
  font: "inherit",
  fontSize: "sm",
  fontWeight: "medium",
  cursor: "pointer",
  "&:hover": { backgroundColor: "surfaceContainerHigh" },
  "&:focus-visible": focusRing,
};
