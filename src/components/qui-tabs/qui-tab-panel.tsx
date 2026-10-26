import { resolveVar, Component, Element, h, Host, Prop, State, type VNode } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css } from "#styled-system/css";

import { dataAttr } from "../../helpers/attr";
import { hasFocusableDescendant } from "../../helpers/dom";
import { setAriaControls, setAriaLabelledBy } from "../shared/aria";
import { consumeContextPart } from "../shared/context-part";
import { ContextPartElement } from "../shared/context-part-element";
import { RegistrationReconciler } from "../shared/registration-reconciler";
import { focusRing } from "../shared/styles";
import { consumeTabs, type TabsContext } from "./context";

const styles = {
  host: css({ display: "contents" }),
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
    "&:focus-visible": focusRing,
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
  shadow: true,
})
export class QuiTabPanel extends ContextPartElement<TabsContext> {
  @Element() host!: HTMLQuiTabPanelElement;

  /** The value linking this panel to its trigger. */
  @Prop() value!: string;

  @State() private tabbable = false;

  private panelEl?: HTMLDivElement;
  private tabIndexQueued = false;
  private contentObserver?: MutationObserver;
  private readonly registration = new RegistrationReconciler();

  protected readonly contextPart = consumeContextPart({
    host: (): HTMLElement => this.host,
    key: "tabs",
    consume: consumeTabs,
  });

  private get tabs(): TabsContext | undefined {
    return this.contextPart.context;
  }

  public connectedCallback(): void {
    super.connectedCallback();
    if (typeof MutationObserver !== "undefined") {
      this.contentObserver = new MutationObserver(() => {
        this.scheduleTabIndex();
      });
      this.contentObserver.observe(this.host, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ["disabled", "hidden", "tabindex"],
      });
    }
  }

  public componentDidRender(): void {
    this.syncRegistration();
    this.syncAria();
    this.scheduleTabIndex();
  }

  public disconnectedCallback(): void {
    this.contentObserver?.disconnect();
    this.contentObserver = undefined;
    this.registration.clear();
    super.disconnectedCallback();
  }

  private syncRegistration(): void {
    const { tabs } = this;
    if (tabs === undefined) {
      return;
    }
    this.registration.reconcile([tabs, this.value], () =>
      tabs.registerPanel(this.value, this.host),
    );
  }

  private syncAria(): void {
    const { tabs, panelEl } = this;
    if (tabs === undefined || panelEl === undefined) {
      return;
    }
    const trigger = tabs.getTrigger(this.value);
    setAriaLabelledBy(panelEl, trigger === undefined ? [] : [trigger.host]);
    if (trigger !== undefined) {
      // Set the reverse relationship so a late trigger registration is reflected too.
      setAriaControls(trigger.trigger, [this.host]);
    }
  }

  private scheduleTabIndex(): void {
    if (this.tabIndexQueued) {
      return;
    }
    this.tabIndexQueued = true;
    const sync = (): void => {
      if (!this.host.isConnected) {
        return;
      }
      this.syncTabIndex(this.tabs?.isSelected(this.value) ?? false);
    };
    // Read slotted content after the current render commits, then confirm after
    // The first paint so nested custom elements have attached their shadow roots.
    queueMicrotask(() => {
      this.tabIndexQueued = false;
      sync();
    });
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(sync);
    }
  }

  private syncTabIndex(selected: boolean): void {
    if (!selected) {
      return;
    }
    const tabbable = !hasFocusableDescendant(this.host);
    if (this.tabbable !== tabbable) {
      this.tabbable = tabbable;
    }
  }

  public render(): VNode {
    const selected = this.tabs?.isSelected(this.value) ?? false;
    const orientation = this.tabs?.orientation() ?? "horizontal";
    const textDirection = this.tabs?.textDirection() ?? "ltr";

    return (
      <Host id={this.tabs?.panelId(this.value)} class={styles.host}>
        <div
          ref={(el) => {
            this.panelEl = el;
          }}
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
          class={styles.panel}
          part="panel"
        >
          <slot />
        </div>
      </Host>
    );
  }
}
