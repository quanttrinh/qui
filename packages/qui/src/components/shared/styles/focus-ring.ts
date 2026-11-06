import { type SystemStyleObject } from "../../../../styled-system/types";

/** The common 2px primary focus ring. */
export const focusRing: SystemStyleObject = {
  ringWidth: "0.5",
  outlineStyle: "solid",
  ringColor: "primary",
  ringOffset: "0.5",
};

/** The focus ring when the outline should sit flush with the edge. */
export const focusRingFlush: SystemStyleObject = {
  ringWidth: "0.5",
  outlineStyle: "solid",
  ringColor: "primary",
  ringOffset: "0",
};

/** The focus ring when the outline should sit inside the edge. */
export const focusRingInset: SystemStyleObject = {
  ringWidth: "0.5",
  outlineStyle: "solid",
  ringColor: "primary",
  ringOffset: "-0.5",
};
