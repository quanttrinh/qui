import { describe, expect, it } from "vitest";

import {
  AddIcon,
  CheckIcon,
  ExpandMoreIcon,
  RemoveIcon,
  UnfoldMoreIcon,
  VisibilityIcon,
  VisibilityOffIcon,
} from "./icons";

const NON_WHITESPACE = /\S/u;

const icons = {
  AddIcon,
  CheckIcon,
  ExpandMoreIcon,
  RemoveIcon,
  UnfoldMoreIcon,
  VisibilityIcon,
  VisibilityOffIcon,
};

describe("inline icons", () => {
  it("render as decorative Material Symbols Rounded SVGs", () => {
    for (const [name, createIcon] of Object.entries(icons)) {
      const node = createIcon();
      expect(node.$tag$, name).toBe("svg");
      expect(node.$attrs$, name).toMatchObject({
        viewBox: "0 -960 960 960",
        "aria-hidden": "true",
        focusable: "false",
      });

      const [path] = node.$children$;
      expect(path.$tag$, name).toBe("path");
      const attrs = path.$attrs$ as Record<string, string>;
      expect(attrs, name).toMatchObject({ fill: "currentColor" });
      expect(attrs.d, name).toEqual(expect.stringMatching(NON_WHITESPACE));
    }
  });
});
