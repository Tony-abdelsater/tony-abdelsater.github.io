import { createEffect } from "solid-js"
import { Slider } from "@kobalte/core"
// import { myScene } from "./myScene"
import {
	animationDuration,
	currentAnimationTime,
	setCurrentAnimationTime,
	toggleValue,
	skeletonViewersSig,
	playPressed,
	setPlayPressed,
} from "./store"
import { updatePlot2D, updatePlot3D } from "./plots"

const SliderBasic = () => {
	function throttle(callback, limit) {
		let waiting = false // Initially, not waiting
		return function () {
			if (!waiting) {
				callback.apply(this, arguments)
				waiting = true // Prevent future invocations
				setTimeout(() => {
					waiting = false // After a period, allow future invocations
				}, limit)
			}
		}
	}

	const updateFrequency = 60 // Calculate the update interval for 60 FPS

	const throttledUpdate2D = throttle(() => {
		updatePlot2D(currentAnimationTime(), toggleValue())
	}, 1000 / updateFrequency) // 30 FPS

	const throttledUpdate3D = throttle(() => {
		updatePlot3D(currentAnimationTime())
	}, 1000 / updateFrequency) // 30 FPS

	createEffect(() => {
		currentAnimationTime()
		if (playPressed()) {
			throttledUpdate2D()

			setTimeout(function () {
				throttledUpdate3D()
			}, 1)
		}
	})

	return (
		<Slider.Root
			id="SliderBasic"
			class="SliderRoot"
			value={[currentAnimationTime()]}
			onChange={(newValues) => {
				skeletonViewersSig()
				skeletonViewersSig().forEach((viewer) => {
					viewer.setAnimationTime(newValues[0])
				})
				// myScene.setAnimationTime(newValues[0])
				setCurrentAnimationTime(newValues[0])
				setPlayPressed(true)
			}}
			maxValue={animationDuration()}
			step={0.011}
			getValueLabel={() => `${Math.round(currentAnimationTime() * 90)}`}
		>
			<div class="SliderLabel">
				<Slider.Label>frame: </Slider.Label>
				<Slider.ValueLabel>
					{Math.round(currentAnimationTime() * 90)} frames
				</Slider.ValueLabel>
			</div>
			<Slider.Track class="SliderTrack">
				<Slider.Fill class="SliderRange" />
				<Slider.Thumb class="SliderThumb">
					<Slider.Input />
				</Slider.Thumb>
			</Slider.Track>
		</Slider.Root>
	)
}

export { SliderBasic }
