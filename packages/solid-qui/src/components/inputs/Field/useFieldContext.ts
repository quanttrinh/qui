import { createContext } from "solid-js";

import type { FieldApi } from "./Field";

import { useOptionalContext } from "../../../utilities/context";

interface FieldContextValue {
  field: FieldApi;
}

const FieldContext = createContext<FieldContextValue>();

function useFieldContext(): FieldApi | undefined {
  return useOptionalContext(FieldContext)?.field;
}

export { FieldContext, useFieldContext };
