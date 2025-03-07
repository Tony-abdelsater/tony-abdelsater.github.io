import { Splitter } from "@ark-ui/solid"

import {
	splitterSizeL,
	splitterSizeR,
	selectedAssumptionsIndex,
	selectedTab,
	setAppIsLoaded,
} from "./store"
import { SplitterH_Skel_Plots } from "./SplitterH_Skel_Plots"
import { ResizeEverything } from "./ResizeEverything"
import { Separator } from "@kobalte/core/separator"
import { ToggleGroup } from "@kobalte/core/toggle-group"
import { createSignal, onMount } from "solid-js"

const SplitterV_SkelL_DexR = () => {
	function thisOnChange() {
		ResizeEverything()
	}
	const mystyle = {
		width: "100% ",
		height: "100%",
		flex: 1,
		overflow: "auto",
	}

	const [valueButton, setValueButton] = createSignal("ATT-RGOM")

	return (
		<Splitter.Root
			size={[
				{ id: "main-panel", size: splitterSizeL() },
				{ id: "dex_analysis-panel", size: splitterSizeR() },
			]}
			onSizeChangeEnd={() => {
				thisOnChange()
			}}
		>
			<Splitter.Panel id="main-panel">
				<div style={mystyle}>
					<SplitterH_Skel_Plots />
				</div>
			</Splitter.Panel>
			<Splitter.ResizeTrigger
				id="main-panel:dex_analysis-panel"
				class="mainVericalSplitter"
			/>
			<Splitter.Panel id="dex_analysis-panel"></Splitter.Panel>
		</Splitter.Root>
	)
}

export { SplitterV_SkelL_DexR }
