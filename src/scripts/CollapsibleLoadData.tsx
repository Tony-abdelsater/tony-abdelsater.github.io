import { Collapsible } from "@kobalte/core"
import { createSignal } from "solid-js"
import { BVHSelector } from "./bvhSelector"
import { uploadOutput } from "./store"
import NestedPage from "./NestedPage"
// import { uploadFile } from "./useSceneSetup"

function CollapsibleLoadData() {
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
				<span>Load MoCap Recording {arrow1()}</span>
			</Collapsible.Trigger>
			<Collapsible.Content class="collapsible__content">
				<div class="collapsible__content-text">
					{/* <div class="toolbarDescription">
						{" "}
						Select File from Repository:{" "}
					</div>
					<BVHSelector />
					<div
						class="toolbarDescription"
						style={
							"margin-bottom: 0; margin-top: -20px; padding:0;"
						}
					>
						{" "}
						or
					</div>

					<div class="upload-container">
						<label for="file-upload" class="custom-file-upload">
							Upload File
						</label>
						<input
							id="file-upload"
							type="file"
							// onChange={(e) => {
							// 	console.log(e.target.files[0])
							// 	uploadFile(e.target.files[0], e.target.value)
							// }}
						/>
						<span class="file-info">{uploadOutput()}</span>
					</div> */}
					<NestedPage />
				</div>
			</Collapsible.Content>
		</Collapsible.Root>
	)
}

export { CollapsibleLoadData }
