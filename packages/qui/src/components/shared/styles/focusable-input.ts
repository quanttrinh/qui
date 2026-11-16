import { type SystemStyleObject } from "../../../../styled-system/types";

/**
 * Native input overlay used by checkable controls.
 *
 * The input must keep a full layout box so the browser can focus it during
 * native constraint validation. Opacity is safe; clipping or
 * `display: none` is not.
 *
 * Pointer events stay on the label so `:hover` and cursor styles on the
 * visual control still apply. Label activation forwards clicks to the input.
 */
export const focusableInputOverlay: SystemStyleObject = {
  pos: "absolute",
  inset: "0",
  w: "full",
  h: "full",
  // oxlint-disable-next-line @pandacss/no-margin-properties -- overlay input must fill without native margins.
  m: "0",
  p: "0",
  borderWidth: "0",
  opacity: "0",
  pointerEvents: "none",
};
