import { createEffect, createSignal } from "solid-js"
import { createPlot2D, createPlot3D, updatePlot2D, updatePlot3D } from "./plots"

import BaseScene from "./BaseScene.js"
import SkeletonViewer from "./SkeletonViewer.js"
import {
	setLoadingDone,
	setBaseScene,
	skeletonsArray,
	skeletonViewersSig,
	setSkeletonViewersSig,
	currentAnimationTime,
	setCurrentAnimationTime,
	animationDuration,
	setAnimationDuration,
	bonesList,
	setBonesList,
	setSelectedValue,
	setPositionsX_2D,
	setPositionsY_2D,
	setPositionsZ_2D,
	setPositionsX_3D,
	setPositionsY_3D,
	setPositionsZ_3D,
	mode2DPlot,
	mode3DPlot,
	selectedJoint,
	setSelectedJoint,
	setName2DPlot,
	setName3DPlot,
	toggleValue,
	checkboxValue,
	setPlayPressed,
	setInputGOM,
	selectedValue,
} from "./store"

const [mixersCount, setMixersCount] = createSignal(0)

async function initialize() {
	let isChanged = false
	let isBonesListReady = false
	const scene = new BaseScene("threePanel")
	setBaseScene(scene)

	await scene.onWindowResize()

	let skeletonViewers = [] // Store the current skeleton viewers

	// Function to reload all skeleton viewers
	const reloadSkeletonViewers = async () => {
		console.log("Reloading skeleton viewers...")
		setSelectedJoint("Hips")
		setSelectedValue("Hips")

		// Remove all existing skeletons
		skeletonViewers.forEach((viewer, index) => {
			// Remove sphereMeshes
			if (viewer.sphereMeshes) {
				if (Array.isArray(viewer.sphereMeshes)) {
					viewer.sphereMeshes.forEach((mesh) =>
						scene.scene.remove(mesh)
					)
				} else {
					scene.scene.remove(viewer.sphereMeshes)
				}
			}

			// Remove lineMeshes
			if (viewer.lineMeshes) {
				if (Array.isArray(viewer.lineMeshes)) {
					viewer.lineMeshes.forEach((mesh) =>
						scene.scene.remove(mesh)
					)
				} else {
					scene.scene.remove(viewer.lineMeshes)
				}
			}

			// Properly dispose of newParent and remove it from the scene
			if (viewer.newParent) {
				viewer.newParent.traverse((child) => {
					if (child.geometry) {
						child.geometry.dispose()
					}
					if (child.material) {
						if (Array.isArray(child.material)) {
							child.material.forEach((mat) => mat.dispose())
						} else {
							child.material.dispose()
						}
					}
				})

				// Remove newParent from the scene
				if (viewer.newParent.parent) {
					viewer.newParent.parent.remove(viewer.newParent)
				}

				// Optional: Set newParent to null to avoid references
				viewer.newParent = null
			}
		})

		console.log("✅ Old skeleton removed successfully!")

		skeletonViewers = [] // Clear the viewers array

		// Add skeletons from skeletonsArray
		const currentSkeletons = skeletonsArray().filter(
			(skeleton) => skeleton.fileName && skeleton.fileName.trim() !== ""
		)

		for (const skeleton of currentSkeletons) {
			const viewer = new SkeletonViewer(scene.scene)
			viewer.skeletonPath = skeleton.fileName

			console.log(`Loading skeleton: ${skeleton.fileName}`)
			await viewer.loadSkeleton(skeleton.fileName) // Wait for the skeleton to load
			viewer.label = skeleton.label[skeleton.label.length - 1]
			viewer.plotLabel = skeleton.label

			skeletonViewers.push(viewer) // Add the viewer to the array
		}

		console.log("Skeleton viewers reloaded:", skeletonViewers)
		setSkeletonViewersSig(skeletonViewers)
		console.log("joints and values: ", selectedJoint(), selectedValue())
	}

	// Initial load of skeleton viewers
	// await reloadSkeletonViewers()

	setLoadingDone(true)

	function getMaxDuration() {
		let maxDuration = 0 // Variable to keep track of the maximum duration

		skeletonViewers.forEach((viewer) => {
			const duration = viewer.getAnimationDuration() // Get the animation duration
			console.log(`Current viewer duration: ${duration}`) // Log each duration for debugging
			maxDuration = Math.max(maxDuration, duration) // Update the maximum duration if this one is larger
		})

		console.log("Final maximum animation duration:", maxDuration)
		setAnimationDuration(maxDuration) // Update the state with the maximum duration
	}

	function getBonesList() {
		setBonesList(formatBoneNames(skeletonViewers[0].boneHierarchy))
		setSelectedValue(bonesList()[0])
		setSelectedJoint(skeletonViewers[0].boneHierarchy[0].name)

		console.log(
			"setSelectedJointsetSelectedJoint: ",
			selectedJoint(),
			bonesList()[0],
			skeletonViewers[0].boneHierarchy[0]
		)
	}
	// Animation loop
	scene.animate = function () {
		requestAnimationFrame(() => this.animate())
		this.renderer.clear()
		this.stats.update()
		const delta = this.clock.getDelta()

		if (isChanged) {
			setMixersCount(
				skeletonViewers.filter((viewer) => viewer.mixer).length
			) // Count viewers with mixer

			if (mixersCount() === skeletonViewers.length) {
				let maxDuration = 0
				let viewerWithMaxDuration = null

				// Find the viewer with the maximum duration
				skeletonViewers.forEach((viewer) => {
					const duration = viewer.getAnimationDuration()
					if (duration > maxDuration) {
						maxDuration = duration
						viewerWithMaxDuration = viewer
					}
				})
			}
		}
		if (mixersCount() === skeletonViewers.length && mixersCount() > 0) {
			// Update all skeleton viewers
			skeletonViewers.forEach((viewer) => {
				viewer.update(delta)

				if (isChanged) {
					getMaxDuration()
					isChanged = false
				}

				// Only set animation time for the viewer with the maximum duration
				if (viewer.getAnimationDuration() === animationDuration()) {
					setCurrentAnimationTime(viewer.action.time)
				}
			})
		}
		if (isBonesListReady && skeletonViewers.length > 0) {
			if (skeletonViewers[0].boneHierarchy.length > 0) {
				getBonesList()
				console.log("run Initialiaze PLOTs")
				initializeWhenLoaded(true)
				skeletonViewers.forEach((viewer) => {
					viewer.mixer.setTime(0)
					viewer.mixer.timeScale = 0
					viewer.addListeners()
				})

				isBonesListReady = false
				setPlayPressed(true)
			}
		}

		this.gpuPanel.startQuery()
		this.renderer.render(this.scene, this.camera)
		this.gpuPanel.endQuery()
		this.controls.update()
	}

	// Start the animation loop
	scene.animate()

	// Watch for changes in skeletonsArray and reload viewers
	createEffect(async () => {
		console.log("Detected change in skeletonsArray: ", skeletonsArray())
		await reloadSkeletonViewers() // Reload all skeletons on every change
		isChanged = true
		isBonesListReady = true
	})
}

async function clearEverything(file, label) {
	console.log("Clearing and loading new skeleton: ", file)
	const groupLabel = label || `Skeleton ${skeletonsArray().length + 1}`

	// You can optionally modify the skeletonsArray here if needed
}

async function loadFile(file, label) {
	await clearEverything(file, label) // Clear current scene and load a new file for the given label
}
function formatBoneNames(bones) {
	return bones.map((bone) => {
		const level = bone.depth // Assume each bone object has a 'depth' property
		const prefix = "-".repeat(level * 1) // Create indentation based on depth (4 spaces per level)
		return `•${prefix}${bone.name}` // Return only the formatted name with indentation
	})
}
function extractJointNames(variables) {
	const jointNames = [
		"Spine",
		"Spine1",
		"Spine2",
		"Spine3",
		"Hips",
		"Neck",
		"Head",
		"LeftArm",
		"LeftForeArm",
		"RightArm",
		"RightForeArm",
		"LeftShoulder",
		"LeftShoulder2",
		"RightShoulder",
		"RightShoulder2",
		"LeftUpLeg",
		"LeftLeg",
		"RightUpLeg",
		"RightLeg",
	]

	return variables.filter((variable) =>
		jointNames.some((joint) => variable.includes(joint))
	)
}

async function dataframe_creation() {
	console.log("start_dataframe_creation")
	let [val] = await skeletonViewersSig()[0].createDataframes()

	setInputGOM(val)
	console.log("finish_dataframe_creation")
}
async function initializeWhenLoaded(isDataFrameOn = false) {
	skeletonViewersSig().forEach((viewer) => {
		viewer.mixer.timeScale = 1
	})
	await preparePlotsData()

	if (isDataFrameOn) {
		// dataframe_creation()
	}
	// myScene.mixer.timeScale = 0

	// myScene.clonedMixer.timeScale = 0
	// await myScene.animate()
	// console.log("PreparePLotsDataAgaiin???", selectedJoint())

	createPlot2D(0, toggleValue())
	createPlot3D(0)

	skeletonViewersSig().forEach((viewer) => {
		viewer.mixer.timeScale = 0
	})

	if (!checkboxValue()) {
		setLoadingDone(true)
	}

	async function preparePlotsData() {
		console.log("PreparePlotsData")

		// Arrays to store data for all viewers
		const positionsX_2D_All = []
		const positionsY_2D_All = []
		const positionsZ_2D_All = []
		const positionsX_3D_All = []
		const positionsY_3D_All = []
		const positionsZ_3D_All = []
		const labels = [] // To store plotLabels for all viewers

		// Iterate through each viewer
		skeletonViewersSig().forEach((viewer, index) => {
			const [
				originalPositionsX,
				originalPositionsY,
				originalPositionsZ,
				originalAnglesX,
				originalAnglesY,
				originalAnglesZ,
			] = viewer.getTimeSeries("Hips")
			console.log("check skeleton:")

			// Store the plotLabel
			const label = viewer.plotLabel || `Viewer ${index + 1}`
			labels.push(label)

			if (mode2DPlot() === false) {
				positionsX_2D_All.push([...originalPositionsX])
				positionsY_2D_All.push([...originalPositionsY])
				positionsZ_2D_All.push([...originalPositionsZ])
			} else {
				positionsX_2D_All.push([...originalAnglesX])
				positionsY_2D_All.push([...originalAnglesY])
				positionsZ_2D_All.push([...originalAnglesZ])
			}

			if (mode3DPlot() === false) {
				positionsX_3D_All.push([...originalPositionsX])
				positionsY_3D_All.push([...originalPositionsY])
				positionsZ_3D_All.push([...originalPositionsZ])
			} else {
				positionsX_3D_All.push([...originalAnglesX])
				positionsY_3D_All.push([...originalAnglesY])
				positionsZ_3D_All.push([...originalAnglesZ])
			}

			originalPositionsX.length = 0
			originalPositionsY.length = 0
			originalPositionsZ.length = 0
			originalAnglesX.length = 0
			originalAnglesY.length = 0
			originalAnglesZ.length = 0
		})

		// Keep "Position" and "Angle" names
		if (mode2DPlot() === false) {
			setName2DPlot("Position")
		} else {
			setName2DPlot("Angle")
		}

		if (mode3DPlot() === false) {
			setName3DPlot("Position")
		} else {
			setName3DPlot("Angle")
		}

		// Create new arrays before passing to set functions
		setPositionsX_2D([...positionsX_2D_All])
		setPositionsY_2D([...positionsY_2D_All])
		setPositionsZ_2D([...positionsZ_2D_All])

		setPositionsX_3D([...positionsX_3D_All])
		setPositionsY_3D([...positionsY_3D_All])
		setPositionsZ_3D([...positionsZ_3D_All])

		// Log labels for debugging
		console.log("Labels for all viewers:", labels)

		// Free memory by clearing arrays
		positionsX_2D_All.length = 0
		positionsY_2D_All.length = 0
		positionsZ_2D_All.length = 0
		positionsX_3D_All.length = 0
		positionsY_3D_All.length = 0
		positionsZ_3D_All.length = 0
		labels.length = 0

		console.log("Memory freed for arrays.")
	}

	// async function preparePlotsData() {
	// 	console.log("PreparePLotsData")
	// 	const [
	// 		originalPositionsX,
	// 		originalPositionsY,
	// 		originalPositionsZ,
	// 		originalAnglesX,
	// 		originalAnglesY,
	// 		originalAnglesZ,
	// 	] = skeletonViewersSig()[0].getTimeSeries("Hips")

	// 	if (mode2DPlot() === false) {
	// 		setName2DPlot("Position")
	// 		setPositionsX_2D([...originalPositionsX])
	// 		setPositionsY_2D([...originalPositionsY])
	// 		setPositionsZ_2D([...originalPositionsZ])
	// 	} else {
	// 		setName2DPlot("Angle")
	// 		setPositionsX_2D([...originalAnglesX])
	// 		setPositionsY_2D([...originalAnglesY])
	// 		setPositionsZ_2D([...originalAnglesZ])
	// 	}

	// 	if (mode3DPlot() === false) {
	// 		setName3DPlot("Position")
	// 		setPositionsX_3D([...originalPositionsX])
	// 		setPositionsY_3D([...originalPositionsY])
	// 		setPositionsZ_3D([...originalPositionsZ])
	// 	} else {
	// 		setName3DPlot("Angle")
	// 		setPositionsX_3D([...originalAnglesX])
	// 		setPositionsY_3D([...originalAnglesY])
	// 		setPositionsZ_3D([...originalAnglesZ])
	// 	}
	// }
}

export {
	loadFile,
	initialize,
	initializeWhenLoaded,
	formatBoneNames,
	extractJointNames,
}
