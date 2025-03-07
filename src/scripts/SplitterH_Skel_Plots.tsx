import { Splitter } from "@ark-ui/solid"
// import { myScene } from "./myScene_hide"
import { SplitterV_Plots } from "./SplitterV_Plots"
import { resizePlots } from "./plots"
import { ResizeEverything } from "./ResizeEverything"

import {
	splitterSizeSkelUp,
	setSplitterSizeSkelUp,
	splitterSizeSkelDown,
	setSplitterSizeSkelDown,
} from "./store"

// This is your nested splitter component.
const SplitterH_Skel_Plots = () => (
	<Splitter.Root
		orientation="vertical"
		onSizeChangeEnd={() => {
			ResizeEverything()
		}}
		size={[
			{ id: "nested-a", size: splitterSizeSkelUp() }, // 50% for the top panel
			{ id: "nested-b", size: splitterSizeSkelDown() }, // 50% for the bottom panel
		]}
	>
		<Splitter.Panel id="nested-a">
			<div class="plotTitle" id="skeletonTitle">
				3D Skeleton Visualization{" "}
			</div>
			<div id="threePanel" style={{ width: "100%", height: "100%" }} />

			<div
				id="tooltip"
				style={{
					position: "absolute",
					display: "none",
					background: "white",
					border: "1px solid black",
					padding: "5px",
					"z-index": 100,
				}}
			>
				Tooltip
			</div>
		</Splitter.Panel>
		<Splitter.ResizeTrigger
			id="nested-a:nested-b"
			class="horizontalSplitter"
		/>
		<Splitter.Panel id="nested-b">
			<SplitterV_Plots />
		</Splitter.Panel>
	</Splitter.Root>
)

export { SplitterH_Skel_Plots }
