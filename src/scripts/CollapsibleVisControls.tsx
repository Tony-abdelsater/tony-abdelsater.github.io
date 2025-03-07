import { Collapsible, Switch } from "@kobalte/core"
import { createSignal } from "solid-js"
import { JointSelector } from "./JointSelector"
import { SliderBasic } from "./SliderBasic"
// import { myScene } from "./myScene"
import { initializeWhenLoaded } from "./useSceneSetup"
import { createPlot2D, createPlot3D } from "./plots"
import { Separator } from "@kobalte/core/separator"
import { Checkbox } from "@kobalte/core/checkbox"
import { ResizeEverything } from "./ResizeEverything"

import {
	currentAnimationTime,
	loadingDone,
	mode2DPlot,
	time_to_frame,
	setCurrentAnimationTime,
	setMode2DPlot,
	mode3DPlot,
	setMode3DPlot,
	toggleValue,
	setName2DPlot,
	setName3DPlot,
	setSplitterSizePlotL,
	setSplitterSizePlotR,
	setSplitterSizeSkelUp,
	setSplitterSizeSkelDown,
	skeletonViewersSig,
	setSkeletonViewersSig,
} from "./store"

function sendMessageToParent(userData) {
	const message = {
		info: "Sending 3D plot mode from iframe",
		userData: userData,
	}

	// Χρησιμοποιούμε το postMessage για να στείλουμε μήνυμα στο parent window (Moodle)
	window.parent.postMessage(message, "http://localhost") // Replace with actual Moodle origin

	console.log("Message sent to parent window:", message)
}

function CollapsibleVisControls() {
	const [arrow2, setArrow2] = createSignal("\u25BC")
	const [plot2D_active, setPlot2D_active] = createSignal(true)
	const [plot3D_active, setPlot3D_active] = createSignal(true)

	function previousTimeValue() {
		return (time_to_frame(currentAnimationTime()) - 1) / 90
	}

	function nextTimeValue() {
		return setCurrentAnimationTime(
			(time_to_frame(currentAnimationTime()) + 1) / 90
		)
	}

	async function resizePlotWindows() {
		let plotActive = false
		if (plot2D_active() && !plot3D_active()) {
			setSplitterSizePlotL(0)
			setSplitterSizePlotR(0)

			setSplitterSizePlotL(100)
			setSplitterSizePlotR(0)
			plotActive = true
		} else if (plot2D_active() && plot3D_active()) {
			setSplitterSizePlotL(0)
			setSplitterSizePlotR(0)

			setSplitterSizePlotL(50)
			setSplitterSizePlotR(50)
			plotActive = true
		} else if (!plot2D_active() && plot3D_active()) {
			setSplitterSizePlotL(0)
			setSplitterSizePlotL(0)

			setSplitterSizePlotL(0)
			setSplitterSizePlotR(100)
			plotActive = true
		}

		if (!plotActive) {
			setSplitterSizeSkelUp(0)
			setSplitterSizeSkelDown(0)

			setSplitterSizeSkelUp(100)
			setSplitterSizeSkelDown(0)
		} else {
			setSplitterSizeSkelUp(0)
			setSplitterSizeSkelDown(0)

			setSplitterSizeSkelUp(50)
			setSplitterSizeSkelDown(50)
		}

		setTimeout(() => {
			ResizeEverything()
		}, 1)
	}

	return (
		<Collapsible.Root
			defaultOpen={true}
			class="collapsible"
			onOpenChange={(bool) => {
				if (bool) {
					setArrow2("\u25BC")
				} else {
					setArrow2("\u25B2")
				}
			}}
		>
			<Collapsible.Trigger
				class="collapsible__trigger"
				id="CollapsibleVisControls"
			>
				<span>Visualization Controls {arrow2()}</span>
			</Collapsible.Trigger>
			<Collapsible.Content class="collapsible__content">
				<div class="collapsible__content-text">
					{loadingDone() && <JointSelector />}
					<div class="grid-container">
						<div
							class="grid-item full-width"
							style="margin-bottom: 20px;"
						>
							<SliderBasic />
						</div>

						<div class="grid-item">
							<button
								// onClick={() => {
								// 	myScene.setAnimationTime(
								// 		previousTimeValue()
								// 	)
								// 	//myScene.playPressed=true;
								// }}
								class="player_buttons"
								id="previousButton"
								title="Previous Frame"
							>
								<span class="material-symbols-outlined">
									navigate_before
								</span>
							</button>
						</div>
						<div class="grid-item">
							<button
								onClick={() => {
									skeletonViewersSig().forEach((viewer) => {
										viewer.play()
									})
								}}
								class="player_buttons"
								id="playButton"
								title="Play Animation"
							>
								<span class="material-symbols-outlined">
									play_arrow
								</span>
							</button>
						</div>
						<div class="grid-item">
							<button
								onClick={() => {
									skeletonViewersSig().forEach((viewer) => {
										viewer.stop()
									})
								}}
								class="player_buttons"
								id="stopButton"
								title="Pause Animation"
							>
								<span class="material-symbols-outlined">
									pause
								</span>
							</button>
						</div>
						<div class="grid-item">
							<button
								// onClick={() => {
								// 	myScene.setAnimationTime(nextTimeValue())
								// 	//myScene.playPressed=true;
								// }}
								class="player_buttons"
								id="nextButton"
								title="Next Frame"
							>
								<span class="material-symbols-outlined">
									navigate_next
								</span>
							</button>
						</div>
					</div>
					<Separator class="separator" />
					<div
						class="toolbarDescription"
						style={"margin-bottom: 10px; margin-top: 30px"}
					>
						{" "}
						Adjust Plot Parameters:{" "}
					</div>

					<div class="plot-mode-grid">
						<div class="plot-options-section top-left"> </div>

						<div class="plot-options-section top-center">
							Positions / Angles
						</div>
						<div class="plot-options-section top-right">
							activate/ <br />
							deactivate
						</div>
						<div class="plot-type-section center-left">
							2D Plot:
						</div>

						<div class="plot-switch-section center-center">
							<Switch.Root
								class="switch"
								checked={mode2DPlot()}
								onChange={async (value) => {
									setMode2DPlot(value)
									if (value) {
										setName2DPlot("Angle")
									} else {
										setName2DPlot("Position")
									}
									await initializeWhenLoaded()
								}}
							>
								<Switch.Input class="switch__input" />
								<Switch.Control class="switch__control">
									<Switch.Thumb class="switch__thumb" />
								</Switch.Control>
							</Switch.Root>
						</div>

						<div class="plot-mode-section center-right">
							<Checkbox
								class="checkbox"
								checked={plot2D_active()}
								onChange={async (e) => {
									setPlot2D_active(e)
									await resizePlotWindows()
								}}
							>
								<Checkbox.Input class="checkbox__input" />
								<Checkbox.Control class="checkbox__control">
									<Checkbox.Indicator>
										&#10004;
									</Checkbox.Indicator>
								</Checkbox.Control>
							</Checkbox>
						</div>

						<div class="plot-type-section bottom-left">
							3D Plot:
						</div>

						<div class="plot-switch-section bottom-center">
							<Switch.Root
								class="switch"
								checked={mode3DPlot()}
								onChange={async (value) => {
									setMode3DPlot(value)
									if (value) {
										setName3DPlot("Angle")
									} else {
										setName3DPlot("Position")
									}
									await initializeWhenLoaded()
									sendMessageToParent({ plotMode: value })
								}}
							>
								<Switch.Input class="switch__input" />
								<Switch.Control class="switch__control">
									<Switch.Thumb class="switch__thumb" />
								</Switch.Control>
							</Switch.Root>
						</div>
						<div class="plot-mode-section bottom-right">
							<Checkbox
								class="checkbox"
								checked={plot3D_active()}
								onChange={async (e) => {
									setPlot3D_active(e)
									await resizePlotWindows()
								}}
							>
								<Checkbox.Input class="checkbox__input" />
								<Checkbox.Control class="checkbox__control">
									<Checkbox.Indicator>
										&#10004;
									</Checkbox.Indicator>
								</Checkbox.Control>
							</Checkbox>
						</div>
					</div>
				</div>
			</Collapsible.Content>
		</Collapsible.Root>
	)
}

export { CollapsibleVisControls }
