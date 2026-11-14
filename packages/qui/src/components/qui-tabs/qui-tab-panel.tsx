import {
  Mixin,
  resolveVar,
  Component,
  Element,
  h,
  Host,
  Prop,
  State,
  type VNode,
} from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css } from "#styled-system/css";
import { token } from "#styled-system/tokens";

import { ContextPartController, RegistrationReconciler } from "../shared/controllers";
import { setAriaControls, setAriaLabelledBy } from "../shared/helpers/aria/aria";
import { dataAttr } from "../shared/helpers/aria/attr";
import { ControllerHostMixin, ShadowStylesMixin } from "../shared/mixins";
import { focusRing } from "../shared/styles";
import { tabsContext, type TabsContext } from "./context";
import { type TabsTriggerRegistration } from "./controller";
import { hasFocusableDescendant } from "./focusable";

const styles = {
  host: css({ display: "contents" }),
  panel: css({
    flex: "1",
    py: "3",
    outlineStyle: "none",
    fontSize: "sm",
    color: `var(--qui-tabs-panel-text-color, ${token("colors.onSurfaceVariant")})`,
    // Defers layout/paint of off-screen panels. Inactive panels are also hidden,
    // So this mainly helps long, active panels below the fold.
    contentVisibility: "auto",
    containIntrinsicSize: "auto 100px",
    "&[data-orientation=vertical]": { py: "0", ps: "4" },
    "&:focus-visible": focusRing,
  }),
};

/**
 * A tab panel. Must be inside `qui-tabs`.
 *
 * @slot - Panel content.
 * @undefinedContent
 */
@Component({
  tag: "qui-tab-panel",
  styleUrl: resolveVar(styleUrls.quiTabPanel),
  shadow: true,
})
export class QuiTabPanel extends Mixin(ShadowStylesMixin, ControllerHostMixin) {
  @Element() host!: HTMLQuiTabPanelElement;

  /** The value linking this panel to its trigger. */
  @Prop() value!: string;

  @State() private tabbable = false;

  private panelEl?: HTMLDivElement;
  private tabIndexQueued = false;
  private lastSelected?: boolean;
  private ariaPanelEl?: HTMLDivElement;
  private ariaTrigger?: TabsTriggerRegistration;
  private contentObserver?: MutationObserver;
  private readonly registration = new RegistrationReconciler();

  protected readonly contextPart = new ContextPartController(this, {
    context: tabsContext,
    getKey: () => this.value,
  });

  private get tabs(): TabsContext | undefined {
    return this.contextPart.context;
  }

  connectedCallback(): void {
    super.connectedCallback();
    if (typeof MutationObserver !== "undefined") {
      this.contentObserver = new MutationObserver(() => {
        this.scheduleTabIndex();
      });
      this.contentObserver.observe(this.host, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ["disabled", "hidden", "inert", "tabindex"],
      });
    }
  }

  componentDidRender(): void {
    this.syncRegistration();
    this.syncAria();
    // Only re-walk on selection changes; content mutations schedule their own check.
    const selected = this.tabs?.isSelected(this.value) ?? false;
    if (selected !== this.lastSelected) {
      this.lastSelected = selected;
      this.scheduleTabIndex();
    }
  }

  disconnectedCallback(): void {
    this.contentObserver?.disconnect();
    this.contentObserver = undefined;
    this.lastSelected = undefined;
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
    if (!tabs || !panelEl) {
      return;
    }
    const trigger = tabs.getTrigger(this.value);
    if (this.ariaPanelEl === panelEl && this.ariaTrigger === trigger) {
      return;
    }
    this.ariaPanelEl = panelEl;
    this.ariaTrigger = trigger;
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

  render(): VNode {
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
