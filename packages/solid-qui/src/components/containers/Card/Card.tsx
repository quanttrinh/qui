import { type JSX, splitProps } from "solid-js";

import { css, cx } from "../../../../styled-system/css";

type CardVariant = "elevated" | "filled" | "outlined";

interface CardProps extends JSX.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  class?: string;
  children?: JSX.Element;
}

interface CardPartProps extends JSX.HTMLAttributes<HTMLDivElement> {
  class?: string;
  children?: JSX.Element;
}

const styles = {
  root: css({
    display: "flex",
    flexDirection: "column",
    gap: "3",
    padding: "4",
    rounded: "2xl",
    transition: "box-shadow 200ms, background-color 200ms",
    "&[data-variant=elevated]": {
      backgroundColor: "surfaceContainerLow",
      boxShadow: "sm",
    },
    "&[data-variant=filled]": {
      backgroundColor: "surfaceContainerHighest",
    },
    "&[data-variant=outlined]": {
      backgroundColor: "surface",
      borderWidth: "1px",
      borderColor: "outlineVariant",
    },
  }),
  title: css({
    fontSize: "md",
    fontWeight: "medium",
    color: "onSurface",
  }),
  description: css({
    fontSize: "sm",
    color: "onSurfaceVariant",
  }),
  content: css({
    fontSize: "sm",
    color: "onSurfaceVariant",
  }),
  actions: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "2",
  }),
};

function CardRoot(props: CardProps): JSX.Element {
  const [local, rest] = splitProps(props, ["variant", "class", "children"]);

  return (
    <div
      {...rest}
      data-scope="card"
      data-part="root"
      data-variant={local.variant ?? "elevated"}
      class={cx(styles.root, local.class)}
    >
      {local.children}
    </div>
  );
}

function CardTitle(props: CardPartProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class", "children"]);

  return (
    <div {...rest} data-scope="card" data-part="title" class={cx(styles.title, local.class)}>
      {local.children}
    </div>
  );
}

function CardDescription(props: CardPartProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class", "children"]);

  return (
    <div
      {...rest}
      data-scope="card"
      data-part="description"
      class={cx(styles.description, local.class)}
    >
      {local.children}
    </div>
  );
}

function CardContent(props: CardPartProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class", "children"]);

  return (
    <div {...rest} data-scope="card" data-part="content" class={cx(styles.content, local.class)}>
      {local.children}
    </div>
  );
}

function CardActions(props: CardPartProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class", "children"]);

  return (
    <div {...rest} data-scope="card" data-part="actions" class={cx(styles.actions, local.class)}>
      {local.children}
    </div>
  );
}

const Card = Object.assign(CardRoot, {
  Title: CardTitle,
  Description: CardDescription,
  Content: CardContent,
  Actions: CardActions,
});

export { Card };
export type { CardProps, CardVariant };
