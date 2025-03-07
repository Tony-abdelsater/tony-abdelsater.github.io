import { Splitter } from "@ark-ui/solid"
// import { myScene } from "./myScene_hide"
import { ToggleGroupPlots } from "./ToggleGroupPlots"
import { resizePlots } from "./plots"
import {
	name2DPlot,
	name3DPlot,
	selectedJoint,
	toggleValue,
	splitterSizePlotL,
	setSplitterSizePlotL,
	splitterSizePlotR,
	setSplitterSizePlotR,
} from "./store"

import { ResizeEverything } from "./ResizeEverything"

function toggleAxis(axis) {
	if (axis === "x") return "X"
	if (axis === "y") return "Y"
	if (axis === "z") return "Z"
	return axis // default case if axis is not x, y, or z
}
// This is your nested splitter component.
const SplitterV_Plots = () => (
	<Splitter.Root
		onSizeChangeEnd={() => {
			ResizeEverything()
		}}
		size={[
			{ id: "nested2-a", size: splitterSizePlotL() }, // 50% for the top panel
			{ id: "nested2-b", size: splitterSizePlotR() }, // 50% for the bottom panel
		]}
	>
		<Splitter.Panel id="nested2-a">
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
		<Splitter.Panel id="nested2-b">
			<div class="plotTitle" id="plotTitle3D">
				3D <span class="selectedRowColor">{name3DPlot()}</span>{" "}
				Trajectory of{" "}
				<span class="selectedRowColor">{selectedJoint()}</span>
			</div>
			<div id="plotPanel_3D" style={{ width: "100%", height: "100%" }} />
		</Splitter.Panel>
	</Splitter.Root>
)

export { SplitterV_Plots }
