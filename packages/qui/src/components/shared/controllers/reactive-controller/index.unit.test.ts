import { describe, expect, it } from "vitest";

import { createTestControllerHost } from "../../../../../tests/test-utils/controller-host";
import { TestController } from "../../../../../tests/test-utils/test-controller";

describe("ReactiveControllerBase", () => {
  it("registers itself with the host", () => {
    const host = createTestControllerHost();
    const controller = new TestController(host);

    expect(host.controllers.has(controller)).toBe(true);
  });

  it("delegates requestUpdate to the host", () => {
    const host = createTestControllerHost();
    const controller = new TestController(host);

    controller.update();

    expect(host.updateCount).toBe(1);
  });
});
