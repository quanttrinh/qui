import { type Context, useContext as solidUseContext } from "solid-js";

function useContext<T>(
  context: Readonly<Context<T>>,
  component: string,
  parent: string,
): NonNullable<T> {
  const ctx = solidUseContext(context);
  if (ctx === null || ctx === undefined) {
    throw new Error(`${component} must be used inside ${parent}.`);
  }
  return ctx;
}

function useOptionalContext<T>(context: Readonly<Context<T>>): T | undefined {
  return solidUseContext(context);
}

export { useContext, useOptionalContext };
