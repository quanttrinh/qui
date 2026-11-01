/* oxlint-disable eslint/class-methods-use-this, eslint/new-cap -- Stencil calls AttrDeserialize methods on the component instance. */

import { AttrDeserialize, Prop } from "@stencil/core";

import { FormControlBase } from "../form-control/component-base";
import { type OptionItem, type OptionRender } from "./option";

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

function parseStringArray(value: string): string[] | undefined {
  if (value.length === 0) {
    return undefined;
  }

  const parsed = parseJson(value);

  if (Array.isArray(parsed)) {
    return parsed.map(String);
  }

  return [value];
}

function parseOptionItems(value: string): OptionItem[] | undefined {
  const parsed = parseJson(value);

  if (!Array.isArray(parsed)) {
    return undefined;
  }

  const items: unknown[] = parsed;

  return items.flatMap((item) => {
    if (typeof item !== "object" || item === null || !("value" in item)) {
      return [];
    }

    const optionValue = String(item.value);
    const label = "label" in item && typeof item.label === "string" ? item.label : optionValue;
    const keywords =
      "keywords" in item && typeof item.keywords === "string" ? item.keywords : undefined;

    return [
      {
        value: optionValue,
        label,
        disabled: "disabled" in item && item.disabled === true,
        ...(keywords === undefined ? {} : { keywords }),
      },
    ];
  });
}

/**
 * Props shared by form-associated option controls (`qui-select` and
 * `qui-combobox`). Stencil includes decorated props from base classes.
 */
export abstract class OptionControlBase extends FormControlBase {
  /** Options supplied as data. Also accepts a JSON array attribute. */
  @Prop({ attribute: "items" }) items?: OptionItem[];
  /**
   * Replaces the entire content of each option row, including the selected
   * indicator. Property-only. State and selection styling remain on the row
   * wrapper.
   */
  @Prop() optionRender?: OptionRender;
  /** The controlled selected values. Also accepts a JSON array attribute. */
  @Prop({ attribute: "value" }) value?: string[];
  /** The initial selected values. Also accepts a JSON array attribute. */
  @Prop({ attribute: "default-value" }) defaultValue?: string[];
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

  @AttrDeserialize("items")
  private deserializeItems(value: string): OptionItem[] | undefined {
    return parseOptionItems(value);
  }

  @AttrDeserialize("value")
  private deserializeValue(value: string): string[] | undefined {
    return parseStringArray(value);
  }

  @AttrDeserialize("defaultValue")
  private deserializeDefaultValue(value: string): string[] | undefined {
    return parseStringArray(value);
  }
}
