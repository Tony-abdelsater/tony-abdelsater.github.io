import { Splitter } from "@ark-ui/solid"
import { ToggleGroupPlots } from "./ToggleGroupPlots"
import { resizePlots } from "./plots"
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
    motionMetric
} from "./store"
import { createEffect, Show } from "solid-js"
import { ResizeEverything } from "./ResizeEverything"
import { SpeedPlot } from "./SpeedPlot"

function toggleAxis(axis) {
    if (axis === "x") return "X"
    if (axis === "y") return "Y"
    if (axis === "z") return "Z"
    return axis
}

function getMetricTitle(metric) {
    switch(metric()) {
        case 'speed': return 'Speed Analysis';
        case 'acceleration': return 'Acceleration Analysis';
        case 'jerk': return 'Jerk Analysis';
        default: return 'Temporal Analysis';
    }
}

const SplitterV_Plots = () => (
    <Splitter.Root
        onSizeChangeEnd={() => {
            ResizeEverything()
        }}
        size={[
            { id: "nested2-a", size: 33 },
            { id: "nested2-b", size: 33 },
            { id: "nested2-c", size: 34 }
        ]}
        style={{ height: "100%" }}
    >
        <Splitter.Panel id="nested2-a" style={{ height: "100%" }}>
            <div class="plotTitle" id="plotTitle">
                2D <span class="selectedRowColor">{name2DPlot()}</span>{" "}
                Trajectory of{" "}
                <span class="selectedRowColor">{selectedJoint()}</span> on{" "}
                <span class="selectedRowColor">
                    {toggleAxis(toggleValue())}
                </span>
                -Axis
            </div>
            <ToggleGroupPlots />
            <div id="plotPanel_2D" style={{ width: "100%", height: "100%" }} />
        </Splitter.Panel>
        <Splitter.ResizeTrigger id="nested2-a:nested2-b" class="plotSplitter" />
        <Splitter.Panel id="nested2-b" style={{ height: "100%" }}>
            <div class="plotTitle" id="plotTitle3D">
                3D <span class="selectedRowColor">{name3DPlot()}</span>{" "}
                Trajectory of{" "}
                <span class="selectedRowColor">{selectedJoint()}</span>
            </div>
            <div id="plotPanel_3D" style={{ width: "100%", height: "100%" }} />
        </Splitter.Panel>
        {/* Only show the speed plot when a temporal metric is selected */}
        {activeTemporalDescriptor() !== 'none' && showSpeedPlot() && (
            <>
                <Splitter.ResizeTrigger id="nested2-b:nested2-c" class="plotSplitter" />
                <Splitter.Panel id="nested2-c" style={{ height: "100%" }}>
                    <div class="plotTitle" id="plotTitleSpeed">
                        <span class="selectedRowColor">{getMetricTitle(motionMetric)}</span> of {" "}
                        <span class="selectedRowColor">{selectedJoint()}</span>
                    </div>
                    <SpeedPlot />
                </Splitter.Panel>
            </>
        )}
    </Splitter.Root>
)

export { SplitterV_Plots }
