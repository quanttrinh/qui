import { createSignal } from "solid-js";

export function createHoverMenu(timeout: number = 300) {
  const [hoverOpen, setHoverOpen] = createSignal(false);
  let hoverTimer: number | undefined;
  let openedByHover = false;

  const open = () => {
    clearTimeout(hoverTimer);
    openedByHover = true;
    setHoverOpen(true);
  };

  const close = () => {
    hoverTimer = setTimeout(() => {
      setHoverOpen(false);
      openedByHover = false;
    }, timeout);
  };

  const cancelClose = () => {
    clearTimeout(hoverTimer);
  };

  const toggleClick = () => {
    if (openedByHover) return;
    setHoverOpen((p) => !p);
  };

  const blockClick = (e: {
    preventDefault?: () => void;
    stopImmediatePropagation?: () => void;
    stopPropagation?: () => void;
  }) => {
    e.preventDefault?.();
    e.stopImmediatePropagation?.();
    e.stopPropagation?.();
  };

  const onOpenChange = ({ open }: { open: boolean }) => {
    console.log("onOpenChange", open);
    setHoverOpen(open);
    if (!open) openedByHover = false;
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
