import { type SystemStyleObject } from "../../../../styled-system/types";

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
