import { Splitter } from "@ark-ui/solid"
import { createEffect, createSignal } from "solid-js"
import { CollapsibleAnalysis } from "./CollapsibleAnalysis"
import { CollapsibleMotionAnalysis } from "./CollapsibleMotionAnalysis"
import { CollapsibleLoadData } from "./CollapsibleLoadData"
import { CollapsibleVisControls } from "./CollapsibleVisControls"
import { JointSelector } from "./JointSelector"
import { ResizeEverything } from "./ResizeEverything"
import { SpeedPlot } from "./SpeedPlot"

import {
	splitterSizeL,
	setSplitterSizeL,
	splitterSizeR,
	setSplitterSizeR,
	showSpeedPlot,
	mainPageLoaded,
} from "./store"

import "ag-grid-community/styles/ag-grid.css"
import "ag-grid-community/styles/ag-theme-quartz.css"
import { SplitterV_SkelL_DexR } from "./SplitterV_SkelL_DexR"

import { exportBVH } from "./ExportBVH"
// import { myScene } from "./myScene_hide"

const SplitterMainV_LMenu = () => {
	function thisOnChange() {
		ResizeEverything()
	}

	// async function exportBVHFunc() {
	// 	const bvhData = await exportBVH(
	// 		myScene.globalResult.skeleton,
	// 		myScene.animationClip
	// 	)

	// 	const blob = new Blob([bvhData], { type: "text/plain" })
	// 	const url = URL.createObjectURL(blob)
	// 	// Create a download link
	// 	const link = document.createElement("a")
	// 	link.href = url
	// 	link.download = "animation.bvh"
	// 	document.body.appendChild(link)
	// 	link.click()

	// 	document.body.removeChild(link)
	// 	URL.revokeObjectURL(url)

	// 	console.log(bvhData)
	// }

	return (
		<Splitter.Root
			size={[
				{ id: "viewer-panel", size: 14 },
				{ id: "control-panel", size: 86 },
			]}
			onSizeChangeEnd={async (e) => {
				// await setSplitterSizeL(50)
				// await setSplitterSizeR(50)
				thisOnChange()
				console.log(e.size[0].size)
			}}
		>
			<Splitter.Panel id="viewer-panel">
				<div
					id="threelogs"
					style={{ overflow: "auto", height: "100%" }}
				>
					<CollapsibleLoadData />
					<CollapsibleVisControls />
					<CollapsibleMotionAnalysis />
					<CollapsibleAnalysis />
					<button
						// onclick={exportBVHFunc}
						id="resetAllButton"
						class="buttonCoef"
						style="margin-top:20px;"
					>
						export BVH
					</button>
				</div>
			</Splitter.Panel>
			<Splitter.ResizeTrigger
				id="viewer-panel:control-panel"
				class="mainVericalSplitter"
			/>
			<Splitter.Panel id="control-panel">
				<SplitterV_SkelL_DexR />
			</Splitter.Panel>
		</Splitter.Root>
	)
}

export { SplitterMainV_LMenu }
