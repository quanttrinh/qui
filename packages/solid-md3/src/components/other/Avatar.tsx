import { Avatar as ArkAvatar } from "@ark-ui/solid/avatar";
import { type VariantProps, cva } from "class-variance-authority";
import { type JSX, Show, createMemo, splitProps } from "solid-js";

import { cn } from "../../cn";

const avatarSize = cva("rounded-full overflow-hidden", {
  defaultVariants: {
    size: "md",
  },
  variants: {
    size: {
      lg: "h-12 w-12 text-base",
      md: "h-10 w-10 text-sm",
      sm: "h-8 w-8 text-xs",
    },
  },
});

interface AvatarProps extends VariantProps<typeof avatarSize> {
  src?: string;
  name?: string;
  class?: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/u);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  const last = parts.at(-1);
  return (parts[0].charAt(0) + (last ?? "?").charAt(0)).toUpperCase();
}

export function Avatar(props: Readonly<AvatarProps>): JSX.Element {
  const [local, rest] = splitProps(props, ["src", "name", "size", "class"]);

  const initials = createMemo(() => getInitials(local.name ?? "?"));

  return (
    <ArkAvatar.Root
      class={cn(
        avatarSize({ size: local.size }),
        "inline-flex items-center justify-center bg-md3-primary-container font-medium text-md3-on-primary-container",
        local.class,
      )}
      {...rest}
    >
      <Show when={local.src} fallback={<ArkAvatar.Fallback>{initials()}</ArkAvatar.Fallback>}>
        <ArkAvatar.Image
          src={local.src}
          alt={local.name ?? "Avatar"}
          class="h-full w-full object-cover"
        />
      </Show>
    </ArkAvatar.Root>
  );
}

export type { AvatarProps };
