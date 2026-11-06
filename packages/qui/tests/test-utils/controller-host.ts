import {
  type ReactiveController,
  type ReactiveControllerHost,
} from "../../src/components/shared/controllers/reactive-control/controller";

/** Minimal `ReactiveControllerHost` for unit tests. */
export interface TestControllerHost extends ReactiveControllerHost {
  readonly controllers: Set<ReactiveController>;
  /** Number of `requestUpdate()` calls. */
  readonly updateCount: number;
}

/**
 * Creates a controller host backed by a fake element. Pass the element the
 * controller should observe when it needs a real DOM node.
 */
export function createTestControllerHost(hostElement?: HTMLElement): TestControllerHost {
  const controllers = new Set<ReactiveController>();
  let updateCount = 0;

  return {
    hostElement: hostElement ?? ({} as HTMLElement),
    controllers,
    get updateCount(): number {
      return updateCount;
    },
    addController(controller: ReactiveController): void {
      controllers.add(controller);
    },
    removeController(controller: ReactiveController): void {
      controllers.delete(controller);
    },
    requestUpdate(): void {
      updateCount += 1;
    },
  };
}
