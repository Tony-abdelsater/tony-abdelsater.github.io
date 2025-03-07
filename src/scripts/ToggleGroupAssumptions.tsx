import { ToggleGroup } from "@kobalte/core/toggle-group"
import { createSignal, onMount } from "solid-js"
import { selectedAssumptionsIndex, setSelectedAssumptionsIndex } from "./store"

function ToggleGroupAssumptions() {
	const [indicatorStyle, setIndicatorStyle] = createSignal({
		width: "0px",
		transform: "translateX(0px)",
	})

	const items = [
		"GOM",
		"=",
		// "(",
		"Transitioning",
		"+",
		"Intra-joint association",
		"+",
		"Inter-limb synergy",
		"+",
		"Serial intra-limb mediation",
		"+",
		"Non-serial intra-limb mediation",
		// ")",
		"All assumptions statistics",
	]

	const handleSelect = (index) => {
		setSelectedAssumptionsIndex(index)
		updateIndicatorStyle(index)
	}

	const updateIndicatorStyle = (index) => {
		const item = document.querySelectorAll(".custom-toggle-group__item")[
			index
		] as HTMLElement
		if (item) {
			const { offsetWidth, offsetLeft } = item
			setIndicatorStyle({
				width: `${offsetWidth}px`,
				transform: `translateX(${offsetLeft}px)`,
			})
		}
	}

	onMount(() => {
		handleSelect(selectedAssumptionsIndex())
	})

	return (
		<div>
			<ToggleGroup
				defaultValue={selectedAssumptionsIndex()}
				class="custom-toggle-group"
			>
				{items.map((item, index) => (
					<ToggleGroup.Item
						class="custom-toggle-group__item"
						value={item}
						aria-label={item}
						onClick={() => {
							if (item !== "+" && item !== "=") {
								handleSelect(index)
							}
						}}
						aria-selected={selectedAssumptionsIndex() === index}
						disabled={item === "+" || item === "="} // Disable items with "+"
					>
						{item}
					</ToggleGroup.Item>
				))}
				<div
					class="custom-toggle-group__indicator"
					style={indicatorStyle()}
				/>
			</ToggleGroup>
		</div>
	)
}

export { ToggleGroupAssumptions }
