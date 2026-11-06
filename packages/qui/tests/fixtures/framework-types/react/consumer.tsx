import type { ComponentProps } from "react";

import "@quanttrinh/qui/types/react";

export const buttonProps: ComponentProps<"qui-button"> = {
  variant: "filled",
  size: "sm",
};

export const button = <qui-button variant="filled" size="sm" />;

export const checkboxProps: ComponentProps<"qui-checkbox"> = {
  oncheckedchange: (event) => {
    const checked = event.detail.checked;
    void checked;
  },
};

export const checkbox = <qui-checkbox oncheckedchange={(event) => event.detail.checked} />;
