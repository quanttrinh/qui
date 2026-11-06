import { type OptionItem } from "../../../helpers/option/option";
import { ReactiveControllerBase, type ReactiveControllerHost } from "../../reactive-controller";
import { moveIndex } from "../../roving-focus";

interface OptionListNavigationControllerOptions<TItem extends OptionItem> {
  getItems: () => readonly TItem[];
  getInitialActive: () => string | undefined;
  /** The controlled open state. */
  getOpen?: () => boolean | undefined;
  /** The initial open state for an uncontrolled list. */
  getDefaultOpen?: () => boolean;
  isDisabled: () => boolean;
  isReadOnly: () => boolean;
  isLooping: () => boolean;
  onOpenChange?: (open: boolean, reason: string) => void;
  /** Called when the active item changes, with its index in `getItems()`. */
  onReveal: (index: number) => void;
}

interface ListCommandOptions {
  event: KeyboardEvent;
}

/** Open state, active item, and keyboard navigation for a OptionList. */
export class OptionListNavigationController<
  TItem extends OptionItem,
> extends ReactiveControllerBase {
  private readonly options: OptionListNavigationControllerOptions<TItem>;
  private openState = false;
  private active?: string;
  private revealed?: string;

  constructor(host: ReactiveControllerHost, options: OptionListNavigationControllerOptions<TItem>) {
    super(host);
    this.options = options;
  }

  get open(): boolean {
    return this.openState;
  }

  get activeValue(): string | undefined {
    return this.active;
  }

  hostWillLoad(): void {
    const open = this.options.getOpen?.() ?? this.options.getDefaultOpen?.() ?? false;
    if (!open || this.options.isDisabled() || this.options.isReadOnly()) {
      return;
    }
    this.openState = true;
    this.options.onOpenChange?.(true, "initial");
    this.active = this.options.getInitialActive();
    this.requestUpdate();
  }

  setActive(value: string | undefined): void {
    if (this.active === value) {
      return;
    }
    this.active = value;
    this.requestUpdate();
  }

  openMenu(reason: string): void {
    if (this.openState || this.options.isDisabled() || this.options.isReadOnly()) {
      return;
    }
    this.openState = true;
    this.options.onOpenChange?.(true, reason);
    this.active = this.options.getInitialActive();
    this.requestUpdate();
  }

  closeMenu(reason: string): void {
    if (!this.openState) {
      return;
    }
    this.openState = false;
    this.active = undefined;
    this.revealed = undefined;
    this.options.onOpenChange?.(false, reason);
    this.requestUpdate();
  }

  toggleMenu(reason: string): void {
    if (this.openState) {
      this.closeMenu(reason);
      return;
    }
    this.openMenu(reason);
  }

  move(delta: 1 | -1): void {
    const enabled = this.options.getItems().filter((item) => !item.disabled);
    if (enabled.length === 0) {
      this.setActive(undefined);
      return;
    }
    const current = enabled.findIndex((item) => item.value === this.active);
    const index = moveIndex(enabled, current, {
      delta,
      loop: this.options.isLooping(),
    });
    if (index === undefined) {
      return;
    }
    this.setActive(enabled[index]?.value);
  }

  edge(edge: "first" | "last"): void {
    const enabled = this.options.getItems().filter((item) => !item.disabled);
    const item = edge === "first" ? enabled[0] : enabled.at(-1);
    this.setActive(item?.value);
  }

  findByPrefix(prefix: string): TItem | undefined {
    return this.options
      .getItems()
      .find((item) => !item.disabled && item.label.toLowerCase().startsWith(prefix));
  }

  /** Handles the navigation keys shared by select and combobox. */
  handleNavigationKey({ event }: ListCommandOptions): boolean {
    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        if (this.openState) {
          this.move(1);
        } else {
          this.openMenu("keyboard");
        }
        return true;
      }
      case "ArrowUp": {
        event.preventDefault();
        if (this.openState) {
          this.move(-1);
        } else {
          this.openMenu("keyboard");
        }
        return true;
      }
      case "Home": {
        if (this.openState) {
          event.preventDefault();
          this.edge("first");
        }
        return true;
      }
      case "End": {
        if (this.openState) {
          event.preventDefault();
          this.edge("last");
        }
        return true;
      }
      default: {
        return false;
      }
    }
  }

  hostDidRender(): void {
    if (
      this.active !== undefined &&
      !this.options.getItems().some((item) => item.value === this.active)
    ) {
      this.active = undefined;
      this.revealed = undefined;
      this.requestUpdate();
      return;
    }
    if (!this.openState || this.active === this.revealed) {
      return;
    }
    this.revealed = this.active;
    if (this.active === undefined) {
      return;
    }
    const index = this.options.getItems().findIndex((item) => item.value === this.active);
    this.options.onReveal(index);
  }
}
