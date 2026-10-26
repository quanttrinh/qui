import { type SystemStyleObject } from "../../../styled-system/types";

export { requiredIndicatorStyle } from "./required-indicator";

/** The common 2px primary focus ring. */
export const focusRing: SystemStyleObject = {
  outlineWidth: "2px",
  outlineStyle: "solid",
  outlineColor: "primary",
  outlineOffset: "2px",
};

/** The focus ring when the outline should sit flush with the edge. */
export const focusRingFlush: SystemStyleObject = {
  outlineWidth: "2px",
  outlineStyle: "solid",
  outlineColor: "primary",
  outlineOffset: "0",
};

/** The focus ring when the outline should sit inside the edge. */
export const focusRingInset: SystemStyleObject = {
  outlineWidth: "2px",
  outlineStyle: "solid",
  outlineColor: "primary",
  outlineOffset: "-2px",
};

/** The bordered surface shared by text fields and field-like triggers. */
export const fieldSurface: SystemStyleObject = {
  backgroundColor: "surface",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "outlineVariant",
  rounded: "lg",
  overflow: "hidden",
  transition: "border-color 150ms, outline-color 150ms",
  "&:hover": { borderColor: "outline" },
};

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
