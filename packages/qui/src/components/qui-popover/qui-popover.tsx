import {
  Build,
  Component,
  Element,
  Event,
  h,
  Host,
  Method,
  Prop,
  resolveVar,
  Watch,
  type EventEmitter,
  type VNode,
} from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css } from "#styled-system/css";

import { isHTMLElement } from "../../helpers/dom";
import { ensureShadowStylesheet } from "../../utilities/styles";

/** Emitted when the popover asks its owner to close it. */
export interface PopoverDismissEvent {
  reason: "outside" | "escape";
}

const layout = {
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  position: "fixed",
  inset: "auto",
  margin: "0",
  padding: "0",
  "&[hidden]": { display: "none" },
} as const;

const styles = {
  host: css({ display: "contents" }),
  surface: css({
    ...layout,
    padding: "3",
    overflowY: "auto",
    backgroundColor: "surface",
    borderWidth: "1px",
    borderColor: "outlineVariant",
    rounded: "xl",
    boxShadow: "md",
  }),
  bare: css({
    ...layout,
    overflow: "visible",
    backgroundColor: "transparent",
    borderWidth: "0",
  }),
};

/** Preferred side and alignment of a popover relative to its anchor. */
export type PopoverPlacement = "bottom-start" | "bottom-end" | "top-start" | "top-end";

export interface ViewportSize {
  width: number;
  height: number;
}

export interface PopoverSize {
  width: number;
  height: number;
}

export interface PlacementOptions {
  placement: PopoverPlacement;
  offset: number;
  padding: number;
  flip: boolean;
}

export interface PopoverPlacementOptions extends PlacementOptions {
  size: PopoverSize;
  viewport: ViewportSize;
}

export interface PanelPlacement {
  left: number;
  top: number;
  maxHeight: number;
  side: "top" | "bottom";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Places a panel next to its anchor. The preferred side comes from
 * `placement`, `flip` switches sides when the preferred one is too small, and
 * the result is clamped to the viewport.
 */
function placePopover(
  anchor: DOMRect,
  { size, viewport, placement, offset, padding, flip }: PopoverPlacementOptions,
): PanelPlacement {
  const preferred: "top" | "bottom" = placement.startsWith("top") ? "top" : "bottom";
  const below = viewport.height - anchor.bottom - offset - padding;
  const above = anchor.top - offset - padding;
  let side = preferred;
  if (flip) {
    if (side === "bottom" && size.height > below && above > below) {
      side = "top";
    } else if (side === "top" && size.height > above && below > above) {
      side = "bottom";
    }
  }
  const available = side === "top" ? above : below;
  const maxHeight = Math.max(0, available);
  const height = Math.min(size.height, maxHeight);
  const top = side === "top" ? anchor.top - offset - height : anchor.bottom + offset;
  const left = placement.endsWith("end") ? anchor.right - size.width : anchor.left;
  return {
    left: Math.round(clamp(left, padding, viewport.width - size.width - padding)),
    top: Math.max(padding, Math.round(top)),
    maxHeight,
    side,
  };
}

/**
 * Renders its children in the top layer with the native popover API and
 * positions them next to an anchor with JavaScript, so it does not depend on
 * CSS anchor positioning.
 *
 * The popover is controlled: it emits `dismiss` when the user clicks outside
 * or presses Escape, and the owner closes it by setting `open` to `false`.
 *
 * @slot - The popover content.
 */
@Component({
  tag: "qui-popover",
  styleUrl: resolveVar(styleUrls.quiPopover),
  shadow: true,
})
export class QuiPopover {
  @Element() host!: HTMLElement;

  /** Whether the popover is visible. */
  @Prop() open = false;
  /**
   * The anchor element. Property-only. Defaults to the previous element
   * sibling, so `<button>…</button><qui-popover>…</qui-popover>` just works.
   */
  @Prop() anchor?: HTMLElement | (() => HTMLElement | undefined);
  /** Preferred side and alignment relative to the anchor. */
  @Prop() placement: PopoverPlacement = "bottom-start";
  /** Whether the popover flips sides when space runs out. Defaults to `true`. */
  @Prop() flip?: boolean;
  /** Whether the popover matches the anchor width. */
  @Prop() sameWidth = false;
  /** Gap in pixels between the anchor and the popover. */
  @Prop() offset = 4;
  /** Minimum distance in pixels kept from the viewport edges. */
  @Prop() padding = 8;
  /** Maximum height of the panel. Defaults to the available viewport space. */
  @Prop() maxHeight?: number;
  /** Removes the default surface, border, and shadow. */
  @Prop() bare = false;
  /** Whether an outside press asks the owner to close. Defaults to `true`. */
  @Prop() closeOnOutsideClick?: boolean;
  /** Whether Escape asks the owner to close. Defaults to `true`. */
  @Prop() closeOnEscape?: boolean;

  /** Emitted when the popover asks its owner to close it. */
  @Event({ eventName: "dismiss", bubbles: true, composed: true })
  dismiss!: EventEmitter<PopoverDismissEvent>;

  private panelEl?: HTMLDivElement;
  private visible = false;
  private frame?: number;
  private sizeObserver?: ResizeObserver;

  public connectedCallback(): void {
    ensureShadowStylesheet(this.host);
  }

  public componentDidRender(): void {
    this.sync();
  }

  @Watch("anchor")
  @Watch("placement")
  @Watch("flip")
  @Watch("sameWidth")
  @Watch("offset")
  @Watch("padding")
  @Watch("maxHeight")
  private repositionOnChange(): void {
    if (this.open) {
      this.schedule();
    }
  }

  public disconnectedCallback(): void {
    this.destroy();
  }

  /** Repositions the open popover, e.g. after its content changed. */
  @Method()
  public async reposition(): Promise<void> {
    await Promise.resolve();
    this.position();
  }

  private sync(): void {
    if (Build.isServer) {
      return;
    }
    const panel = this.panelEl;
    if (panel === undefined || !panel.isConnected) {
      return;
    }
    if (this.open) {
      if (!this.visible) {
        this.show(panel);
        this.listen(panel);
        this.position();
      }
      return;
    }
    if (this.visible) {
      this.hide(panel);
      this.unlisten();
    }
  }

  private position(): void {
    const anchor = this.resolveAnchor();
    const panel = this.panelEl;
    if (anchor === undefined || panel === undefined || !this.visible) {
      return;
    }
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const anchorRect = anchor.getBoundingClientRect();
    const maxWidth = Math.max(0, viewport.width - this.padding * 2);
    // CSSOM writes are CSP-safe; width must be applied before measuring.
    panel.style.width = this.sameWidth ? `${Math.min(anchorRect.width, maxWidth)}px` : "";
    panel.style.maxWidth = `${maxWidth}px`;
    const measured = panel.getBoundingClientRect();
    const limit = this.maxHeight ?? Number.POSITIVE_INFINITY;
    const naturalHeight = Math.min(Math.max(panel.scrollHeight, measured.height), limit);
    const placement = placePopover(anchorRect, {
      size: { width: measured.width, height: naturalHeight },
      viewport,
      placement: this.placement,
      offset: this.offset,
      padding: this.padding,
      flip: this.flip !== false,
    });
    const height = Math.min(placement.maxHeight, limit);
    panel.style.top = `${placement.top}px`;
    panel.style.left = `${placement.left}px`;
    panel.style.maxHeight = `${height}px`;
    panel.style.setProperty("--popover-anchor-width", `${anchorRect.width}px`);
    panel.style.setProperty("--popover-available-height", `${height}px`);
  }

  private resolveAnchor(): HTMLElement | undefined {
    if (typeof this.anchor === "function") {
      return this.anchor();
    }
    if (this.anchor !== undefined) {
      return this.anchor;
    }
    const sibling = this.host.previousElementSibling;
    return isHTMLElement(sibling) ? sibling : undefined;
  }

  private show(panel: HTMLDivElement): void {
    if (typeof panel.showPopover === "function") {
      try {
        panel.showPopover();
      } catch {
        // Fall back to the fixed-position panel already in the DOM.
      }
    }
    this.visible = true;
  }

  private hide(panel: HTMLDivElement): void {
    if (typeof panel.hidePopover === "function") {
      try {
        panel.hidePopover();
      } catch {
        // Hiding is best-effort.
      }
    }
    this.visible = false;
  }

  private listen(panel: HTMLDivElement): void {
    const doc = this.host.ownerDocument;
    doc.addEventListener("pointerdown", this.handlePointerDown, true);
    doc.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("scroll", this.handleScroll, true);
    window.addEventListener("resize", this.handleChange);
    if (typeof ResizeObserver === "function") {
      this.sizeObserver = new ResizeObserver(() => {
        this.schedule();
      });
      this.sizeObserver.observe(panel);
    }
  }

  private unlisten(): void {
    const doc = this.host.ownerDocument;
    doc.removeEventListener("pointerdown", this.handlePointerDown, true);
    doc.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("scroll", this.handleScroll, true);
    window.removeEventListener("resize", this.handleChange);
    this.sizeObserver?.disconnect();
    this.sizeObserver = undefined;
  }

  private destroy(): void {
    if (Build.isServer) {
      return;
    }
    this.unlisten();
    if (this.frame !== undefined) {
      cancelAnimationFrame(this.frame);
      this.frame = undefined;
    }
    this.visible = false;
  }

  private schedule(): void {
    if (this.frame !== undefined) {
      return;
    }
    this.frame = requestAnimationFrame(() => {
      this.frame = undefined;
      this.position();
    });
  }

  private readonly handleChange = (): void => {
    this.schedule();
  };

  private readonly handleScroll = (event: Event): void => {
    // Ignore scrolls inside the popover (its own scroll containers).
    if (event.composedPath().includes(this.host)) {
      return;
    }
    this.schedule();
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (this.closeOnOutsideClick === false) {
      return;
    }
    const path = event.composedPath();
    if (path.includes(this.host) || path.includes(this.resolveAnchor() ?? this.host)) {
      return;
    }
    this.dismiss.emit({ reason: "outside" });
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (this.closeOnEscape === false || event.key !== "Escape") {
      return;
    }
    this.dismiss.emit({ reason: "escape" });
  };

  public render(): VNode {
    return (
      <Host>
        <div
          ref={(el) => {
            this.panelEl = el;
          }}
          popover="manual"
          hidden={!this.open}
          class={this.bare ? styles.bare : styles.surface}
          part="content"
        >
          <slot />
        </div>
      </Host>
    );
  }
}
