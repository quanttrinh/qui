import { describe, expect, it, vi } from "vitest";

import { RegistrationReconciler } from "./registration-reconciler";

describe("RegistrationReconciler", () => {
  it("registers once while the signature is unchanged", () => {
    const reconciler = new RegistrationReconciler();
    const unregister = vi.fn((): void => undefined);
    const register = vi.fn(() => unregister);
    const context = {};
    const element = {};

    reconciler.reconcile([context, "one", element], register);
    reconciler.reconcile([context, "one", element], register);

    expect(register).toHaveBeenCalledOnce();
    expect(unregister).not.toHaveBeenCalled();
  });

  it("replaces the registration when an input identity changes", () => {
    const reconciler = new RegistrationReconciler();
    const firstUnregister = vi.fn((): void => undefined);
    const secondUnregister = vi.fn((): void => undefined);
    const register = vi
      .fn<() => () => void>()
      .mockReturnValueOnce(firstUnregister)
      .mockReturnValueOnce(secondUnregister);
    const context = {};

    reconciler.reconcile([context, "one"], register);
    reconciler.reconcile([context, "two"], register);

    expect(firstUnregister).toHaveBeenCalledOnce();
    expect(register).toHaveBeenCalledTimes(2);

    reconciler.clear();
    expect(secondUnregister).toHaveBeenCalledOnce();
  });

  it("is idempotent when cleared repeatedly", () => {
    const reconciler = new RegistrationReconciler();
    const unregister = vi.fn((): void => undefined);
    reconciler.reconcile([], () => unregister);

    reconciler.clear();
    reconciler.clear();

    expect(unregister).toHaveBeenCalledOnce();
  });
});
