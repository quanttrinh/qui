import { type JSX, splitProps } from "solid-js";
import { Dynamic } from "solid-js/web";

import { css, cx } from "../../../../styled-system/css";

/** MD3 button styles. */
type ButtonVariant = "filled" | "tonal" | "elevated" | "outlined" | "text";

/** MD3 button sizes. */
type ButtonSize = "sm" | "md" | "lg";

interface ButtonBaseProps {
  /** The visual style. Defaults to `"filled"`. */
  variant?: ButtonVariant;
  /** The control size. Defaults to `"md"`. */
  size?: ButtonSize;
  /** Renders a square button sized for a single icon. */
  iconOnly?: boolean;
  disabled?: boolean;
  /** When provided, renders an anchor (`<a>`) instead of a `<button>`. */
  href?: string;
  /** The button type. Not applied when `href` is set. */
  type?: JSX.ButtonHTMLAttributes<HTMLButtonElement>["type"];
  class?: string;
  children?: JSX.Element;
}

type ButtonButtonProps = Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps> &
  ButtonBaseProps;

type ButtonAnchorProps = Omit<JSX.AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonBaseProps> &
  ButtonBaseProps & {
    /** Anchor relationship. */
    rel?: string;
    /** Anchor download hint. */
    download?: string;
  };

type ButtonProps = ButtonButtonProps | ButtonAnchorProps;

type DynamicButtonProps = ButtonButtonProps &
  ButtonAnchorProps & {
    "data-scope": "button";
    "data-part": "root";
    "data-variant": ButtonVariant;
    "data-size": ButtonSize;
    "data-icon-only"?: "";
  };

const styles = {
  root: css({
    position: "relative",
    isolation: "isolate",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    rounded: "full",
    borderWidth: "0",
    fontFamily: "inherit",
    fontWeight: "medium",
    whiteSpace: "nowrap",
    cursor: "pointer",
    userSelect: "none",
    overflow: "hidden",
    textDecoration: "none",
    transition: "box-shadow 200ms, background-color 200ms, color 200ms",
    // MD3 state layer: current colour at low opacity, between fill and content.
    "&::before": {
      content: '""',
      position: "absolute",
      inset: "0",
      zIndex: "-1",
      backgroundColor: "currentColor",
      opacity: 0,
      pointerEvents: "none",
      transition: "opacity 150ms",
    },
    "&:hover:not(:disabled):not([aria-disabled=true])::before": { opacity: 0.08 },
    "&:active:not(:disabled):not([aria-disabled=true])::before": { opacity: 0.12 },
    "& svg": { boxSize: "1.25em" },
    _focusVisible: {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary",
      outlineOffset: "2px",
    },
    "&:disabled, &[aria-disabled=true]": { opacity: 0.38, cursor: "not-allowed" },

    "&[data-size=sm]": { height: "8", paddingInline: "3", gap: "1.5", fontSize: "sm" },
    "&[data-size=md]": { height: "10", paddingInline: "6", gap: "2", fontSize: "sm" },
    "&[data-size=lg]": { height: "12", paddingInline: "8", gap: "2.5", fontSize: "md" },

    "&[data-variant=filled]": {
      backgroundColor: "primary",
      color: "onPrimary",
      boxShadow: "sm",
    },
    "&[data-variant=filled]:hover:not(:disabled):not([aria-disabled=true])": { boxShadow: "md" },
    "&[data-variant=tonal]": {
      backgroundColor: "secondaryContainer",
      color: "onSecondaryContainer",
    },
    "&[data-variant=elevated]": {
      backgroundColor: "surfaceContainerLow",
      color: "primary",
      boxShadow: "sm",
    },
    "&[data-variant=elevated]:hover:not(:disabled):not([aria-disabled=true])": { boxShadow: "md" },
    "&[data-variant=outlined]": {
      color: "primary",
      borderWidth: "1px",
      borderColor: "outline",
    },
    "&[data-variant=text]": { color: "primary" },

    "&[data-icon-only] svg": { boxSize: "1.5em" },
    "&[data-icon-only][data-size=sm]": { width: "8", paddingInline: "0" },
    "&[data-icon-only][data-size=md]": { width: "10", paddingInline: "0" },
    "&[data-icon-only][data-size=lg]": { width: "12", paddingInline: "0" },
  }),
};

function Button(props: ButtonProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "variant",
    "size",
    "iconOnly",
    "type",
    "href",
    "disabled",
    "class",
    "children",
  ]);

  const isAnchor = (): boolean => Boolean(local.href);

  const dynamicProps = (): DynamicButtonProps => {
    const baseProps = {
      "data-scope": "button",
      "data-part": "root",
      "data-variant": local.variant ?? "filled",
      "data-size": local.size ?? "md",
      "data-icon-only": local.iconOnly ? "" : undefined,
    } as const;
    if (isAnchor()) {
      return {
        ...baseProps,
        href: local.disabled ? undefined : local.href,
        tabIndex: local.disabled ? -1 : rest.tabIndex,
        "aria-disabled": local.disabled ? ("true" as const) : undefined,
      };
    }
    return {
      ...baseProps,
      type: local.type ?? "button",
      disabled: local.disabled,
    };
  };

  return (
    <Dynamic
      component={isAnchor() ? "a" : "button"}
      {...rest}
      {...dynamicProps()}
      class={cx(styles.root, local.class)}
    >
      {local.children}
    </Dynamic>
  );
}

export { Button };
export type { ButtonProps, ButtonButtonProps, ButtonAnchorProps, ButtonSize, ButtonVariant };
