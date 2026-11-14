import { token } from "#styled-system/tokens";

import { type SystemStyleObject } from "../../../../styled-system/types";

/** The bordered surface shared by text fields and field-like triggers. */
export const fieldSurface: SystemStyleObject = {
  bgColor: `var(--qui-field-container-color, ${token("colors.surface")})`,
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: `var(--qui-field-outline-color, ${token("colors.outlineVariant")})`,
  rounded: "lg",
  overflow: "hidden",
  transition: "border-color 150ms, outline-color 150ms",
  "&:hover": {
    borderColor: `var(--qui-field-outline-hover-color, ${token("colors.outline")})`,
  },
};
