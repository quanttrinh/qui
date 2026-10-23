import {
  resolveVar,
  Component,
  Element,
  Event,
  forceUpdate,
  h,
  Host,
  Prop,
  Watch,
  type EventEmitter,
  type VNode,
} from "@stencil/core";
import {
  connect as accordionConnect,
  machine as accordionMachine,
  type Api as AccordionApi,
  type Props as AccordionProps,
  type ValueChangeDetails,
} from "@zag-js/accordion";
import { normalizeProps, spreadProps, VanillaMachine } from "@zag-js/vanilla";

import { styleUrls } from "#qui-style-url";
import { css, cx } from "#styled-system/css";

import { nextId } from "../../utilities/id";
import { type MachineSchemaOf } from "../../utilities/zag";
import { provideAccordion, clearAccordion, type AccordionContext } from "./accordion-context";

type AccordionSchema = MachineSchemaOf<typeof accordionMachine>;

const styles = {
  host: css({ display: "block", width: "full" }),
  root: css({
    width: "full",
    borderWidth: "1px",
    borderColor: "outlineVariant",
    rounded: "xl",
    backgroundColor: "surface",
    overflow: "hidden",
  }),
};

/**
 * MD3 accordion. Compose with `qui-accordion-item`, `qui-accordion-trigger`, and
 * `qui-accordion-content`.
 *
 * @slot - Accordion items.
 */
@Component({
  tag: "qui-accordion",
  styleUrl: resolveVar(styleUrls.quiAccordion),
  scoped: true,
})
export class QuiAccordion {
  @Element() host!: HTMLQuiAccordionElement;

  /** Whether multiple items may be expanded at once. */
  @Prop() multiple = false;
  /** Whether an expanded item may be collapsed. */
  @Prop() collapsible = false;
  /** The controlled expanded values. Property-only. */
  @Prop() value?: string[];
  /** The initial expanded values. Property-only. */
  @Prop() defaultValue?: string[];
  /** Disables every item. */
  @Prop() disabled = false;
  /** Layout orientation. */
  @Prop() orientation: "horizontal" | "vertical" = "vertical";
  /** Text direction. */
  @Prop() textDirection?: "ltr" | "rtl";
  /** Additional class applied to the root element. */
  @Prop() innerClass?: string;

  /** Emitted whenever the expanded values change. */
  @Event({ eventName: "valuechange", bubbles: true, composed: true })
  valueChange!: EventEmitter<ValueChangeDetails>;

  private machine?: VanillaMachine<AccordionSchema>;
  private unsubscribe?: () => void;
  private readonly listeners = new Set<() => void>();
  private spreads: (() => void)[] = [];
  private rootEl?: HTMLDivElement;
  private readonly generatedId = nextId("qui-accordion");

  public componentWillLoad(): void {
    this.machine = new VanillaMachine(accordionMachine, () => this.machineProps());
    this.unsubscribe = this.machine.subscribe(() => {
      forceUpdate(this.host);
      this.notifyListeners();
    });
    this.machine.start();
    provideAccordion(this.host, this.context());
  }

  public connectedCallback(): void {
    if (this.machine !== undefined) {
      provideAccordion(this.host, this.context());
    }
  }

  public componentDidRender(): void {
    this.applySpreads();
  }

  public disconnectedCallback(): void {
    clearAccordion(this.host);
    for (const cleanup of this.spreads) {
      cleanup();
    }
    this.spreads = [];
    this.unsubscribe?.();
    this.machine?.stop();
    this.listeners.clear();
  }

  @Watch("multiple")
  @Watch("collapsible")
  @Watch("value")
  @Watch("disabled")
  @Watch("orientation")
  @Watch("textDirection")
  private syncMachineProps(): void {
    this.machine?.updateProps(this.machineProps());
  }

  private machineProps(): AccordionProps {
    return {
      id: this.host.id || this.generatedId,
      getRootNode: () => this.host.getRootNode(),
      multiple: this.multiple,
      collapsible: this.collapsible,
      value: this.value,
      defaultValue: this.defaultValue,
      disabled: this.disabled,
      orientation: this.orientation,
      dir: this.textDirection,
      onValueChange: (details) => {
        this.valueChange.emit(details);
      },
    };
  }

  private context(): AccordionContext {
    return {
      api: () => this.api,
      subscribe: (listener) => {
        this.listeners.add(listener);
        return () => {
          this.listeners.delete(listener);
        };
      },
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private get api(): AccordionApi {
    if (this.machine === undefined) {
      throw new Error("qui-accordion has not been initialized");
    }
    return accordionConnect(this.machine.service, normalizeProps);
  }

  private applySpreads(): void {
    if (this.rootEl === undefined) {
      return;
    }
    this.spreads = [
      spreadProps(this.rootEl, {
        ...this.api.getRootProps(),
        class: cx(styles.root, this.innerClass),
      }),
    ];
  }

  public render(): VNode {
    return (
      <Host class={styles.host}>
        <div
          ref={(el) => {
            if (el instanceof HTMLDivElement) {
              this.rootEl = el;
            }
          }}
          class={styles.root}
          part="root"
        >
          <slot />
        </div>
      </Host>
    );
  }
}
