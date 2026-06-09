import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const fontSizes = [
  "md3-display-lg",
  "md3-display-md",
  "md3-display-sm",
  "md3-headline-lg",
  "md3-headline-md",
  "md3-headline-sm",
  "md3-title-lg",
  "md3-title-md",
  "md3-title-sm",
  "md3-label-lg",
  "md3-label-md",
  "md3-label-sm",
  "md3-body-lg",
  "md3-body-md",
  "md3-body-sm",
];

const shadows = ["md3-elevation-1", "md3-elevation-2", "md3-elevation-3"];

const radii = ["md3-xs", "md3-sm", "md3-md", "md3-lg", "md3-xl", "md3-full"];

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      radius: radii,
      shadow: shadows,
      text: fontSizes,
    },
  },
});

// eslint-disable-next-line typescript/prefer-readonly-parameter-types
export function cn(...inputs: readonly Readonly<ClassValue>[]): string {
  return twMerge(clsx(...inputs));
}
