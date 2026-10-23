import { h, type VNode } from "@stencil/core";

function icon(viewBox: string, path: string): VNode {
  return h("svg", { viewBox, "aria-hidden": "true", focusable: "false" }, [
    h("path", { fill: "currentColor", d: path }),
  ]);
}

/** Material Symbols `check` path, rendered as an inline SVG. */
export function CheckIcon(): VNode {
  return icon("0 0 24 24", "M9.55 17.6 4 12.05l1.4-1.4 4.15 4.15 9.05-9.05 1.4 1.4z");
}

/** Material Symbols `remove` path, rendered as an inline SVG. */
export function RemoveIcon(): VNode {
  return icon("0 0 24 24", "M5 13h14v-2H5z");
}

/** Material Symbols `add` path, rendered as an inline SVG. */
export function AddIcon(): VNode {
  return icon("0 0 24 24", "M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z");
}

/** Material Symbols `visibility` path, rendered as an inline SVG. */
export function VisibilityIcon(): VNode {
  return icon(
    "0 0 24 24",
    "M12 6.5c4.14 0 7.66 2.6 9 5.5-1.34 2.9-4.86 5.5-9 5.5S4.34 14.9 3 12c1.34-2.9 4.86-5.5 9-5.5m0-2C6.5 4.5 2.23 8.08 1 12c1.23 3.92 5.5 7.5 11 7.5s9.77-3.58 11-7.5c-1.23-3.92-5.5-7.5-11-7.5m0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6m0-2a5 5 0 1 0 0 10 5 5 0 0 0 0-10",
  );
}

/** Material Symbols `visibility_off` path, rendered as an inline SVG. */
export function VisibilityOffIcon(): VNode {
  return icon(
    "0 -960 960 960",
    "M600-620q29 29 42.5 71.5T647-464q0 13-8.5 21.5T617-434q-13 0-21.5-8.5T587-464q11-34 2.5-64.5T559-580q-21-22-52-30t-64 3q-13 0-21.5-8.5T413-637q0-13 8.5-21.5T443-667q42-9 85 4.5t72 42.5ZM490-740q-32 0-64 3t-63 13q-12 4-24-1t-17-16q-5-11 0-22.5t16-15.5q35-11 72-16t75-5q137 0 249.5 75.5T907-526q3 6 5 12.5t2 13.5q0 7-1.5 13.5T908-474q-23 49-55 90.5T779-307q-9 8-20 5.5T741-313q-7-9-5.5-20t10.5-19q36-30 65-66.5t46-81.5q-49-109-148-174.5T490-740Zm-10 540q-136 0-247.5-76T55-472q-4-7-5.5-13.5T48-500q0-8 2-14.5t5-13.5q24-48 55.5-90.5T182-696L77-801q-9-9-8.5-21t8.5-21q9-9 21.5-9t21.5 9l716 716q8 8 8 19.5T836-87q-8 10-20.5 10T794-86L648-229q-41 15-83 22t-85 7ZM223-654q-41 29-72 68t-49 86q52 112 156.5 176T488-260q29 0 58-1.5t55-14.5l-64-64q-14 6-28.5 8t-28.5 2q-71 0-120.5-49.5T310-500q0-14 2.5-28.5T320-557l-97-97Zm305 142Zm-116 58Z",
  );
}

/** Material Symbols `expand_more` path, rendered as an inline SVG. */
export function ExpandMoreIcon(): VNode {
  return icon("0 0 24 24", "M12 15.4 5.6 9l1.4-1.4 5 5 5-5L18.4 9z");
}

/** Material Symbols `unfold_more` path, rendered as an inline SVG. */
export function UnfoldMoreIcon(): VNode {
  return icon(
    "0 0 24 24",
    "M12 5.4 15.4 8.8 14 10.2 12 8.2 10 10.2 8.6 8.8zM12 18.6 8.6 15.2 10 13.8 12 15.8 14 13.8 15.4 15.2z",
  );
}
