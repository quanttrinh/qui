import { css } from "#styled-system/css";

/** Shared marker styling for required form controls. */
export const requiredIndicatorStyle = css({
  color: "error",
  marginInlineStart: "0.5",
  "&:not([data-required])": { display: "none" },
});
