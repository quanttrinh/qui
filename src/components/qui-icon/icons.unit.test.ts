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
      expect(path.$attrs$, name).toMatchObject({ fill: "currentColor" });
      expect(path.$attrs$.d, name).toEqual(expect.stringMatching(/\S/u));
    }
  });
});
