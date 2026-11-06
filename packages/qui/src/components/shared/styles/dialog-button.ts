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
  color: "primary",
  font: "inherit",
  textStyle: "sm",
  fontWeight: "medium",
  cursor: "pointer",
  "&:hover": { bgColor: "surfaceContainerHigh" },
  "&:focus-visible": focusRing,
};
