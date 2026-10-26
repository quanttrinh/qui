function sameSignature(previous: readonly unknown[], next: readonly unknown[]): boolean {
  return (
    previous.length === next.length && previous.every((part, index) => Object.is(part, next[index]))
  );
}

/**
 * Reconciles a context-dependent registration with the inputs from the
 * current render pass. The existing registration is kept until one of the
 * signature inputs changes, then the old registration is torn down before the
 * next one is created.
 */
export class RegistrationReconciler {
  private unregister?: () => void;
  private signature?: readonly unknown[];

  /** Re-runs `register` only when the signature changes. */
  public reconcile(signature: readonly unknown[], register: () => () => void): void {
    const current = this.signature;
    if (current !== undefined && sameSignature(current, signature)) {
      return;
    }
    this.clear();
    this.signature = signature;
    this.unregister = register();
  }

  /** Removes the current registration. */
  public clear(): void {
    this.unregister?.();
    this.unregister = undefined;
    this.signature = undefined;
  }
}
