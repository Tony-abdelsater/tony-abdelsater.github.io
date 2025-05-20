import { Splitter } from "@ark-ui/solid"
import { ToggleGroupPlots } from "./ToggleGroupPlots"
import { resizePlots, createPlot3D } from "./plots"
import {
    name2DPlot,
    name3DPlot,
    selectedJoint,
    selectedExpressivenessJoint,
    toggleValue,
    expressivePlot_active,
    splitterSizePlotL,
    setSplitterSizePlotL,
    splitterSizePlotR,
    setSplitterSizePlotR,
    splitterSizePlotExpressive,
    setSplitterSizePlotExpressive,
    showSpeedPlot,
    activeTemporalDescriptor,
    activeEffortDescriptor,
    showMetricInfo,
    currentAnimationTime,
    motionMetric
} from "./store"
import { createEffect, Show } from "solid-js"
import { ResizeEverything } from "./ResizeEverything"
import { SpeedPlot } from "./SpeedPlot"
import { WeightEffortPlot } from "./WeightEffortPlot"
import { MetricInfoPanel } from "./MetricInfoPanel"
import RulaScorePanel from "./RULAScorePanel"

const toggleAxis = axis => axis.toUpperCase()
const getMetricTitle = metric => {
  switch (metric()) {
    case "speed": return "Speed Analysis"
    case "acceleration": return "Acceleration Analysis"
    case "jerk": return "Jerk Analysis"
    case "rula": return "RULA Ergonomic Assessment"
    case "weight": return "Weight Effort Analysis"
    default: return "Temporal Analysis"
  }
}
export const SplitterV_Plots = () => {
  // reload 3D plot when metric info panel closes
  createEffect(() => {
    if (!showMetricInfo()) {
      setTimeout(() => createPlot3D(currentAnimationTime()), 50)
    }
  })
  // force a resize when weight effort becomes active
  createEffect(() => {
    if (activeEffortDescriptor() === "weight") {
      setTimeout(() => window.dispatchEvent(new Event("resize")), 100)
    }
  })
  return (
    <Splitter.Root
      onSizeChangeEnd={ResizeEverything}
      size={[
        { id: "nested2-a", size: 33 },
        { id: "nested2-b", size: 33 },
        { id: "nested2-c", size: 34 }
      ]}
      style={{ height: "100%" }}
    >
      <Splitter.Panel id="nested2-a" style={{ height: "100%" }}>
        <div class="plotTitle">
          2D <span class="selectedRowColor">{name2DPlot()}</span>{" "}
          Trajectory of <span class="selectedRowColor">{selectedJoint()}</span> on{" "}
          <span class="selectedRowColor">{toggleAxis(toggleValue())}</span>-Axis
        </div>
        <ToggleGroupPlots />
        <div id="plotPanel_2D" style={{ width: "100%", height: "100%" }} />
      </Splitter.Panel>
      <Splitter.ResizeTrigger id="nested2-a:nested2-b" class="plotSplitter" />
      <Splitter.Panel id="nested2-b" style={{ height: "100%" }}>
        <Show
          when={!showMetricInfo()}
          fallback={<div class="plotTitle">Metric Information</div>}
        >
          <div class="plotTitle">
            3D <span class="selectedRowColor">{name3DPlot()}</span>{" "}
            Trajectory of <span class="selectedRowColor">{selectedJoint()}</span>
          </div>
        </Show>
        <Show
          when={!showMetricInfo()}
          fallback={
            <div style={{ width: "100%", height: "calc(100% - 30px)", overflow: "auto" }}>
              <MetricInfoPanel />
            </div>
          }
        >
          <div id="plotPanel_3D" style={{ width: "100%", height: "100%" }} />
        </Show>
      </Splitter.Panel>
      {((activeTemporalDescriptor() !== "none" && showSpeedPlot()) ||
        activeEffortDescriptor() === "weight") && (
        <>
          <Splitter.ResizeTrigger id="nested2-b:nested2-c" class="plotSplitter" />
          <Splitter.Panel id="nested2-c" style={{ height: "100%" }}>
            <div class="plotTitle" id="plotTitleSpeed">
              <span class="selectedRowColor">
                {activeEffortDescriptor() === 'weight' 
                  ? 'Weight Effort Analysis' 
                  : getMetricTitle(motionMetric)}
              </span> of{" "}
              <span class="selectedRowColor">{selectedJoint()}</span>
            </div>
            {activeEffortDescriptor() === 'weight' ? (
              <WeightEffortPlot />
            ) : motionMetric() === 'rula' ? (
              <div style={{ width: "100%", height: "calc(100% - 30px)", padding: "10px", "overflow-y": "auto" }}>
                <RulaScorePanel />
              </div>
            ) : (
              <SpeedPlot />
            )}
          </Splitter.Panel>
        </>
      )}
    </Splitter.Root>
  )
}