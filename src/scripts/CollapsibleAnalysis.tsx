import { Collapsible } from "@kobalte/core"
import { createSignal } from "solid-js"

// import { CheckboxDexAnalysis } from "./CheckboxDexAnalysis"

function CollapsibleAnalysis() {
	const [arrow1, setArrow1] = createSignal("\u25BC")

	return (
		<Collapsible.Root
			defaultOpen={true}
			class="collapsible"
			onOpenChange={(bool) => {
				if (bool) {
					setArrow1("\u25BC")
				} else {
					setArrow1("\u25B2")
				}
			}}
		>
			<Collapsible.Trigger class="collapsible__trigger">
				<span>Analysis {arrow1()}</span>
			</Collapsible.Trigger>
			<Collapsible.Content class="collapsible__content">
				<div class="collapsible__content-text">
					<div style="display:flex; flex-direction:column; margin-top:10px; margin-bottom:10px;">
						{/* Motion Analysis section */}
						<div>
							
							
							{/* Metric selection - already exists in another component */}
							{/* Geometric Descriptors have been moved to CollapsibleSpeed component */}
						</div>
					</div>
				</div>
			</Collapsible.Content>
		</Collapsible.Root>
	)
}

export { CollapsibleAnalysis }
