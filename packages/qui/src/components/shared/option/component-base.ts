import { Prop } from "@stencil/core";

import { FormControlBase } from "../form-control/component-base";
import { type OptionItem, type OptionRender } from "./option";

/**
 * Props shared by form-associated option controls (`qui-select` and
 * `qui-combobox`). Stencil includes decorated props from base classes.
 */
export abstract class OptionControlBase extends FormControlBase {
  /** Options supplied as data. Property-only; overrides `qui-option` children. */
  @Prop() items?: OptionItem[];
  /**
   * Replaces the entire content of each option row, including the selected
   * indicator. Property-only. State and selection styling remain on the row
   * wrapper.
   */
  @Prop() optionRender?: OptionRender;
  /** The controlled selected values. */
  @Prop() value?: string[];
  /** The initial selected values. */
  @Prop() defaultValue?: string[];
  /** The form field name. */
  @Prop() name?: string;
  /** Disables the control. */
  @Prop() disabled = false;
  /** Marks the control invalid. */
  @Prop() invalid = false;
  /** Makes the control read-only. */
  @Prop() readOnly = false;
  /** Marks the control required. */
  @Prop() required = false;
  /** Allows multiple selected values. */
  @Prop() multiple = false;
  /** Whether selecting an item closes the list. Defaults to `true`. */
  @Prop() closeOnSelect?: boolean;
  /** The controlled open state. */
  @Prop() open?: boolean;
  /** The initial open state. */
  @Prop() defaultOpen = false;
  /** Text direction. */
  @Prop() textDirection?: "ltr" | "rtl";
  /** Extra rows rendered above and below the visible window. */
  @Prop() overscan = 6;
  /**
   * Initial row height estimate in pixels. Rendered rows are measured and
   * override this value.
   */
  @Prop() estimateSize = 40;
}
