import { type SystemStyleObject } from "../../../../styled-system/types";

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
