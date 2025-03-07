import { ToggleButton } from "@kobalte/core"
import { createPlot2D } from "./plots"
import { createSignal } from "solid-js"
import { currentAnimationTime, setToggleValue } from "./store"
// import { TableAndPlotsUpdate } from "./CheckboxDexAnalysis"

function ToggleGroupPlots() {
	// Optionally create state for managing the pressed state of each button if needed
	const [isXPressed, setXPressed] = createSignal(true)
	const [isYPressed, setYPressed] = createSignal(false)
	const [isZPressed, setZPressed] = createSignal(false)

	return (
		<div>
			<ToggleButton.Root
				class="toggle-button"
				aria-label="X"
				pressed={isXPressed()}
				onClick={() => {
					setXPressed(true)
					setYPressed(false)
					setZPressed(false)
					createPlot2D(currentAnimationTime(), "x")
					setToggleValue("x")
					// TableAndPlotsUpdate()
				}}
			>
				X
			</ToggleButton.Root>
			<ToggleButton.Root
				class="toggle-button"
				aria-label="Y"
				pressed={isYPressed()}
				onClick={() => {
					setXPressed(false)
					setYPressed(true)
					setZPressed(false)
					createPlot2D(currentAnimationTime(), "y")
					setToggleValue("y")
					// TableAndPlotsUpdate()
				}}
			>
				Y
			</ToggleButton.Root>
			<ToggleButton.Root
				class="toggle-button"
				aria-label="Z"
				pressed={isZPressed()}
				onClick={() => {
					setXPressed(false)
					setYPressed(false)
					setZPressed(true)
					createPlot2D(currentAnimationTime(), "z")
					setToggleValue("z")
					// TableAndPlotsUpdate()
				}}
			>
				Z
			</ToggleButton.Root>
		</div>
	)
}

export { ToggleGroupPlots }
