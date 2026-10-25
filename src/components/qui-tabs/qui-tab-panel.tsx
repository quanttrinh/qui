import { resolveVar, Component, Element, h, Host, Prop, State, type VNode } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css, cx } from "#styled-system/css";

import { dataAttr } from "../../helpers/attr";
import { consumeContextPart } from "../shared/context-part";
import { consumeTabs, type TabsContext } from "./context";

const styles = {
  host: css({ display: "block", flex: "1" }),
  panel: css({
    flex: "1",
    paddingY: "3",
    outlineStyle: "none",
    fontSize: "sm",
    color: "onSurfaceVariant",
    // Defers layout/paint of off-screen panels. Inactive panels are also hidden,
    // So this mainly helps long, active panels below the fold.
    contentVisibility: "auto",
    containIntrinsicSize: "auto 100px",
    "&[data-orientation=vertical]": { paddingY: "0", paddingInlineStart: "4" },
    "&:focus-visible": {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary",
      outlineOffset: "2px",
    },
  }),
};

/**
 * A tab panel. Must be inside `qui-tabs`.
 *
 * @slot - Panel content.
 */
@Component({
  tag: "qui-tab-panel",
  styleUrl: resolveVar(styleUrls.quiTabPanel),
  scoped: true,
})
export class QuiTabPanel {
  @Element() host!: HTMLQuiTabPanelElement;

  /** The value linking this panel to its trigger. */
  @Prop() value!: string;
  /** Additional class applied to the panel. */
  @Prop() innerClass?: string;

  @State() private tabbable = true;

  private readonly contextPart = consumeContextPart({
    host: (): HTMLElement => this.host,
    key: "tabs",
    consume: consumeTabs,
  });

  private get tabs(): TabsContext | undefined {
    return this.contextPart.context;
  }

  public connectedCallback(): void {
    this.contextPart.hostConnected();
  }

  public componentWillLoad(): void {
    this.contextPart.hostWillLoad();
  }

  public componentDidLoad(): void {
    this.contextPart.hostDidLoad();
  }

  public componentDidRender(): void {
    this.syncTabIndex(this.tabs?.isSelected(this.value) ?? false);
  }

  public disconnectedCallback(): void {
    this.contextPart.hostDisconnected();
  }

  private syncTabIndex(selected: boolean): void {
    if (!selected) {
      return;
    }
    const focusable = [
      ...this.host.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ].some((element) => element.getAttribute("part") !== "panel");
    const tabbable = !focusable;
    if (this.tabbable !== tabbable) {
      this.tabbable = tabbable;
    }
  }

  public render(): VNode {
    const selected = this.tabs?.isSelected(this.value) ?? false;
    const orientation = this.tabs?.orientation() ?? "horizontal";
    const textDirection = this.tabs?.textDirection() ?? "ltr";

    return (
      <Host class={styles.host}>
        <div
          id={this.tabs?.panelId(this.value)}
          role="tabpanel"
          aria-labelledby={this.tabs?.triggerId(this.value)}
          tabIndex={this.tabbable ? 0 : undefined}
          hidden={!selected}
          data-scope="tabs"
          data-part="content"
          data-selected={dataAttr(selected)}
          data-orientation={orientation}
          data-ownedby={this.tabs?.listId()}
          dir={textDirection}
          class={cx(styles.panel, this.innerClass)}
          part="panel"
        >
          <slot />
        </div>
      </Host>
    );
  }
}
