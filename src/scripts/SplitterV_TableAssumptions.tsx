import { Splitter } from "@ark-ui/solid"
// import { myScene } from "./myScene_hide"
import { ToggleGroupPlots } from "./ToggleGroupPlots"
import { resizePlots } from "./plots"

import {
	splitterVtable,
	splitterVplotVector,
	selectedRow,
	set_df_coef_mod,
	df_coef,
} from "./store"
import { ResizeEverything } from "./ResizeEverything"
import { Button } from "@kobalte/core/button"
// import { AxisSelector } from "./AxisSelector"
// import { TableAndPlotsUpdate } from "./CheckboxDexAnalysis"

function ResetAllButton() {
	set_df_coef_mod(df_coef())
	// TableAndPlotsUpdate()
}

// This is your nested splitter component.
const SplitterV_TableAssumptions = () => (
	<Splitter.Root
		onSizeChangeEnd={() => {
			ResizeEverything()
		}}
		size={[
			{ id: "table", size: splitterVtable() }, // 50% for the top panel
			{ id: "plotVector", size: splitterVplotVector() }, // 50% for the bottom panel
		]}
	>
		<Splitter.Panel id="table">
			<div class="plotCoefContainer">
				<div class="plotTitle" id="tableTitle">
					Table of Assumptions
				</div>

				<div class="plotTableContainer">
					<div id="plotTable" class="ag-theme-quartz"></div>
				</div>
			</div>
		</Splitter.Panel>
		<Splitter.ResizeTrigger id="table:plotVector" class="tableSplitter" />
		<Splitter.Panel id="plotVector">
			<div class="plotCoefContainer">
				<div class="plotTitle" id="plotVectorTitle">
					2D Coefficients Plot of{" "}
					<span class="selectedRowColor">{selectedRow()}</span>
				</div>

				<div id="tablePlots"></div>
				<div class="grid-container-buttonCoef-parent">
					<div class="grid-container-buttonCoef">
						<button
							onclick={ResetAllButton}
							id="resetAllButton"
							class="buttonCoef"
						>
							Reset All
						</button>
						<button id="resetButton" class="buttonCoef">
							Reset
						</button>
					</div>
				</div>
			</div>
		</Splitter.Panel>
	</Splitter.Root>
)

export { SplitterV_TableAssumptions }
