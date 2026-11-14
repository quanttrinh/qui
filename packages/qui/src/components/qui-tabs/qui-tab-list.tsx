import { Mixin, resolveVar, Component, Element, h, Host, type VNode } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css } from "#styled-system/css";
import { token } from "#styled-system/tokens";

import { ContextPartController, RegistrationReconciler } from "../shared/controllers";
import { dataAttr } from "../shared/helpers/aria/attr";
import { arrowDelta, edgeKey } from "../shared/helpers/dom/keyboard";
import { ControllerHostMixin } from "../shared/mixins";
import { consumeTabs, type TabsContext } from "./context";

const styles = {
  host: css({ display: "block" }),
  list: css({
    pos: "relative",
    display: "flex",
    flexShrink: 0,
    borderBlockEndWidth: "1px",
    borderColor: `var(--qui-tabs-list-border-color, ${token("colors.outlineVariant")})`,
    "&[data-orientation=vertical]": {
      flexDir: "column",
      borderBlockEndWidth: "0",
      borderEndWidth: "1px",
    },
  }),
};

/**
 * The list container for `qui-tab-trigger` elements.
 *
 * @slot - Tab triggers.
 */
@Component({
  tag: "qui-tab-list",
  styleUrl: resolveVar(styleUrls.quiTabList),
  shadow: true,
})
export class QuiTabList extends Mixin(ControllerHostMixin) {
  @Element() host!: HTMLQuiTabListElement;

  protected readonly contextPart = new ContextPartController(this, {
    key: "tabs",
    consume: consumeTabs,
  });
  private listEl?: HTMLDivElement;
  private readonly registration = new RegistrationReconciler();

  private get tabs(): TabsContext | undefined {
    return this.contextPart.context;
  }

  componentDidRender(): void {
    this.syncRegistration();
  }

  disconnectedCallback(): void {
    this.registration.clear();
    super.disconnectedCallback();
  }

  private syncRegistration(): void {
    const { tabs } = this;
    if (tabs === undefined) {
      return;
    }
    this.registration.reconcile([tabs], () => tabs.registerList(this.host));
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const { tabs, listEl } = this;
    if (!tabs || !listEl || event.defaultPrevented || event.isComposing) {
      return;
    }
    // Tab triggers are slotted into the list rather than owned by it, so the
    // Composed path is the reliable way to check that the key event belongs here.
    if (!event.composedPath().includes(listEl)) {
      return;
    }
    const orientation = tabs.orientation();
    const delta = arrowDelta(event.key, orientation, tabs.textDirection() === "rtl");
    if (delta !== undefined) {
      event.preventDefault();
      tabs.move(delta);
      return;
    }
    const edge = edgeKey(event.key);
    if (edge !== undefined) {
      event.preventDefault();
      tabs.edge(edge);
    }
  };

  render(): VNode {
    const variant = this.tabs?.variant() ?? "primary";
    const orientation = this.tabs?.orientation() ?? "horizontal";
    const textDirection = this.tabs?.textDirection() ?? "ltr";
    const hasFocus = this.tabs?.hasFocus() ?? false;

    return (
      <Host class={styles.host}>
        <div
          ref={(el) => {
            this.listEl = el;
          }}
          id={this.tabs?.listId()}
          role="tablist"
          aria-orientation={orientation}
          data-scope="tabs"
          data-part="list"
          data-orientation={orientation}
          data-focus={dataAttr(hasFocus)}
          data-variant={variant}
          dir={textDirection}
          class={styles.list}
          part="list"
          onKeyDown={this.handleKeyDown}
        >
          <slot />
        </div>
      </Host>
    );
  }
}
