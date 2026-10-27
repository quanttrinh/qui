import { type ReactiveController } from "../reactive-control/controller";
import { type OptionItem } from "./option";

interface OptionListNavigationControllerOptions<TItem extends OptionItem> {
  getItems: () => readonly TItem[];
  getInitialActive: () => string | undefined;
  isDisabled: () => boolean;
  isReadOnly: () => boolean;
  isLooping: () => boolean;
  onOpenChange?: (open: boolean, reason: string) => void;
  /** Called when the active item changes, with its index in `getItems()`. */
  onReveal: (index: number) => void;
  requestUpdate: () => void;
}

interface ListCommandOptions {
  event: KeyboardEvent;
}

/** Open state, active item, and keyboard navigation for a OptionList. */
export class OptionListNavigationController<
  TItem extends OptionItem,
> implements ReactiveController {
  private readonly options: OptionListNavigationControllerOptions<TItem>;
  private openState = false;
  private active?: string;
  private revealed?: string;

  constructor(options: OptionListNavigationControllerOptions<TItem>) {
    this.options = options;
  }

  public get open(): boolean {
    return this.openState;
  }

  public get activeValue(): string | undefined {
    return this.active;
  }

  public setActive(value: string | undefined): void {
    if (this.active === value) {
      return;
    }
    this.active = value;
    this.options.requestUpdate();
  }

  public openMenu(reason: string): void {
    if (this.openState || this.options.isDisabled() || this.options.isReadOnly()) {
      return;
    }
    this.openState = true;
    this.options.onOpenChange?.(true, reason);
    this.active = this.options.getInitialActive();
    this.options.requestUpdate();
  }

  public closeMenu(reason: string): void {
    if (!this.openState) {
      return;
    }
    this.openState = false;
    this.active = undefined;
    this.revealed = undefined;
    this.options.onOpenChange?.(false, reason);
    this.options.requestUpdate();
  }

  public toggleMenu(reason: string): void {
    if (this.openState) {
      this.closeMenu(reason);
      return;
    }
    this.openMenu(reason);
  }

  public move(delta: 1 | -1): void {
    const enabled = this.options.getItems().filter((item) => !item.disabled);
    if (enabled.length === 0) {
      this.setActive(undefined);
      return;
    }
    const current = enabled.findIndex((item) => item.value === this.active);
    let index = current + delta;
    if (current === -1) {
      index = delta > 0 ? 0 : enabled.length - 1;
    }
    if (index < 0 || index >= enabled.length) {
      if (!this.options.isLooping()) {
        return;
      }
      index = (index + enabled.length) % enabled.length;
    }
    this.setActive(enabled[index]?.value);
  }

  public edge(edge: "first" | "last"): void {
    const enabled = this.options.getItems().filter((item) => !item.disabled);
    const item = edge === "first" ? enabled[0] : enabled.at(-1);
    this.setActive(item?.value);
  }

  public findByPrefix(prefix: string): TItem | undefined {
    return this.options
      .getItems()
      .find((item) => !item.disabled && item.label.toLowerCase().startsWith(prefix));
  }

  /** Handles the navigation keys shared by select and combobox. */
  public handleNavigationKey({ event }: ListCommandOptions): boolean {
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

  public hostDidRender(): void {
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
