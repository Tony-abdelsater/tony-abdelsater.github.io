import { createEffect, createSignal, Show } from "solid-js";
import { WeightEffortPlot } from "./WeightEffortPlot";
import { 
  activeEffortDescriptor,
  selectedJoint
} from "./store";

export function WeightEffortDisplay() {
  // Track if weight effort is active
  const [isVisible, setIsVisible] = createSignal(false);
  
  // Update visibility when the effort descriptor changes
  createEffect(() => {
    setIsVisible(activeEffortDescriptor() === 'weight');
  });
  return (
    <Show when={isVisible()}>
      <div style={{
        "margin-top": "20px",
        "margin-bottom": "20px",
        "border": "2px solid #ff8800",
        "border-radius": "5px",
        "overflow": "hidden",
        "padding-bottom": "10px",
        "box-shadow": "0 4px 8px rgba(0,0,0,0.15)",
        "background-color": "#fff"
      }}>
        <div style="padding: 15px; background: #fff4e6; border-bottom: 1px solid #ffbb66;">
          <h3 style="margin: 0; font-size: 18px; color: #d06500; font-weight: bold;">Weight Effort Analysis</h3>
          <p style="margin-top: 5px; font-size: 14px; color: #333;">
            Currently analyzing: <strong>{selectedJoint()}</strong>
          </p>
          <p style="font-size: 13px; color: #666; margin-top: 5px; font-style: italic;">
            Based on kinetic energy formula: E(t) = Σ λk * vk(t)²
          </p>
        </div>
        <div style="padding: 15px;">
          <WeightEffortPlot />
        </div>
      </div>
    </Show>
  );
}
