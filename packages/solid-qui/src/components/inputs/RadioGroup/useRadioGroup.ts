import {
  type Api,
  connect,
  machine,
  type Props,
  props as radioGroupProps,
} from "@zag-js/radio-group";
import { type PropTypes, normalizeProps, useMachine } from "@zag-js/solid";
import { type Accessor, type JSX, createMemo, createUniqueId, mergeProps } from "solid-js";

import { useFieldContext } from "../Field/useFieldContext";

type RadioGroupApi = Api<PropTypes>;

/** Machine props, minus the ids the hook owns. */
type RadioGroupMachineProps = Omit<Props, "id" | "ids">;

/** Machine prop keys, so callers can `splitProps` their own extras out. */
export const radioGroupPropKeys = radioGroupProps.filter(
  (key): key is Exclude<keyof Props, "id" | "ids"> => key !== "id" && key !== "ids",
);

interface RadioGroupController {
  /** The connected machine API. */
  api: Accessor<RadioGroupApi>;
  /** Root props, wired to the surrounding `Field` when present. */
  rootProps: () => JSX.HTMLAttributes<HTMLDivElement>;
}

/**
 * Shared radio-group machine + `Field` wiring for `RadioGroup`. Exported so
 * consumers can build styled radio-group variants on the same behavior.
 */
export function useRadioGroup(machineProps: RadioGroupMachineProps): RadioGroupController {
  const field = useFieldContext();

  const context = mergeProps(machineProps, {
    id: createUniqueId(),
    get disabled() {
      return field?.disabled() ?? machineProps.disabled;
    },
    get invalid() {
      return field?.invalid() ?? machineProps.invalid;
    },
    get readOnly() {
      return field?.readOnly() ?? machineProps.readOnly;
    },
    get required() {
      return field?.required() ?? machineProps.required;
    },
  });

  const service = useMachine(machine, context);
  const api = createMemo((): RadioGroupApi => connect(service, normalizeProps));

  const rootProps = (): JSX.HTMLAttributes<HTMLDivElement> => {
    const root = api().getRootProps();
    if (!field) {
      return { ...root };
    }
    const control = field.getInputProps();
    return {
      "aria-labelledby": field.ids.label,
      "aria-describedby": control["aria-describedby"],
      "aria-errormessage": control["aria-errormessage"],
      ...root,
    };
  };

  return { api, rootProps };
}
