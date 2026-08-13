import { createSignal } from "solid-js";

interface ClickEventLike {
  preventDefault?: () => void;
  stopImmediatePropagation?: () => void;
  stopPropagation?: () => void;
}

function blockClick(e: Readonly<ClickEventLike>): void {
  e.preventDefault?.();
  e.stopImmediatePropagation?.();
  e.stopPropagation?.();
}

export interface CreateHoverMenuReturn {
  hoverOpen: () => boolean;
  open: () => void;
  close: () => void;
  cancelClose: () => void;
  toggleClick: () => void;
  blockClick: (e: Readonly<ClickEventLike>) => void;
  onOpenChange: (details: Readonly<{ open: boolean }>) => void;
}

export function createHoverMenu(timeout = 300): CreateHoverMenuReturn {
  const [hoverOpen, setHoverOpen] = createSignal(false);
  let hoverTimer: number | undefined = undefined;
  let openedByHover = false;

  const open = (): void => {
    clearTimeout(hoverTimer);
    openedByHover = true;
    setHoverOpen(true);
  };

  const close = (): void => {
    hoverTimer = setTimeout(() => {
      setHoverOpen(false);
      openedByHover = false;
    }, timeout);
  };

  const cancelClose = (): void => {
    clearTimeout(hoverTimer);
  };

  const toggleClick = (): void => {
    if (openedByHover) {
      return;
    }
    setHoverOpen((p) => !p);
  };

  const onOpenChange = (details: Readonly<{ open: boolean }>): void => {
    setHoverOpen(details.open);
    if (!details.open) {
      openedByHover = false;
    }
  };

  return {
    hoverOpen,
    open,
    close,
    cancelClose,
    toggleClick,
    blockClick,
    onOpenChange,
  };
}
