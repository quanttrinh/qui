import { h, type VNode } from "@stencil/core";

import { AddIcon, RemoveIcon, VisibilityIcon, VisibilityOffIcon } from "../qui-icon/icons";
import { styles } from "./styles";

export interface NumberStepperViewProps {
  readonly canIncrement: boolean;
  readonly canDecrement: boolean;
  readonly onStartHold: (direction: 1 | -1) => void;
  readonly onStopHold: () => void;
  readonly onStep: (direction: 1 | -1) => void;
}

interface StepperTriggerProps extends NumberStepperViewProps {
  readonly direction: 1 | -1;
  readonly label: string;
  readonly disabled: boolean;
}

function renderStepperTrigger(props: StepperTriggerProps): VNode {
  const { direction, disabled, label, onStartHold, onStopHold, onStep } = props;
  const Icon = direction > 0 ? AddIcon : RemoveIcon;

  return (
    <button
      type="button"
      data-part={direction > 0 ? "increment-trigger" : "decrement-trigger"}
      aria-label={label}
      class={styles.stepper}
      disabled={disabled}
      onPointerDown={() => {
        onStartHold(direction);
      }}
      onPointerUp={onStopHold}
      onPointerCancel={onStopHold}
      onPointerLeave={onStopHold}
      onMouseDown={(event) => {
        event.preventDefault();
      }}
      onClick={(event) => {
        if (event.detail === 0) {
          onStep(direction);
        }
      }}
    >
      <Icon class={styles.stepperIcon} />
    </button>
  );
}

/** Renders the increment/decrement buttons for number inputs. */
export function renderNumberStepper(props: NumberStepperViewProps): VNode {
  return (
    <div data-part="number-triggers" class={styles.numberTriggers}>
      {renderStepperTrigger({
        ...props,
        direction: 1,
        label: "Increment",
        disabled: !props.canIncrement,
      })}
      {renderStepperTrigger({
        ...props,
        direction: -1,
        label: "Decrement",
        disabled: !props.canDecrement,
      })}
    </div>
  );
}

export interface PasswordToggleProps {
  readonly visible: boolean;
  readonly disabled: boolean;
  readonly onToggle: () => void;
}

/** Renders the show/hide password button. */
export function renderPasswordToggle({ visible, disabled, onToggle }: PasswordToggleProps): VNode {
  return (
    <button
      type="button"
      data-part="visibility-trigger"
      aria-label={visible ? "Hide password" : "Show password"}
      aria-pressed={visible ? "true" : "false"}
      class={styles.trigger}
      disabled={disabled}
      onMouseDown={(event) => {
        event.preventDefault();
      }}
      onClick={onToggle}
    >
      {visible ? (
        <VisibilityIcon class={styles.triggerIcon} />
      ) : (
        <VisibilityOffIcon class={styles.triggerIcon} />
      )}
    </button>
  );
}
