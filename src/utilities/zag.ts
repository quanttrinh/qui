import { type Machine, type MachineSchema } from "@zag-js/core";

/** Extract the schema type from a concrete Zag machine. */
export type MachineSchemaOf<M> =
  M extends Machine<infer Schema> ? (Schema extends MachineSchema ? Schema : never) : never;
