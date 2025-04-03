// SkeletonViewer.js
import * as THREE from "three"
import { BVHLoader } from "../../build/BVHLoader.js"
import Stats from "../../build/stats.module.js"
import { GPUStatsPanel } from "../../build/GPUStatsPanel.js"

import { Line2 } from "../../build/lines/Line2.js"
import { LineMaterial } from "../../build/lines/LineMaterial.js"
import { LineGeometry } from "../../build/lines/LineGeometry.js"

import {
	selectedJoint,
	scaleX,
	scaleY,
	setSelectedJoint,
	setSelectedValue,
	bonesList,
	playPressed,
	setPlayPressed,
	baseScene,
	toolTipVisibility,
	setToolTipVisibility,
	setSpeedData2D,
	setSpeedData3D,
	motionMetric,
	setAccelerationDataX,
	setAccelerationDataY,
	setAccelerationDataZ,
	setAccelerationDataNorm,
	setJerkDataX,
	setJerkDataY,
	setJerkDataZ,
	setJerkDataNorm
} from "./store.js"

class SkeletonViewer {
	constructor(scene) {
		this.scene = scene // Shared scene from BaseScene
		this.mixer = null
		this.action = null
		this.globalResult = null
		this.animationClip = null

		this.sphereMeshes = new THREE.Group()
		this.lineMeshes = new THREE.Group()
		this.newParent = new THREE.Group()

		this.boneNames = []
		this.boneHierarchy = []
		this.jointIndex = null
		this.positions = new Float32Array([1, 1, 1, 1, 1, 1])

		this.matLine = new LineMaterial({
			color: 0x000000,
			linewidth: 1,
			worldUnits: true,
		})

		this.startPosition = new THREE.Vector3()
		this.endPosition = new THREE.Vector3()

		this.newPosition = new THREE.Vector3(0, 0, 0)
		this.label = null
		this.plotLabel = null
		
		// Geometric descriptors
		this.boundingBox = null
		this.boundingSphere = null
		this.boundingEllipsoid = null
		this.descriptorsGroup = new THREE.Group()
		this.activeDescriptor = 'none' // 'none', 'box', 'sphere', 'ellipsoid'
	}

	loadSkeleton(bvhFile) {
		const loader = new BVHLoader()
		
		// Store current descriptor type before cleaning up
		const currentDescriptorType = this.activeDescriptor
		
		// Completely remove any existing descriptors from the scene
		this.cleanupDescriptors(true)
		
		// Remove descriptors group from scene and parent
		if (this.descriptorsGroup) {
			if (this.scene.children.includes(this.descriptorsGroup)) {
				this.scene.remove(this.descriptorsGroup)
			}
			if (this.newParent && this.newParent.children.includes(this.descriptorsGroup)) {
				this.newParent.remove(this.descriptorsGroup)
			}
			
			// Create a fresh descriptor group
			this.descriptorsGroup = new THREE.Group()
		}

		loader.load(bvhFile, (result) => {
			// const skeletonHelper = new THREE.SkeletonHelper(
			// 	result.skeleton.bones[0]
			// )
			// this.addListeners()

			this.globalResult = result // Store the result for use within other methods

			this.animationClip = result.clip // Storing the clip in the global scope for later use

			const fps = 90 // Define the frames per second
			const framesToCut = 5
			const timeToCut = framesToCut / fps
			// Example usage:
			this.cutFirstFrames(result.clip, timeToCut)
			this.setupMixer(result) // Setup the animation mixer with the modified result

			const frameNumber = 1 // Initial frame
			const timeInSeconds = frameNumber / fps // Convert frame number to seconds
			this.mixer.setTime(timeInSeconds) // Set the mixer time

			// // Add skeleton bones and helper to the shared scene
			// this.scene.add(result.skeleton.bones[0])
			// this.scene.add(skeletonHelper)

			// // Create animation mixer and play the animation
			// this.mixer = new THREE.AnimationMixer(result.skeleton.bones[0])
			// this.mixer.clipAction(result.clip).play()

			setTimeout(() => {
				this.createSphereMeshes() // Create visual representations for bones
				this.createBoneMeshes() // Optionally create visual representations for bone connections

				//this.animate(); // Start the animation loop
			}, 1000) // Delay to ensure everything is set up properly

			setTimeout(() => {
				this.reCenter() // Start the animation loop
				
				// Re-apply the geometric descriptor after everything is loaded
				if (currentDescriptorType !== 'none') {
					setTimeout(() => {
						console.log(`Re-applying descriptor: ${currentDescriptorType}`)
						this.setActiveDescriptor(currentDescriptorType)
					}, 500)
				}
			}, 1000) // Delay to ensure everything is set up properly
		})
	}

	// Cleanup existing descriptors
	cleanupDescriptors(fullCleanup = false) {
		console.log("Cleaning up descriptors", fullCleanup ? "(full cleanup)" : "")
		
		// Remove all existing descriptors
		if (this.descriptorsGroup) {
			while (this.descriptorsGroup.children.length > 0) {
				const object = this.descriptorsGroup.children[0]
				this.descriptorsGroup.remove(object)
                
                // Dispose of geometries and materials to prevent memory leaks
                if (object.geometry) object.geometry.dispose()
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose())
                    } else {
                        object.material.dispose()
                    }
                }
			}
		}

		// Reset references
		this.boundingBox = null
		this.boundingSphere = null
		this.boundingEllipsoid = null
		
		if (!fullCleanup) {
			// Just keep track of the current descriptor type without immediate recreation
			return
		}
        
        // For full cleanup, reset the active descriptor state
        this.activeDescriptor = 'none'
	}

	// Setup the animation mixer
	async setupMixer(result) {
		this.mixer = new THREE.AnimationMixer(result.skeleton.bones[0]) // Create an animation mixer
		this.action = this.mixer.clipAction(result.clip) // Get the action from the clip
		this.action.play() // Play the action
		this.action.clampWhenFinished = false
	}

	cutFirstFrames(clip, timeToCut) {
		clip.tracks.forEach((track) => {
			// Filter out keyframes that are within the time to cut
			let times = track.times
			let values = track.values
			let stride = values.length / times.length

			let startIndex = times.findIndex((time) => time >= timeToCut)
			if (startIndex === -1) {
				// No keyframes after the cut time
				startIndex = times.length
			}

			track.times = times
				.slice(startIndex)
				.map((time) => time - timeToCut)
			track.values = values.slice(startIndex * stride)
		})

		// Adjust the duration of the clip
		clip.duration -= timeToCut
	}

	// Utility method for creating sphere meshes, assuming you're visualizing joints or similar
	async createSphereMeshes() {
		let geometry
		// this.scene.add(this.sphereMeshes) // Add the group to the scene

		// Helper function to calculate depth
		function calculateDepth(bone) {
			let depth = 0
			let currentBone = bone
			while (currentBone.parent && currentBone.parent.type !== "Scene") {
				currentBone = currentBone.parent
				depth++
			}
			return depth
		}

		function endsWithNumber(str) {
			return /\d+$/.test(str)
		}

		function endsWithEnd(str) {
			return /end$/.test(str)
		}

		// await this.globalResult.skeleton.bones.forEach((bone, index, array) => {
		// 	const depth = calculateDepth(bone) // Calculate the depth based on parent chain
		// 	if (bone.name === "ENDSITE" && index > 0) {
		// 		const previousBoneName = array[index - 1].name
		// 		bone.name = `${previousBoneName}_end`
		// 	}

		// 	if (
		// 		bone.name === "LeftFootToe_end" ||
		// 		bone.name === "RightFootToe_end"
		// 	) {
		// 		geometry = new THREE.SphereGeometry(0, 32, 32)
		// 	} else if (depth >= 9) {
		// 		geometry = new THREE.SphereGeometry(1.2, 32, 32)
		// 	} else {
		// 		geometry = new THREE.SphereGeometry(3, 32, 32)
		// 	}

		// 	const material = new THREE.MeshBasicMaterial({ color: 0x145e9f })
		// 	const sphere = new THREE.Mesh(geometry, material)

		// 	sphere.name = bone.name
		// 	bone.getWorldPosition(sphere.position)

		// 	this.sphereMeshes.add(sphere)
		// 	this.boneNames.push(bone.name)
		// 	if (!bone.name.endsWith("end")) {
		// 		this.boneHierarchy.push({ name: bone.name, depth: depth }) // Add the bone and its depth to the hierarchy list
		// 	}
		// })

		// Περιμένουμε να ολοκληρωθούν όλες οι προσθήκες σφαιρών
		await Promise.all(
			this.globalResult.skeleton.bones.map(async (bone, index, array) => {
				const depth = calculateDepth(bone)

				if (bone.name === "ENDSITE" && index > 0) {
					const previousBoneName = array[index - 1].name
					bone.name = `${previousBoneName}_end`
				}

				if (
					bone.name === "LeftFootToe_end" ||
					bone.name === "RightFootToe_end"
				) {
					geometry = new THREE.SphereGeometry(0, 32, 32)
				} else if (depth >= 9) {
					geometry = new THREE.SphereGeometry(1.2, 32, 32)
					// } else if (
					// 	endsWithNumber(bone.name) ||
					// 	endsWithEnd(bone.name)
					geometry = new THREE.SphereGeometry(1.2, 32, 32)
				} else {
					geometry = new THREE.SphereGeometry(3, 32, 32)
				}

				const material = new THREE.MeshBasicMaterial({
					color: 0x145e9f,
				})
				const sphere = new THREE.Mesh(geometry, material)

				sphere.name = bone.name
				bone.getWorldPosition(sphere.position)

				this.sphereMeshes.add(sphere)
				this.boneNames.push(bone.name)
				if (!bone.name.endsWith("end")) {
					this.boneHierarchy.push({ name: bone.name, depth: depth })
				}
			})
		)

		// Creating a map of bone names to their indices for quick lookup
		this.jointIndex = this.boneNames.reduce((acc, bone, index) => {
			acc[bone] = index
			return acc
		}, {})

		this.boneIndex = this.boneNames.reduce((acc, bone, index) => {
			// Check if the bone name ends with '_end'
			if (bone.endsWith("_end")) {
				return acc // Skip this bone and do not increment the index for the next bone
			}

			acc[bone] = acc.hasOwnProperty("lastIndex")
				? acc["lastIndex"] + 1
				: index // Use lastIndex if it exists, otherwise use the current index
			acc["lastIndex"] = acc[bone] // Update lastIndex to the current bone's index
			return acc
		}, {})

		// Clean up the auxiliary property once indexing is complete
		delete this.boneIndex["lastIndex"]

		await new Promise((resolve) => setTimeout(resolve, 50)) // Μικρή καθυστέρηση

		this.sphereMeshes.children[
			this.jointIndex[selectedJoint()]
		].material.color.set("red") // Set specific joint color to red
	}

	createBoneMeshes() {
		// this.scene.add(this.lineMeshes)

		this.globalResult.skeleton.bones.forEach((bone) => {
			const lineGeometry = new LineGeometry()
			// Assuming positions is a property of myScene, like this.positions
			lineGeometry.setPositions(this.positions)

			const lineMesh = new Line2(lineGeometry, this.matLine)
			lineMesh.frustumCulled = false

			lineMesh.computeLineDistances()
			lineMesh.scale.set(1, 1, 1)
			this.matLine.linewidth = 2

			if (bone.parent) {
				bone.getWorldPosition(this.startPosition)
				bone.parent.getWorldPosition(this.endPosition)
				this.positions.set(
					[
						this.startPosition.x,
						this.startPosition.y,
						this.startPosition.z,
						this.endPosition.x,
						this.endPosition.y,
						this.endPosition.z,
					],
					0
				)

				if (bone.name === "Hips") {
					lineMesh.visible = false
				}
				if (bone.name === "Spine") {
					lineMesh.visible = false
				}

				lineMesh.geometry.setPositions(this.positions)
				this.lineMeshes.add(lineMesh)
			}
		})
	}

	updateSpherePositions() {
		this.globalResult.skeleton.bones.forEach((bone, index) => {
			if (this.sphereMeshes.children[index]) {
				bone.getWorldPosition(
					this.sphereMeshes.children[index].position
				)
			}
		})
	}

	updateLinePositions() {
		this.globalResult.skeleton.bones.forEach((bone, index) => {
			//console.log(bone, index);
			if (bone.parent && this.lineMeshes.children[index]) {
				bone.getWorldPosition(this.startPosition)
				bone.parent.getWorldPosition(this.endPosition)

				const line = this.lineMeshes.children[index]
				if (line && line.geometry instanceof LineGeometry) {
					line.geometry.attributes.instanceStart.setXYZ(
						0,
						this.startPosition.x,
						this.startPosition.y,
						this.startPosition.z
					)
					line.geometry.attributes.instanceEnd.setXYZ(
						0,
						this.endPosition.x,
						this.endPosition.y,
						this.endPosition.z
					)
					line.geometry.attributes.instanceStart.needsUpdate = true
					line.geometry.attributes.instanceEnd.needsUpdate = true
				} else {
					console.error(
						"LineGeometry or lineMesh not found or invalid for index:",
						index
					)
				}
			}
		})
	}

	reCenter() {
		this.globalResult.skeleton.bones[0].scale.set(0.5, 0.5, 0.5)
		this.mixer.timeScale = 0
		this.mixer.setTime(0) // Set the time in the mixer to update the skeleton state

		// this.globalResult.skeleton.bones[0].getWorldPosition(this.newPosition) // Get the new position
		let minDistance = Infinity
		let closestBone = null

		// this.newPosition.y -= 200 // Adjust Y position

		this.globalResult.skeleton.bones.forEach((bone) => {
			let boneWorldPosition = new THREE.Vector3()
			bone.getWorldPosition(boneWorldPosition)
			let distance = Math.abs(boneWorldPosition.y - this.newPosition.y)
			if (distance < minDistance) {
				minDistance = distance
				closestBone = bone
			}
		})
		// console.log("minDistance: ", minDistance)
		// console.log("closestBone: ", closestBone)

		this.displacement = new THREE.Vector3().subVectors(
			this.newPosition,
			this.globalResult.skeleton.bones[0].position
		) // Calculate displacement
		this.displacement.y += minDistance // Adjust Y position

		// console.log("displacement: ", this.displacement)
		// console.log("sphereMeshes: ", this.sphereMeshes.children[0])

		this.sphereMeshes.position.add(this.displacement)
		this.lineMeshes.position.add(this.displacement)

		// Retrieve the child mesh by name
		const childMesh = this.sphereMeshes.getObjectByName(closestBone.name)
		// console.log("childnameLlllll", childMesh)

		if (childMesh) {
			// Create vectors for positions
			const worldPositionSphere = new THREE.Vector3()
			const worldPositionBone = new THREE.Vector3()
			const origin = new THREE.Vector3(0, 0, 0)

			// Get the world position of the childMesh (the sphere) and closestBone
			closestBone.getWorldPosition(worldPositionBone)
			childMesh.getWorldPosition(worldPositionSphere)

			// Compute the distance between the sphere and the origin (0, 0, 0) on the y-axis
			const distanceToOriginY = worldPositionSphere.y - origin.y

			// Compute the distance between the sphere and the closestBone on the y-axis
			const distanceToBoneY = worldPositionSphere.y - worldPositionBone.y

			// You can add or subtract these distances based on your need
			const totalDistanceY = -distanceToOriginY + distanceToBoneY / 2
			// const totalDistanceY = -distanceToOriginY  ( incase you want scale=1) !!!!!!

			// Log the results for y-axis distances
			console.log(
				"Distance from sphere to origin (y-axis):",
				distanceToOriginY
			)
			console.log(
				"Distance from sphere to closestBone (y-axis):",
				distanceToBoneY
			)
			console.log("Total Distance (y-axis, addition):", totalDistanceY)

			// If you want to move the sphereMeshes based on this total distance for the y-axis
			this.sphereMeshes.position.add(
				new THREE.Vector3(0, totalDistanceY, 0)
			)

			this.lineMeshes.position.add(
				new THREE.Vector3(0, totalDistanceY, 0)
			)

			// 1. Create a new parent group
			// const newParent = new THREE.Group()

			// 4. Add sphereMeshes to the new parent
			this.newParent.add(this.sphereMeshes)
			this.newParent.add(this.lineMeshes)
			
			// Add the descriptors group to the new parent too and reset it
			if (this.descriptorsGroup) {
				// Remove from scene if it was added directly
				if (this.scene.children.includes(this.descriptorsGroup)) {
					this.scene.remove(this.descriptorsGroup);
					}
				
				// Make sure we start with a clean group
				this.descriptorsGroup.position.set(0, 0, 0);
				this.descriptorsGroup.rotation.set(0, 0, 0);
				this.descriptorsGroup.scale.set(1, 1, 1);
				
				// Add to the new parent
				this.newParent.add(this.descriptorsGroup)
				
				// Re-apply the current descriptor if any
				if (this.activeDescriptor !== 'none') {
					this.setActiveDescriptor(this.activeDescriptor)
				}
			}

			// 6. Replace sphereMeshes in the scene with the new parent
			this.scene.add(this.newParent)

			// // 1. Get the root bone (Hips)
			// const rootBone = this.globalResult.skeleton.bones[0]

			// // 3. Get the local rotation of Hips (Euler angles)
			// const localRotationHips = rootBone.rotation.clone()

			// // 4. Compute the inverse rotation (i.e., subtract the rotation of Hips)
			// const correctedRotation = new THREE.Euler(
			// 	0,
			// 	-localRotationHips.y,
			// 	0
			// )

			// // 5. Apply this difference to the spheres
			// newParent.rotation.copy(correctedRotation)

			// 1. Get the root bone (Hips)
			const rootBone = this.globalResult.skeleton.bones[0]

			// 2. Get the local rotation of Hips (Euler angles)
			const localRotationHips = rootBone.rotation.clone()

			// 3. Compute the actual forward direction of Hips
			const hipsDirection = new THREE.Vector3(0, 0, -1) // Default forward (-Z)
			hipsDirection.applyEuler(localRotationHips) // Apply the current Hips rotation

			// 4. Compute the correct Y rotation to align it with the standard forward (-Z)
			const angleY = Math.atan2(hipsDirection.x, hipsDirection.z) // Compute rotation angle

			// 5. Apply the corrected rotation
			const correctedRotation = new THREE.Euler(0, -angleY, 0)
			this.newParent.rotation.copy(correctedRotation)

			console.log(
				"✅ Local rotation of Hips applied to sphereMeshes without position shifting."
			)

			console.log(
				"hips rotation before: ",

				this.globalResult.skeleton.bones[10].rotation
			)
			console.log(
				"hips rotation after: ",
				this.sphereMeshes.children[10].rotation
			)
			console.log("hips rotation after: ", this.sphereMeshes.children[10])
		}
	}

	calculateSpeed() {
		const index = this.jointIndex[selectedJoint()]
		let skeleton = this.globalResult.skeleton
		let bone = skeleton.bones[index]
		if (!bone) {
			console.error("Bone not found for speed calculation")
			return
		}
		
		let jointAnimationClip = this.animationClip
		const baseIndex = this.boneIndex[selectedJoint()] * 2
		let rotationTrack = jointAnimationClip.tracks[baseIndex + 1]
		if (!rotationTrack) {
			console.error("No rotation track found for speed calculation")
			return
		}
		
		let speeds2D = []
		let speeds3D = []
		let positions = []
		let frameTime = 1/90 // Time between frames in seconds
		
		// First, collect all positions at each time point
		for (let i = 0; i < rotationTrack.times.length; i++) {
			let time = rotationTrack.times[i]
			this.mixer.setTime(time)
			this.mixer.update(frameTime)
			bone.updateMatrixWorld(true)
			
			let worldPosition = new THREE.Vector3()
			bone.getWorldPosition(worldPosition)
			positions.push(worldPosition.clone())
		}
		
		// Now calculate velocities and speeds using equations 3 and 4
		for (let i = 0; i < positions.length; i++) {
			if (i > 0 && i < positions.length - 1) {
				// Equation 3: v^k(t_i) = (x^k(t_{i+1}) - x^k(t_{i-1})) / (2δt)
				let prevPos = positions[i-1]
				let nextPos = positions[i+1]
				let deltaTime = frameTime * 2
				
				// Calculate velocity vector components
				const vx = (nextPos.x - prevPos.x) / deltaTime
				const vy = (nextPos.y - prevPos.y) / deltaTime
				const vz = (nextPos.z - prevPos.z) / deltaTime
				
				// Equation 4: v^k(t_i) = sqrt(v_x^k(t_i)^2 + v_y^k(t_i)^2 + v_z^k(t_i)^2)
				const velocity3D = Math.sqrt(vx*vx + vy*vy + vz*vz)
				
				// Calculate planar (XZ) velocity - horizontal movement
				const velocity2D = Math.sqrt(vx*vx + vz*vz)
				
				speeds2D.push(velocity2D)
				speeds3D.push(velocity3D)
			} else {
				// For boundary points, use one-sided differences or set to 0
				if (i === 0 && positions.length > 1) {
					// Forward difference for first point
					let deltaTime = frameTime
					const vx = (positions[1].x - positions[0].x) / deltaTime
					const vy = (positions[1].y - positions[0].y) / deltaTime
					const vz = (positions[1].z - positions[0].z) / deltaTime
					
					const velocity3D = Math.sqrt(vx*vx + vy*vy + vz*vz)
					const velocity2D = Math.sqrt(vx*vx + vz*vz)
					
					speeds2D.push(velocity2D)
					speeds3D.push(velocity3D)
				} else if (i === positions.length - 1 && positions.length > 1) {
					// Backward difference for last point
					let deltaTime = frameTime
					const vx = (positions[i].x - positions[i-1].x) / deltaTime
					const vy = (positions[i].y - positions[i-1].y) / deltaTime
					const vz = (positions[i].z - positions[i-1].z) / deltaTime
					
					const velocity3D = Math.sqrt(vx*vx + vy*vy + vz*vz)
					const velocity2D = Math.sqrt(vx*vx + vz*vz)
					
					speeds2D.push(velocity2D)
					speeds3D.push(velocity3D)
				} else {
					// If there's only one point or something went wrong
					speeds2D.push(0)
					speeds3D.push(0)
				}
			}
		}
		
		setSpeedData2D(speeds2D)
		setSpeedData3D(speeds3D)
	}

	calculateAcceleration() {
        const index = this.jointIndex[selectedJoint()]
        let skeleton = this.globalResult.skeleton
        let bone = skeleton.bones[index]
        if (!bone) {
            console.error("Bone not found for acceleration calculation")
            return
        }
        
        let jointAnimationClip = this.animationClip
        const baseIndex = this.boneIndex[selectedJoint()] * 2
        let rotationTrack = jointAnimationClip.tracks[baseIndex + 1]
        if (!rotationTrack) {
            console.error("No rotation track found for acceleration calculation")
            return
        }
        
        let accX = []
        let accY = []
        let accZ = []
        let accNorm = []
        let positions = []
        const frameTime = 1/90 // Time between frames in seconds
        const deltaT2 = frameTime * frameTime // δt²
        
        // First, collect all positions at each time point
        for (let i = 0; i < rotationTrack.times.length; i++) {
            let time = rotationTrack.times[i]
            this.mixer.setTime(time)
            this.mixer.update(frameTime)
            bone.updateMatrixWorld(true)
            
            let worldPosition = new THREE.Vector3()
            bone.getWorldPosition(worldPosition)
            positions.push(worldPosition.clone())
        }
        
        // Now calculate accelerations using equations 5 and 6
        for (let i = 0; i < positions.length; i++) {
            if (i > 0 && i < positions.length - 1) {
                // Equation 5: a^k(t_i) = (x^k(t_{i+1}) - 2x^k(t_i) + x^k(t_{i-1})) / δt²
                const prevPos = positions[i-1]
                const currPos = positions[i]
                const nextPos = positions[i+1]
                
                // Calculate acceleration vector components
                const ax = (nextPos.x - 2 * currPos.x + prevPos.x) / deltaT2
                const ay = (nextPos.y - 2 * currPos.y + prevPos.y) / deltaT2
                const az = (nextPos.z - 2 * currPos.z + prevPos.z) / deltaT2
                
                // Equation 6: a^k(t_i) = sqrt(a_x^k(t_i)^2 + a_y^k(t_i)^2 + a_z^k(t_i)^2)
                const accelerationNorm = Math.sqrt(ax*ax + ay*ay + az*az)
                
                accX.push(ax)
                accY.push(ay)
                accZ.push(az)
                accNorm.push(accelerationNorm)
            } else {
                // For boundary points, we can either use one-sided approximations
                // or just set to 0 for simplicity
                accX.push(0)
                accY.push(0)
                accZ.push(0)
                accNorm.push(0)
            }
        }
        
        setAccelerationDataX(accX)
        setAccelerationDataY(accY)
        setAccelerationDataZ(accZ)
        setAccelerationDataNorm(accNorm)
    }

    calculateJerk() {
        const index = this.jointIndex[selectedJoint()]
        let skeleton = this.globalResult.skeleton
        let bone = skeleton.bones[index]
        if (!bone) {
            console.error("Bone not found for jerk calculation")
            return
        }
        
        let jointAnimationClip = this.animationClip
        const baseIndex = this.boneIndex[selectedJoint()] * 2
        let rotationTrack = jointAnimationClip.tracks[baseIndex + 1]
        if (!rotationTrack) {
            console.error("No rotation track found for jerk calculation")
            return
        }
        
        let positions = []
        const frameTime = 1/90 // Time between frames in seconds
        const deltaT = frameTime // δt for central difference
        
        // First, collect all positions
        for (let i = 0; i < rotationTrack.times.length; i++) {
            let time = rotationTrack.times[i]
            this.mixer.setTime(time)
            this.mixer.update(frameTime)
            bone.updateMatrixWorld(true)
            
            let worldPosition = new THREE.Vector3()
            bone.getWorldPosition(worldPosition)
            positions.push(worldPosition.clone())
        }
        
        // Arrays to store jerk components and magnitude
        const totalFrames = positions.length
        let jerkX = new Array(totalFrames).fill(0)
        let jerkY = new Array(totalFrames).fill(0)
        let jerkZ = new Array(totalFrames).fill(0)
        let jerkNorm = new Array(totalFrames).fill(0)
        
        // Calculate jerk using central differences
        for (let i = 2; i < totalFrames - 2; i++) {
            // Use central difference formula for jerk:
            // j(t) = [x(t+2h) - 2x(t+h) + 2x(t-h) - x(t-2h)] / (2h³)
            // where h is the time step (frameTime)
            const twoStepForward = positions[i + 2]
            const oneStepForward = positions[i + 1]
            const oneStepBack = positions[i - 1]
            const twoStepBack = positions[i - 2]
            
            const deltaT3 = 2 * Math.pow(deltaT, 3) // 2h³ from the formula
            
            // Calculate jerk components
            jerkX[i] = (twoStepForward.x - 2*oneStepForward.x + 2*oneStepBack.x - twoStepBack.x) / deltaT3
            jerkY[i] = (twoStepForward.y - 2*oneStepForward.y + 2*oneStepBack.y - twoStepBack.y) / deltaT3
            jerkZ[i] = (twoStepForward.z - 2*oneStepForward.z + 2*oneStepBack.z - twoStepBack.z) / deltaT3
            
            // Calculate magnitude
            jerkNorm[i] = Math.sqrt(jerkX[i]*jerkX[i] + jerkY[i]*jerkY[i] + jerkZ[i]*jerkZ[i])
        }
        
        // Handle boundary points using forward/backward differences
        for (let i = 0; i < 2; i++) {
            // For first two points, use forward difference
            const pos = positions[i]
            const pos1 = positions[i + 1]
            const pos2 = positions[i + 2]
            const pos3 = positions[i + 3]
            
            // Forward difference approximation
            jerkX[i] = (pos3.x - 3*pos2.x + 3*pos1.x - pos.x) / Math.pow(deltaT, 3)
            jerkY[i] = (pos3.y - 3*pos2.y + 3*pos1.y - pos.y) / Math.pow(deltaT, 3)
            jerkZ[i] = (pos3.z - 3*pos2.z + 3*pos1.z - pos.z) / Math.pow(deltaT, 3)
            jerkNorm[i] = Math.sqrt(jerkX[i]*jerkX[i] + jerkY[i]*jerkY[i] + jerkZ[i]*jerkZ[i])
            
            // For last two points, use backward difference
            const j = totalFrames - i - 1
            const posj = positions[j]
            const posj1 = positions[j - 1]
            const posj2 = positions[j - 2]
            const posj3 = positions[j - 3]
            
            // Backward difference approximation
            jerkX[j] = (-posj3.x + 3*posj2.x - 3*posj1.x + posj.x) / Math.pow(deltaT, 3)
            jerkY[j] = (-posj3.y + 3*posj2.y - 3*posj1.y + posj.y) / Math.pow(deltaT, 3)
            jerkZ[j] = (-posj3.z + 3*posj2.z - 3*posj1.z + posj.z) / Math.pow(deltaT, 3)
            jerkNorm[j] = Math.sqrt(jerkX[j]*jerkX[j] + jerkY[j]*jerkY[j] + jerkZ[j]*jerkZ[j])
        }
        
        // Update store with calculated values
        setJerkDataX(jerkX)
        setJerkDataY(jerkY)
        setJerkDataZ(jerkZ)
        setJerkDataNorm(jerkNorm)
    }

	getTimeSeries(jointName = "RightArm") {
		const baseIndex = this.boneIndex[selectedJoint()] * 2 
		const index = this.jointIndex[selectedJoint()]

		console.log("uploadedFile selected Joint ", selectedJoint())
		console.log("uploadedFile selected Joint Index ", index)

		let skeleton = this.globalResult.skeleton
		let bone = skeleton.bones[index]

		if (!bone) {
			console.error("Bone not found:")
			return []
		}

		let jointAnimationClip = this.animationClip
		let rotationTrack = jointAnimationClip.tracks[baseIndex + 1]

		console.log(
			"Selected Bone: ",
			selectedJoint(),
			"    ",
			rotationTrack,
			bone
		)
		if (!rotationTrack) {
			console.error("No position track found at index", index)
			return []
		}

		let positionsX = []
		let positionsY = []
		let positionsZ = []

		let anglesX = [],
			anglesY = [],
			anglesZ = []

		for (let i = 0; i < rotationTrack.times.length; i++) {
			let time = rotationTrack.times[i]
			this.mixer.setTime(time)
			this.mixer.update(1 / 90)

			bone.updateMatrixWorld(true)
			bone.updateMatrix()

			let worldPosition = new THREE.Vector3()
			bone.getWorldPosition(worldPosition)

			positionsX.push(worldPosition.x)
			positionsY.push(worldPosition.y)
			positionsZ.push(worldPosition.z)

			let euler = bone.rotation

			anglesX.push(THREE.MathUtils.radToDeg(euler.x))
			anglesY.push(THREE.MathUtils.radToDeg(euler.y))
			anglesZ.push(THREE.MathUtils.radToDeg(euler.z))
		}

		// Calculate both metrics regardless of current selection
		this.calculateSpeed()
		this.calculateAcceleration()
		this.calculateJerk()

		return [positionsX, positionsY, positionsZ, anglesX, anglesY, anglesZ]
	}

	async createDataframes() {
		const variablesOpt = [
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

		let finalAnglesArray = []
		let finalWoldPosArray = []

		variablesOpt.forEach((jointName) => {
			// console.log(jointName)
			const index = this.jointIndex[jointName]
			let skeleton = this.globalResult.skeleton
			let bone = skeleton.bones[index]

			if (!bone) {
				console.error("Bone not found:", jointName)
				return
			}

			let jointAnimationClip = this.animationClip
			const baseIndex = this.boneIndex[jointName] * 2
			let rotationTrack = jointAnimationClip.tracks[baseIndex + 1]

			if (!rotationTrack) {
				console.error("No rotation track found for", jointName)
				return
			}

			let anglesX = []
			let anglesY = []
			let anglesZ = []

			let positionsX = []
			let positionsY = []
			let positionsZ = []
			this.mixer.timeScale = 1

			for (let i = 0; i < rotationTrack.times.length; i++) {
				let time = rotationTrack.times[i]
				this.mixer.setTime(time)
				this.mixer.update(1 / 90)

				bone.updateMatrixWorld(true)
				bone.updateMatrix()
				let worldPosition = new THREE.Vector3()
				bone.getWorldPosition(worldPosition)

				positionsX.push(worldPosition.x)
				positionsY.push(worldPosition.y)
				positionsZ.push(worldPosition.z)

				let euler = bone.rotation

				anglesX.push(THREE.MathUtils.radToDeg(euler.x))
				anglesY.push(THREE.MathUtils.radToDeg(euler.y))
				anglesZ.push(THREE.MathUtils.radToDeg(euler.z))
			}

			for (let j = 0; j < anglesX.length; j++) {
				if (!finalAnglesArray[j]) {
					finalAnglesArray[j] = []
				}
				if (!finalWoldPosArray[j]) {
					finalWoldPosArray[j] = []
				}
				finalAnglesArray[j].push(anglesX[j], anglesY[j], anglesZ[j])
				finalWoldPosArray[j].push(
					positionsX[j],
					positionsY[j],
					positionsZ[j]
				)
			}
		})

		return [finalAnglesArray]
	}
	addListeners() {
		document.addEventListener("mousemove", (event) =>
			this.onMouseMove(event)
		)

		document.addEventListener("click", (event) => {
			let valueSelected = ""

			if (this.mouseJointHover !== null) {
				bonesList().forEach((bone) => {
					if (bone.endsWith(this.mouseJointHover[1])) {
						valueSelected = bone
					}
				})
				console.log("yo: ", this.mouseJointHover, valueSelected)

				setSelectedValue(valueSelected)
				this.sphereMeshes.children[
					this.jointIndex[selectedJoint()]
				].material.color.set(0x145e9f)
				setSelectedJoint(this.mouseJointHover[1])
				this.sphereMeshes.children[
					this.jointIndex[selectedJoint()]
				].material.color.set("red")
			}
		})
	}

	// Handle mouse move events to update mesh colors and show tooltip
	onMouseMove(event) {
		function styleWords(str, style) {
			return str
				.split(" ")
				.map((word) => `<span style="${style}">${word}</span>`)
				.join(" ")
		}
		const pointer = new THREE.Vector2()

		var rect = baseScene().renderer.domElement.getBoundingClientRect()
		pointer.x =
			((event.clientX - rect.left) / (rect.right - rect.left)) * 2 - 1
		pointer.y =
			-((event.clientY - rect.top) / (rect.bottom - rect.top)) * 2 + 1

		const raycaster = new THREE.Raycaster()

		raycaster.setFromCamera(pointer, baseScene().camera)

		// calculate objects intersecting the picking ray
		const intersects = raycaster.intersectObjects(
			this.sphereMeshes.children
		)

		// console.log("intersects: ", intersects)

		event.preventDefault()

		const idx = this.jointIndex[selectedJoint()]
		console.log("idx: ", idx)
		this.sphereMeshes.children[idx].material.color.set("red") // Reset mesh color to green

		const tooltip = document.getElementById("tooltip")
		let tooltipVisible = false
		tooltip.style.display = "block"
		// console.log(window.screen.width);
		this.mouseJointHover = null

		// intersects[0].object.material.color.set(0x145e9f) // Reset mesh color to blue

		this.sphereMeshes.children.forEach((mesh, index) => {
			if (index !== this.jointIndex[selectedJoint()]) {
				mesh.material.color.set(0x145e9f)
			}
			if (intersects.length !== 0) {
				const exists = bonesList().some((bone) =>
					bone.includes(intersects[0].object.name)
				)
				if (intersects[0].object.name === mesh.name) {
					// Check if mouse is close to a mesh

					if (!exists) {
						mesh.material.color.set(0x104a7e) // Reset mesh color to blue
					} else if (index === this.jointIndex[selectedJoint()]) {
						mesh.material.color.set(0xb30000) // Reset mesh color to red
					} else {
						mesh.material.color.set(0x00ff00) // Change mesh color to green
					}
					const worldPos = new THREE.Vector3()
					mesh.getWorldPosition(worldPos)
					tooltip.innerHTML = `<div style="text-align: left; font-weight: 450;">Name: ${
						styleWords(
							this.boneNames[index],
							// intersects[0].object.name,

							"color: black; font-weight: 550;"
						) // Example style
					}</div>
					<div style=" font-weight: 450;" > X: ${styleWords(
						mesh.position.x.toFixed(2),
						"color: red;"
					)}, Y: ${styleWords(
						mesh.position.y.toFixed(2),
						"color: green;"
					)}, Z: ${styleWords(
						mesh.position.z.toFixed(2),
						"color: blue;"
					)},
						X: ${styleWords(worldPos.x.toFixed(2), "color: red;")}, 
   						Y: ${styleWords(worldPos.y.toFixed(2), "color: green;")}, 
    					Z: ${styleWords(worldPos.z.toFixed(2), "color: blue;")}
					
					</div>`
					tooltip.style.left = `${(event.clientX + 15) / scaleX()}px`
					tooltip.style.top = `${(event.clientY + 15) / scaleX()}px`
					tooltip.style.visibility = "visible"
					tooltipVisible = true
					if (exists) {
						this.mouseJointHover = [
							bonesList()[index],
							this.boneNames[index],
						]
					}
				}
			}
		})

		setToolTipVisibility((prev) => {
			const newVisibility = [...prev] // Create a copy of the array
			newVisibility[this.label - 1] = tooltipVisible // Modify the corresponding index
			return newVisibility // Return the updated array
		})

		const allFalse = toolTipVisibility().every((value) => value === false)

		if (allFalse) {
			tooltip.style.visibility = "hidden"
		}
	}

	createBoundingBox() {
		// Remove existing bounding box if it exists
		if (this.boundingBox) {
			this.descriptorsGroup.remove(this.boundingBox);
			this.boundingBox = null;
		}

		if (!this.sphereMeshes.children || this.sphereMeshes.children.length === 0) {
			console.warn("No skeleton joints found for creating bounding box");
			return null;
		}

		// Get all joint positions in local space for consistent positioning
		const positions = [];
		this.sphereMeshes.children.forEach(mesh => {
			// We need to work with world positions to get the correct bounding box
			const worldPosition = new THREE.Vector3();
			mesh.getWorldPosition(worldPosition);
			// Convert world position to local position relative to descriptorsGroup's parent
			this.descriptorsGroup.parent.worldToLocal(worldPosition);
			positions.push(worldPosition);
		});

		// Calculate min and max bounds
		const min = new THREE.Vector3(Infinity, Infinity, Infinity);
		const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);

		positions.forEach(pos => {
			min.x = Math.min(min.x, pos.x);
			min.y = Math.min(min.y, pos.y);
			min.z = Math.min(min.z, pos.z);
			max.x = Math.max(max.x, pos.x);
			max.y = Math.max(max.y, pos.y);
			max.z = Math.max(max.z, pos.z);
		});

		// Calculate box center and dimensions
		const center = new THREE.Vector3().addVectors(min, max).multiplyScalar(0.5);
		const size = new THREE.Vector3().subVectors(max, min);

		// Create box wireframe
		const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
		const material = new THREE.MeshBasicMaterial({ 
			color: 0xff0000,
			wireframe: true,
			transparent: true,
			opacity: 0.7
		});
		
		this.boundingBox = new THREE.Mesh(geometry, material);
		this.boundingBox.position.copy(center);
		this.descriptorsGroup.add(this.boundingBox);
		
		// Add dimensions text
		const dimensions = `${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`;
		console.log("Bounding Box Dimensions:", dimensions);
		
		return this.boundingBox;
	}

	createBoundingSphere(centerOnRoot = true) {
		// Remove existing bounding sphere if it exists
		if (this.boundingSphere) {
			this.descriptorsGroup.remove(this.boundingSphere);
			this.boundingSphere = null;
		}
	
		if (!this.sphereMeshes.children || this.sphereMeshes.children.length === 0) {
			console.warn("No skeleton joints found for creating bounding sphere");
			return null;
		}
	
		// Get all joint positions
		const positions = [];
		this.sphereMeshes.children.forEach(mesh => {
			// Skip invisible or extremely small meshes
			if (!mesh.visible || mesh.geometry.parameters.radius < 0.1) {
				return;
			}
			
			const worldPosition = new THREE.Vector3();
			mesh.getWorldPosition(worldPosition);
			// Convert world position to local position relative to descriptorsGroup's parent
			this.descriptorsGroup.parent.worldToLocal(worldPosition);
			positions.push(worldPosition);
		});
		
		// Check if we have enough positions to work with
		if (positions.length === 0) {
			console.warn("No valid joint positions for bounding sphere");
			return null;
		}
		
		let center;
		if (centerOnRoot) {
			// Center on Root/Hips joint
			const rootIndex = this.jointIndex['Hips'] || 0;
			const worldPosition = new THREE.Vector3();
			this.sphereMeshes.children[rootIndex].getWorldPosition(worldPosition);
			// Convert to local space of descriptorsGroup's parent
			this.descriptorsGroup.parent.worldToLocal(worldPosition);
			center = worldPosition;
		} else {
			// Calculate centroid
			center = new THREE.Vector3();
			positions.forEach(pos => {
				center.add(pos);
			});
			center.divideScalar(positions.length);
		}
		
		// Calculate radius as maximum distance from center to any joint
		// Use squared distance for efficiency during calculation
		let maxRadiusSq = 0;
		positions.forEach(pos => {
			const distSq = center.distanceToSquared(pos);
			if (distSq > maxRadiusSq) {
				maxRadiusSq = distSq;
			}
		});
		const radius = Math.sqrt(maxRadiusSq);
		
		// Add a small padding to ensure all joints are inside
		const paddedRadius = radius * 1.05;
		
		// Create sphere wireframe
		const geometry = new THREE.SphereGeometry(1, 32, 16);
		const material = new THREE.MeshBasicMaterial({ 
			color: 0x0000ff, 
			wireframe: true,
			transparent: true,
			opacity: 0.7 
		});
		
		this.boundingSphere = new THREE.Mesh(geometry, material);
		this.boundingSphere.position.copy(center);
		this.boundingSphere.scale.set(paddedRadius, paddedRadius, paddedRadius);
		this.descriptorsGroup.add(this.boundingSphere);
		
		console.log("Bounding Sphere - Center:", center, "Radius:", paddedRadius.toFixed(2));
		
		return this.boundingSphere;
	}

	createBoundingEllipsoid() {
		// Remove existing bounding ellipsoid if it exists
		if (this.boundingEllipsoid) {
			this.descriptorsGroup.remove(this.boundingEllipsoid);
			this.boundingEllipsoid = null;
		}
		
		if (!this.sphereMeshes.children || this.sphereMeshes.children.length === 0) {
			console.warn("No skeleton joints found for creating bounding ellipsoid");
			return null;
		}
	
		// Get all joint positions
		const positions = [];
		this.sphereMeshes.children.forEach(mesh => {
			// Skip invisible or extremely small meshes
			if (!mesh.visible || mesh.geometry.parameters.radius < 0.1) {
				return;
			}
			
			const worldPosition = new THREE.Vector3();
			mesh.getWorldPosition(worldPosition);
			// Convert world position to local position relative to descriptorsGroup's parent
			this.descriptorsGroup.parent.worldToLocal(worldPosition);
			positions.push(worldPosition);
		});
		
		// Check if we have enough positions
		if (positions.length === 0) {
			console.warn("No valid joint positions for bounding ellipsoid");
			return null;
		}
		
		// Find min and max points to determine principal axes
		const min = new THREE.Vector3(Infinity, Infinity, Infinity);
		const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
		
		positions.forEach(pos => {
			min.x = Math.min(min.x, pos.x);
			min.y = Math.min(min.y, pos.y);
			min.z = Math.min(min.z, pos.z);
			max.x = Math.max(max.x, pos.x);
			max.y = Math.max(max.y, pos.y);
			max.z = Math.max(max.z, pos.z);
		});
		
		// Calculate center
		const center = new THREE.Vector3().addVectors(min, max).multiplyScalar(0.5);
		
		// Calculate variance along each axis
		const variance = new THREE.Vector3(0, 0, 0);
		positions.forEach(pos => {
			const dx = pos.x - center.x;
			const dy = pos.y - center.y;
			const dz = pos.z - center.z;
			
			variance.x += dx * dx;
			variance.y += dy * dy;
			variance.z += dz * dz;
		});
		variance.divideScalar(positions.length);
		
		// Calculate principal axes for the ellipsoid (standard deviations)
		// Multiply by a factor to ensure the ellipsoid fully contains the skeleton
		const scaleFactor = 2.5; // Increased to ensure skeleton fits inside
		const radii = new THREE.Vector3(
			Math.sqrt(variance.x) * scaleFactor,
			Math.sqrt(variance.y) * scaleFactor,
			Math.sqrt(variance.z) * scaleFactor
		);
		
		// Ensure minimum radius in any direction to avoid flat ellipsoids
		const minRadius = Math.max(radii.x, radii.y, radii.z) * 0.25;
		radii.x = Math.max(radii.x, minRadius);
		radii.y = Math.max(radii.y, minRadius);
		radii.z = Math.max(radii.z, minRadius);
		
		// Create ellipsoid using a scaled sphere
		const geometry = new THREE.SphereGeometry(1, 32, 16);
		const material = new THREE.MeshBasicMaterial({ 
			color: 0x00ff00, 
			wireframe: true,
			transparent: true,
			opacity: 0.7 
		});
		
		this.boundingEllipsoid = new THREE.Mesh(geometry, material);
		this.boundingEllipsoid.position.copy(center);
		this.boundingEllipsoid.scale.set(radii.x, radii.y, radii.z);
		this.descriptorsGroup.add(this.boundingEllipsoid);
		
		console.log("Bounding Ellipsoid - Center:", center, "Radii:", radii);
		
		return this.boundingEllipsoid;
	}

	alignDescriptorsWithSkeleton() {
		if (!this.descriptorsGroup || !this.sphereMeshes || !this.sphereMeshes.children) {
			return;
		}
		
		// Find the root joint position
		const rootIndex = this.jointIndex['Hips'] || 0;
		if (!this.sphereMeshes.children[rootIndex]) {
			return;
		}
		
		const rootWorldPos = new THREE.Vector3();
		this.sphereMeshes.children[rootIndex].getWorldPosition(rootWorldPos);
		
		// Update all existing descriptors
		if (this.activeDescriptor === 'box') {
			this.createBoundingBox();
		} else if (this.activeDescriptor === 'sphere') {
			this.createBoundingSphere(true); // Center on root
		} else if (this.activeDescriptor === 'ellipsoid') {
			this.createBoundingEllipsoid();
		}
	}
	
	// Override setActiveDescriptor to include alignment
	setActiveDescriptor(type) {
		console.log(`Setting active descriptor to: ${type}`);
		
		// First hide all descriptors
		if (this.boundingBox) this.boundingBox.visible = false;
		if (this.boundingSphere) this.boundingSphere.visible = false;
		if (this.boundingEllipsoid) this.boundingEllipsoid.visible = false;
		
		// Clean up old descriptors of a different type to avoid stacking
		if (this.activeDescriptor !== type) {
			this.cleanupDescriptors();
		}
		
		this.activeDescriptor = type;
		
		// Then show the selected descriptor, creating it if needed
		if (type === 'box') {
			if (!this.boundingBox) this.createBoundingBox();
			if (this.boundingBox) this.boundingBox.visible = true;
		} 
		else if (type === 'sphere') {
			if (!this.boundingSphere) this.createBoundingSphere(true); // Center on root
			if (this.boundingSphere) this.boundingSphere.visible = true;
		}
		else if (type === 'ellipsoid') {
			if (!this.boundingEllipsoid) this.createBoundingEllipsoid();
			if (this.boundingEllipsoid) this.boundingEllipsoid.visible = true;
		}
		
		// Make sure descriptors group is properly added to the scene
		if (this.descriptorsGroup && !this.newParent.children.includes(this.descriptorsGroup)) {
			this.newParent.add(this.descriptorsGroup);
		}
	}
	
	// Modified update method to ensure descriptors follow skeleton
	update(delta) {
		// Update mixer (if there is an animation running)
		if (this.mixer) {
			this.mixer.update(delta);
		}
	
		try {
			this.updateSpherePositions();
			this.updateLinePositions();
			
			// Only update geometric descriptors when active
			if (this.activeDescriptor !== 'none') {
				this.updateGeometricDescriptors();
			}
		} catch (error) {
			console.error("Failed to update skeleton:", error);
		}
	}
	
	// Improved updateGeometricDescriptors function
	updateGeometricDescriptors() {
		// Only recreate if we're actually displaying these descriptors
		if (this.activeDescriptor === 'box' && this.boundingBox && this.boundingBox.visible) {
			this.createBoundingBox();
		} 
		else if (this.activeDescriptor === 'sphere' && this.boundingSphere && this.boundingSphere.visible) {
			this.createBoundingSphere(true); // Always center on root when updating
		}
		else if (this.activeDescriptor === 'ellipsoid' && this.boundingEllipsoid && this.boundingEllipsoid.visible) {
			this.createBoundingEllipsoid();
		}
	}

	setAnimationTime(timeInSeconds) {
		if (this.mixer) {
			if (this.mixer.timeScale === 1) {
				this.mixer.setTime(timeInSeconds)
			}

			if (this.mixer.timeScale === 0) {
				this.mixer.timeScale = 1

				this.mixer.setTime(timeInSeconds)
				this.mixer.timeScale = 0
			}
			// this.sphereMeshes.rotation.set(0, timeInSeconds * 10, 0) // Περιστροφή 90° στον X άξονα
		}
	}

	getAnimationDuration() {
		return this.mixer && this.action && this.action.getClip()
			? this.action.getClip().duration
			: 0
	}

	play() {
		setPlayPressed(true)
		if (this.mixer) {
			this.mixer.timeScale = 1
			this.action.paused = false
		}
		console.log("mixer: ", this.mixer)
	}

	stop() {
		setPlayPressed(false)

		if (this.mixer) {
			this.mixer.timeScale = 0
		}
	}
}

export default SkeletonViewer
