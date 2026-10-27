/**
 * Resolve the navigation delta for an arrow key in a composite widget.
 *
 * Vertical widgets respond to up/down; horizontal widgets respond to
 * left/right. When `rtl` is true, left/right are mirrored.
 */
export function arrowDelta(
  key: string,
  orientation: "horizontal" | "vertical",
  rtl: boolean,
): 1 | -1 | undefined {
  switch (key) {
    case "ArrowDown": {
      return orientation === "vertical" ? 1 : undefined;
    }
    case "ArrowUp": {
      return orientation === "vertical" ? -1 : undefined;
    }
    case "ArrowLeft": {
      if (orientation !== "horizontal") {
        return undefined;
      }
      return rtl ? 1 : -1;
    }
    case "ArrowRight": {
      if (orientation !== "horizontal") {
        return undefined;
      }
      return rtl ? -1 : 1;
    }
    default: {
      return undefined;
    }
  }
}

/**
 * Resolve the edge a key should jump to in a composite widget.
 */
export function edgeKey(key: string): "first" | "last" | undefined {
  if (key === "Home") {
    return "first";
  }
  if (key === "End") {
    return "last";
  }
  return undefined;
}
