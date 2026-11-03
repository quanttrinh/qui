import type { ComponentProps } from "react";

import "@quanttrinh/qui/types/react";

export const buttonProps: ComponentProps<"qui-button"> = {
  variant: "filled",
  size: "sm",
};

export const button = <qui-button variant="filled" size="sm" />;
