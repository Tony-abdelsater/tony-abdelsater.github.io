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
    showMetricInfo,
    currentAnimationTime,
    motionMetric
} from "./store"
import { createEffect, Show } from "solid-js"
import { ResizeEverything } from "./ResizeEverything"
import { SpeedPlot } from "./SpeedPlot"
import { MetricInfoPanel } from "./MetricInfoPanel"
import RulaScorePanel from "./RULAScorePanel"

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
        case 'rula': return 'RULA Ergonomic Assessment';
        default: return 'Temporal Analysis';
    }
}

const SplitterV_Plots = () => {
    // Effect to reload 3D plot when showMetricInfo toggle changes to false
    createEffect(() => {
        // When showMetricInfo becomes false (unchecked), reload the 3D plot
        if (!showMetricInfo()) {
            console.log("Reloading 3D plot after checkbox was unchecked");
            
            // Wait for DOM to update before creating the plot
            setTimeout(() => {
                const plot3DElement = document.getElementById("plotPanel_3D");
                if (plot3DElement) {
                    createPlot3D(currentAnimationTime());
                }
            }, 50);
        }
    });

    return (
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
                <Show
                    when={!showMetricInfo()}
                    fallback={
                        <div class="plotTitle" id="plotTitleMetricInfo">
                            Metric Information
                        </div>
                    }
                >
                    <div class="plotTitle" id="plotTitle3D">
                        3D <span class="selectedRowColor">{name3DPlot()}</span>{" "}
                        Trajectory of{" "}
                        <span class="selectedRowColor">{selectedJoint()}</span>
                    </div>
                </Show>
                
                {/* Conditionally render 3D plot or MetricInfoPanel */}
                <Show
                    when={!showMetricInfo()}
                    fallback={
                        <div style={{ width: "100%", height: "calc(100% - 30px)", "overflow-y": "auto" }}>
                            <MetricInfoPanel />
                        </div>
                    }
                >
                    <div id="plotPanel_3D" style={{ width: "100%", height: "100%" }} />
                </Show>
            </Splitter.Panel>
            {activeTemporalDescriptor() !== 'none' && showSpeedPlot() && (
                <>
                    <Splitter.ResizeTrigger id="nested2-b:nested2-c" class="plotSplitter" />
                    <Splitter.Panel id="nested2-c" style={{ height: "100%" }}>
                        <div class="plotTitle" id="plotTitleSpeed">
                            <span class="selectedRowColor">{getMetricTitle(motionMetric)}</span> of {" "}
                            <span class="selectedRowColor">{selectedJoint()}</span>
                        </div>
                        {/* Render RulaScorePanel or SpeedPlot based on selected metric */}
                        {motionMetric() === 'rula' ? (
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

export { SplitterV_Plots }
