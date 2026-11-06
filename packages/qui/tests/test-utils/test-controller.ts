import { ReactiveControllerBase } from "../../src/components/shared/controllers/reactive-controller";

/** Controller that records lifecycle calls for unit tests. */
export class TestController extends ReactiveControllerBase {
  readonly events: string[] = [];

  public update(): void {
    this.requestUpdate();
  }

  public hostConnected(): void {
    this.events.push("connected");
  }

  public hostDisconnected(): void {
    this.events.push("disconnected");
  }

  public hostWillLoad(): void {
    this.events.push("willLoad");
  }
}
