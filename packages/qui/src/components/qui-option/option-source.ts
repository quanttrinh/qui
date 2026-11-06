import { type OptionItem } from "../shared/option/option";
import { type OptionSourceAdapter } from "../shared/option/source-controller";

/** A `qui-option` element as read by Select and Combobox. */
interface OptionElement extends HTMLElement {
  value?: string;
  label?: string;
  keywords?: string;
  disabled?: boolean;
}

/** Resolve an option's display label from its prop, slot text, or value. */
function optionLabel(option: OptionElement): string {
  const label = option.label ?? option.getAttribute("label") ?? "";
  if (label !== "") {
    return label;
  }
  const textContent: unknown = Reflect.get(option, "textContent");
  const text = typeof textContent === "string" ? textContent.trim() : "";
  if (text !== "") {
    return text;
  }
  return option.value ?? option.getAttribute("value") ?? "";
}

/** Reads the `qui-option` children of a control as items. */
function readOptionItems(host: HTMLElement): OptionItem[] {
  return [...host.querySelectorAll<OptionElement>("qui-option")].map((option) => {
    const keywords = (option.keywords ?? option.getAttribute("keywords") ?? "").trim();
    return {
      value: option.value ?? option.getAttribute("value") ?? "",
      label: optionLabel(option),
      disabled: Boolean(option.disabled) || option.hasAttribute("disabled"),
      keywords: keywords === "" ? undefined : keywords,
    };
  });
}

/** Ties the generic option source controller to `qui-option` elements. */
export const quiOptionSource: OptionSourceAdapter = {
  observerInit: {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["value", "disabled", "label", "keywords"],
  },
  read: readOptionItems,
};
