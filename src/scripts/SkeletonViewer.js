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
		this.centerOfMass = null
		this.balanceIndicator = null     // Visual indicator of balance state
		this.projectedCoM = null         // Projected CoM on ground
		this.supportPolygon = null       // Visual representation of support polygon
		this.isBalanced = false          // Boolean value for balance state
		this.descriptorsGroup = new THREE.Group()
		this.activeDescriptor = 'none' // 'none', 'box', 'sphere', 'ellipsoid', 'com', 'balance', 'distance'
		
		// Distance covered tracking
		this.distanceTracker = null      // Group to hold distance visualization elements
		this.pathPoints = []             // Array to store positions for distance tracking
		this.totalDistance = 0           // Total distance covered
		this.distanceText = null         // Text display for distance covered
		this.lastTrackedPosition = null  // Last tracked position for incremental calculations
		this.distanceTrackingActive = false // Flag to control tracking
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
		
		// Create sphere geometry and material for the bounding sphere 
		// - using simple, large triangles for better performance
		const geometry = new THREE.SphereGeometry(1, 16, 12);
		const material = new THREE.MeshBasicMaterial({ 
			color: 0x0000ff, 
			wireframe: true,
			transparent: true,
			opacity: 0.7 
		});
		
		// Create the sphere mesh once and add it to the scene
		this.boundingSphere = new THREE.Mesh(geometry, material);
		this.descriptorsGroup.add(this.boundingSphere);
		
		// Calculate and apply the initial sphere properties
		this.updateBoundingSphere(centerOnRoot);
		
		return this.boundingSphere;
	}
	
	updateBoundingSphere(centerOnRoot = true) {
		if (!this.boundingSphere) return null;
		
		// Get all joint positions
		const positions = [];
		this.sphereMeshes.children.forEach(mesh => {
			// Skip invisible or extremely small joints
			if (!mesh.visible || mesh.geometry.parameters.radius < 0.1) {
				return;
			}
			
			const worldPosition = new THREE.Vector3();
			mesh.getWorldPosition(worldPosition);
			this.descriptorsGroup.parent.worldToLocal(worldPosition);
			positions.push(worldPosition);
		});
		
		if (positions.length < 2) {
			console.warn("Not enough valid joint positions for bounding sphere");
			return null;
		}
		
		// Simple algorithm to calculate the bounding sphere:
		// 1. First compute the center as the average of all joint positions
		const center = new THREE.Vector3();
		positions.forEach(pos => {
			center.add(pos);
		});
		center.divideScalar(positions.length);
		
		// 2. Find the joint farthest from this center to determine radius
		let maxDistSq = 0;
		positions.forEach(pos => {
			const distSq = center.distanceToSquared(pos);
			maxDistSq = Math.max(maxDistSq, distSq);
		});
		
		// Apply a small padding to ensure all joints fit (5%)
		const radius = Math.sqrt(maxDistSq) * 1.05;
		
		// Update the bounding sphere's position and scale
		this.boundingSphere.position.copy(center);
		this.boundingSphere.scale.set(radius, radius, radius);
		
		return this.boundingSphere;
	}

	createBoundingEllipsoid() {
		// Remove existing bounding ellipsoid if it exists
		if (this.boundingEllipsoid) {
			this.descriptorsGroup.remove(this.boundingEllipsoid);
			this.boundingEllipsoid = null;
		}
		
		// Clean up any existing axis lines
		if (this.ellipsoidAxes) {
			this.ellipsoidAxes.forEach(axis => {
				this.descriptorsGroup.remove(axis);
			});
			this.ellipsoidAxes = null;
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
		if (positions.length < 3) {
			console.warn("Not enough valid joint positions for bounding ellipsoid");
			return null;
		}
		
		// Find the centroid of all points
		const centroid = new THREE.Vector3();
		positions.forEach(pos => {
			centroid.add(pos);
		});
		centroid.divideScalar(positions.length);
		
		// Step 1: Calculate the covariance matrix
		const covarianceMatrix = [
			[0, 0, 0],
			[0, 0, 0],
			[0, 0, 0]
		];
		
		positions.forEach(pos => {
			// Mean-center the points
			const dx = pos.x - centroid.x;
			const dy = pos.y - centroid.y;
			const dz = pos.z - centroid.z;
			
			// Build covariance matrix
			covarianceMatrix[0][0] += dx * dx;
			covarianceMatrix[1][1] += dy * dy;
			covarianceMatrix[2][2] += dz * dz;
			
			// Off-diagonal elements (not used for simplified approach)
			covarianceMatrix[0][1] += dx * dy;
			covarianceMatrix[0][2] += dx * dz;
			covarianceMatrix[1][0] += dy * dx;
			covarianceMatrix[1][2] += dy * dz;
			covarianceMatrix[2][0] += dz * dx;
			covarianceMatrix[2][1] += dz * dy;
		});
		
		// Normalize the covariance matrix
		for (let i = 0; i < 3; i++) {
			for (let j = 0; j < 3; j++) {
				covarianceMatrix[i][j] /= positions.length;
			}
		}
		
		// Step 2: Using variances directly to calculate radii (simplified PCA approach)
		const variances = [
			covarianceMatrix[0][0], // Variance in X
			covarianceMatrix[1][1], // Variance in Y
			covarianceMatrix[2][2]  // Variance in Z
		];

		// Calculate principal axes lengths (using standard deviations)
		// Using a smaller adaptive scale factor for tighter fit
		const adaptiveScaleFactor = 1.5; // Reduced from 2.0
		const radii = [
			Math.sqrt(variances[0]) * adaptiveScaleFactor,
			Math.sqrt(variances[1]) * adaptiveScaleFactor,
			Math.sqrt(variances[2]) * adaptiveScaleFactor
		];
		
		// Find minimum radius to prevent flat ellipsoids (at least 10% of max)
		const minRadius = Math.max(...radii) * 0.1; // Reduced from 0.15
		radii[0] = Math.max(radii[0], minRadius);
		radii[1] = Math.max(radii[1], minRadius);
		radii[2] = Math.max(radii[2], minRadius);
		
		// Step 3: Create the ellipsoid using a scaled sphere
		const geometry = new THREE.SphereGeometry(1, 24, 16);
		const material = new THREE.MeshBasicMaterial({ 
			color: 0x00ff00, 
			wireframe: true,
			transparent: true,
			opacity: 0.7 
		});
		
		this.boundingEllipsoid = new THREE.Mesh(geometry, material);
		this.boundingEllipsoid.position.copy(centroid);
		this.boundingEllipsoid.scale.set(radii[0], radii[1], radii[2]);
		
		// Validate the ellipsoid contains all points
		let needsExpansion = false;
		let maxDistanceRatio = 0;
		
		// Count points outside the ellipsoid
		let pointsOutsideCount = 0;
		
		// Check if any points are outside the ellipsoid
		positions.forEach(pos => {
			// Convert point to ellipsoid's local space
			const localPoint = pos.clone().sub(centroid);
			
			// Calculate the squared distance ratio
			// (x/a)² + (y/b)² + (z/c)² <= 1 for points inside ellipsoid
			const ratio = Math.pow(localPoint.x / radii[0], 2) + 
						  Math.pow(localPoint.y / radii[1], 2) + 
						  Math.pow(localPoint.z / radii[2], 2);
			
			if (ratio > 1) {
				needsExpansion = true;
				pointsOutsideCount++;
				maxDistanceRatio = Math.max(maxDistanceRatio, ratio);
			}
		});
		
		// If needed, expand the ellipsoid just enough to include all points
		// But be more conservative with the expansion
		if (needsExpansion) {
			// Use the square root of the ratio to get the proper scaling factor
			// Add just 2% padding instead of 5%
			const expansionFactor = Math.sqrt(maxDistanceRatio) * 1.02;
			
			// Apply the expansion
			radii[0] *= expansionFactor;
			radii[1] *= expansionFactor;
			radii[2] *= expansionFactor;
			this.boundingEllipsoid.scale.set(radii[0], radii[1], radii[2]);
			
			console.log(`Expanded ellipsoid by factor ${expansionFactor.toFixed(3)} to include ${pointsOutsideCount} points`);
		}
		
		// Add the ellipsoid to the scene
		this.descriptorsGroup.add(this.boundingEllipsoid);
		
		return this.boundingEllipsoid;
	}
	
	// Override the updateGeometricDescriptors function to use our new approach
	updateGeometricDescriptors() {
		// Only update if we're actually displaying these descriptors
		if (this.activeDescriptor === 'box' && this.boundingBox && this.boundingBox.visible) {
			this.createBoundingBox();
		} 
		else if (this.activeDescriptor === 'sphere' && this.boundingSphere) {
			// Just update the sphere properties, don't recreate it
			this.updateBoundingSphere(true);
		}
		else if (this.activeDescriptor === 'ellipsoid' && this.boundingEllipsoid && this.boundingEllipsoid.visible) {
			this.createBoundingEllipsoid();
		}
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
	
	// Override setActiveDescriptor to include alignment and center of mass
	setActiveDescriptor(type) {
		console.log(`Setting active descriptor to: ${type}`);
		
		// First hide all descriptors
		if (this.boundingBox) this.boundingBox.visible = false;
		if (this.boundingSphere) this.boundingSphere.visible = false;
		if (this.boundingEllipsoid) this.boundingEllipsoid.visible = false;
		if (this.centerOfMass) this.centerOfMass.visible = false;
		if (this.comConnections) {
			this.comConnections.forEach(line => {
				line.visible = false;
			});
		}
		
		 // Stop distance tracking if it was active
		this.distanceTrackingActive = false;
		if (this.distanceTracker) {
			this.distanceTracker.visible = false;
		}
		
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
		else if (type === 'com') {
			if (!this.centerOfMass) this.createCenterOfMass();
			if (this.centerOfMass) {
				this.centerOfMass.visible = true;
				// Show connections too
				if (this.comConnections) {
					this.comConnections.forEach(line => {
						line.visible = true;
					});
				}
			}
			}
		else if (type === 'balance') {
			this.createBalance();
		}
		else if (type === 'distance') {
			// Initialize or reset distance tracking
			if (!this.distanceTracker) {
				this.initDistanceTracking();
			} else {
				this.resetDistanceTracking();
			}
			this.distanceTrackingActive = true;
			this.distanceTracker.visible = true;
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
				
				// Update center of mass if it's active
				if (this.activeDescriptor === 'com') {
					this.updateCenterOfMass();
				}
				
				// Update balance visualization if it's active
				if (this.activeDescriptor === 'balance') {
					this.updateBalance();
				}
				
				// Update distance tracking if it's active
				if (this.activeDescriptor === 'distance' && this.distanceTrackingActive) {
					this.updateDistanceTracking();
				}
			}
		} catch (error) {
			console.error("Failed to update skeleton:", error);
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

	createCenterOfMass() {
		// Remove existing center of mass if it exists
		if (this.centerOfMass) {
			this.descriptorsGroup.remove(this.centerOfMass);
			this.centerOfMass = null;
		}
		
		if (!this.sphereMeshes.children || this.sphereMeshes.children.length === 0) {
			console.warn("No skeleton joints found for creating center of mass");
			return null;
		}
		
		// Define joint weights based on Dempster's anthropometric values
		// Values inspired by Dempster as mentioned in the requirements:
		const jointWeights = {
			'Hips': 0.497,      // root (497%)
			'LeftShoulder': 0.28,  // each shoulder (28%)
			'RightShoulder': 0.28,
			'LeftArm': 0.16,    // each elbow (16%)
			'RightArm': 0.16,
			'LeftHand': 0.06,   // each hand (06%)
			'RightHand': 0.06,
			'LeftUpLeg': 0.10,  // each thigh (10%)
			'RightUpLeg': 0.10,
			'LeftLeg': 0.465,   // each knee (465%)
			'RightLeg': 0.465,
			'LeftFoot': 0.145,  // each foot (145%)
			'RightFoot': 0.145,
			'Head': 0.081       // head (81%)
		};
		
		// Use alternative names for joints if needed
		const alternativeNames = {
			'LeftForeArm': 'LeftArm',
			'RightForeArm': 'RightArm',
			'LeftForeHand': 'LeftHand',
			'RightForeHand': 'RightHand',
			'LeftForeArm_end': 'LeftHand',
			'RightForeArm_end': 'RightHand',
			'LeftLeg_end': 'LeftFoot',
			'RightLeg_end': 'RightFoot'
		};
		
		// Calculate center of mass position using weighted average
		const comPosition = new THREE.Vector3(0, 0, 0);
		let totalWeight = 0;
		
		// For each bone in the skeleton
		this.sphereMeshes.children.forEach(mesh => {
			const boneName = mesh.name;
			let weight = 0;
			
			// Get weight directly or check for alternative names
			if (jointWeights[boneName] !== undefined) {
				weight = jointWeights[boneName];
			} else if (alternativeNames[boneName] && jointWeights[alternativeNames[boneName]] !== undefined) {
				weight = jointWeights[alternativeNames[boneName]];
			}
			
			// If we found a weight for this joint
			if (weight > 0) {
				// Get the position of the joint
				const worldPosition = new THREE.Vector3();
				mesh.getWorldPosition(worldPosition);
				this.descriptorsGroup.parent.worldToLocal(worldPosition);
				
				// Add weighted contribution to the center of mass
				comPosition.x += worldPosition.x * weight;
				comPosition.y += worldPosition.y * weight;
				comPosition.z += worldPosition.z * weight;
				totalWeight += weight;
			}
		});
		
		// Normalize by the total weight (equation 13 from the requirements)
		if (totalWeight > 0) {
			comPosition.divideScalar(totalWeight);
		} else {
			console.warn("No valid weighted joints found for Center of Mass calculation");
			return null;
		}
		
		// Create visual representation of center of mass
		const sphereGeometry = new THREE.SphereGeometry(3, 16, 16);
		const sphereMaterial = new THREE.MeshBasicMaterial({
			color: 0xff8800,
			transparent: true,
			opacity: 0.7
		});
		
		this.centerOfMass = new THREE.Mesh(sphereGeometry, sphereMaterial);
		this.centerOfMass.position.copy(comPosition);
		this.descriptorsGroup.add(this.centerOfMass);
		
		// Add radial lines from CoM to key joints for visualization
		this.createCoMConnections(comPosition);
		
		console.log("Center of Mass calculated at:", comPosition);
		return this.centerOfMass;
	}
	
	// Create visual connections from CoM to key joints
	createCoMConnections(comPosition) {
		// Clean up existing connections if present
		if (this.comConnections) {
			this.comConnections.forEach(line => {
				this.descriptorsGroup.remove(line);
			});
		}
		
		this.comConnections = [];
		
		// Key joints to connect to CoM (can be adjusted)
		const keyJointNames = ['Hips', 'Head', 'LeftHand', 'RightHand', 'LeftFoot', 'RightFoot'];
		
		// For each key joint, create a line to CoM
		keyJointNames.forEach(jointName => {
			// Find joint by name or alternative name
			const joint = this.sphereMeshes.children.find(mesh => 
				mesh.name === jointName || 
				mesh.name === jointName + '_end' ||
				(jointName === 'LeftHand' && mesh.name === 'LeftForeArm_end') ||
				(jointName === 'RightHand' && mesh.name === 'RightForeArm_end') ||
				(jointName === 'LeftFoot' && mesh.name === 'LeftLeg_end') ||
				(jointName === 'RightFoot' && mesh.name === 'RightLeg_end')
			);
			
			if (joint) {
				// Get joint world position
				const jointPos = new THREE.Vector3();
				joint.getWorldPosition(jointPos);
				this.descriptorsGroup.parent.worldToLocal(jointPos);
				
				// Create a line geometry
				const points = [comPosition, jointPos];
				const geometry = new THREE.BufferGeometry().setFromPoints(points);
				const material = new THREE.LineBasicMaterial({ 
					color: 0xff8800,
					transparent: true,
					opacity: 0.4
				});
				
				const line = new THREE.Line(geometry, material);
				this.descriptorsGroup.add(line);
				this.comConnections.push(line);
			}
		});
	}
	
	updateCenterOfMass() {
		if (this.activeDescriptor === 'com' && this.centerOfMass) {
			this.createCenterOfMass(); // Recalculate and recreate
		}
	}

	createBalance() {
		// Clean up previous balance visualization elements
		if (this.balanceIndicator) {
			this.descriptorsGroup.remove(this.balanceIndicator);
			this.balanceIndicator = null;
		}
		if (this.supportPolygon) {
			this.descriptorsGroup.remove(this.supportPolygon);
			this.supportPolygon = null;
		}
		if (this.projectedCoM) {
			this.descriptorsGroup.remove(this.projectedCoM);
			this.projectedCoM = null;
		}
		
		// First calculate the center of mass - we need this for balance calculation
		const comPosition = this.calculateCoMPosition();
		if (!comPosition) {
			console.warn("Unable to calculate Center of Mass for balance determination");
			return null;
		}
		
		// Create the ground plane for visual reference (slightly below lowest foot)
		const groundY = this.findGroundLevel();
		
		// Create the support polygon based on the current bounding shape
		let supportPoints = this.createSupportPolygon(groundY);
		if (!supportPoints || supportPoints.length < 3) {
			console.warn("Unable to create valid support polygon for balance determination");
			return null;
		}
		
		// Project the center of mass onto the ground plane
		const projectedCoM = new THREE.Vector3(comPosition.x, groundY, comPosition.z);
		
		// Check if the projected CoM is inside the support polygon
		this.isBalanced = this.pointInSupportPolygon(projectedCoM, supportPoints);
		
		// Create visual indicators
		this.createBalanceVisualization(comPosition, projectedCoM, supportPoints, groundY);
		
		return this.balanceIndicator;
	}

	// Calculate Center of Mass position (without creating visual elements)
	calculateCoMPosition() {
		if (!this.sphereMeshes.children || this.sphereMeshes.children.length === 0) {
			return null;
		}
		
		// Define joint weights based on Dempster's anthropometric values
		const jointWeights = {
			'Hips': 0.497,      // root (497%)
			'LeftShoulder': 0.28,  // each shoulder (28%)
			'RightShoulder': 0.28,
			'LeftArm': 0.16,    // each elbow (16%)
			'RightArm': 0.16,
			'LeftHand': 0.06,   // each hand (06%)
			'RightHand': 0.06,
			'LeftUpLeg': 0.10,  // each thigh (10%)
			'RightUpLeg': 0.10,
			'LeftLeg': 0.465,   // each knee (465%)
			'RightLeg': 0.465,
			'LeftFoot': 0.145,  // each foot (145%)
			'RightFoot': 0.145,
			'Head': 0.081       // head (81%)
		};
		
		// Use alternative names for joints if needed
		const alternativeNames = {
			'LeftForeArm': 'LeftArm',
			'RightForeArm': 'RightArm',
			'LeftForeHand': 'LeftHand',
			'RightForeHand': 'RightHand',
			'LeftForeArm_end': 'LeftHand',
			'RightForeArm_end': 'RightHand',
			'LeftLeg_end': 'LeftFoot',
			'RightLeg_end': 'RightFoot'
		};
		
		// Calculate center of mass position using weighted average
		const comPosition = new THREE.Vector3(0, 0, 0);
		let totalWeight = 0;
		
		// For each bone in the skeleton
		this.sphereMeshes.children.forEach(mesh => {
			const boneName = mesh.name;
			let weight = 0;
			
			// Get weight directly or check for alternative names
			if (jointWeights[boneName] !== undefined) {
				weight = jointWeights[boneName];
			} else if (alternativeNames[boneName] && jointWeights[alternativeNames[boneName]] !== undefined) {
				weight = jointWeights[alternativeNames[boneName]];
			}
			
			// If we found a weight for this joint
			if (weight > 0) {
				// Get the position of the joint
				const worldPosition = new THREE.Vector3();
				mesh.getWorldPosition(worldPosition);
				this.descriptorsGroup.parent.worldToLocal(worldPosition);
				
				// Add weighted contribution to the center of mass
				comPosition.x += worldPosition.x * weight;
				comPosition.y += worldPosition.y * weight;
				comPosition.z += worldPosition.z * weight;
				totalWeight += weight;
			}
		});
		
		// Normalize by the total weight (equation 13 from the requirements)
		if (totalWeight > 0) {
			comPosition.divideScalar(totalWeight);
			return comPosition;
		} else {
			return null;
		}
	}
	
	// Find the Y coordinate of the ground plane based on lowest foot position
	findGroundLevel() {
		let lowestY = Infinity;
		
		// Look for foot joints
		const footJointNames = ['LeftFoot', 'RightFoot', 'LeftLeg_end', 'RightLeg_end'];
		
		footJointNames.forEach(footName => {
			const footJoint = this.sphereMeshes.children.find(mesh => 
				mesh.name === footName || mesh.name.includes(footName));
				
			if (footJoint) {
				const worldPos = new THREE.Vector3();
				footJoint.getWorldPosition(worldPos);
				this.descriptorsGroup.parent.worldToLocal(worldPos);
				lowestY = Math.min(lowestY, worldPos.y);
			}
		});
		
		// If no foot joint was found, use the lowest joint as fallback
		if (lowestY === Infinity) {
			this.sphereMeshes.children.forEach(mesh => {
				const worldPos = new THREE.Vector3();
				mesh.getWorldPosition(worldPos);
				this.descriptorsGroup.parent.worldToLocal(worldPos);
				lowestY = Math.min(lowestY, worldPos.y);
			});
		}
		
		// Add small offset below the lowest point for the ground plane
		return lowestY - 2; 
	}
	
	// Create support polygon based on the active bounding shape
	createSupportPolygon(groundY) {
		// Get the active bounding shape or create a new one if needed
		let boundingShape = null;
		let shapeType = '';
		
		// We use the current active bounding shape or create a new one temporarily
		if (this.activeDescriptor === 'balance') {
			// Choose which bounding shape to use for the support polygon
			if (this.boundingBox && this.boundingBox.visible) {
				boundingShape = this.boundingBox;
				shapeType = 'box';
			} else if (this.boundingSphere && this.boundingSphere.visible) {
				boundingShape = this.boundingSphere;
				shapeType = 'sphere';
			} else if (this.boundingEllipsoid && this.boundingEllipsoid.visible) {
				boundingShape = this.boundingEllipsoid;
				shapeType = 'ellipsoid';
			} else {
				// Default to creating a bounding box if no shape is active
				const tempBox = this.createBoundingBox();
				boundingShape = tempBox;
				shapeType = 'box';
				tempBox.visible = false; // Hide the temporary box
			}
		} else {
			// If balance is not the active descriptor, create a temporary bounding box
			const tempBox = this.createBoundingBox();
			boundingShape = tempBox;
			shapeType = 'box';
			tempBox.visible = false; // Hide the temporary box
		}
		
		if (!boundingShape) {
			return null;
		}
		
		// Get the projected points for the support polygon based on the bounding shape type
		let supportPoints = [];
		
		if (shapeType === 'box') {
			// For box: get the 4 bottom corners
			const box = boundingShape;
			const size = new THREE.Vector3();
			box.geometry.computeBoundingBox();
			box.geometry.boundingBox.getSize(size);
			size.multiply(box.scale);
			
			const halfSizeX = size.x / 2;
			const halfSizeZ = size.z / 2;
			
			// Create the 4 corners of the support polygon (projected box)
			supportPoints = [
				new THREE.Vector3(box.position.x - halfSizeX, groundY, box.position.z - halfSizeZ),
				new THREE.Vector3(box.position.x + halfSizeX, groundY, box.position.z - halfSizeZ),
				new THREE.Vector3(box.position.x + halfSizeX, groundY, box.position.z + halfSizeZ),
				new THREE.Vector3(box.position.x - halfSizeX, groundY, box.position.z + halfSizeZ)
			];
		} 
		else if (shapeType === 'sphere') {
			// For sphere: get a circle on the ground plane
			const sphere = boundingShape;
			const radius = sphere.scale.x; // All scales should be the same for a sphere
			
			// Create a circle of points for the support polygon
			const segments = 12;
			for (let i = 0; i < segments; i++) {
				const angle = (i / segments) * Math.PI * 2;
				const x = sphere.position.x + Math.cos(angle) * radius;
				const z = sphere.position.z + Math.sin(angle) * radius;
				supportPoints.push(new THREE.Vector3(x, groundY, z));
			}
		} 
		else if (shapeType === 'ellipsoid') {
			// For ellipsoid: get an ellipse on the ground plane
			const ellipsoid = boundingShape;
			const radiusX = ellipsoid.scale.x;
			const radiusZ = ellipsoid.scale.z;
			
			// Create an ellipse of points for the support polygon
			const segments = 16;
			for (let i = 0; i < segments; i++) {
				const angle = (i / segments) * Math.PI * 2;
				const x = ellipsoid.position.x + Math.cos(angle) * radiusX;
				const z = ellipsoid.position.z + Math.sin(angle) * radiusZ;
				supportPoints.push(new THREE.Vector3(x, groundY, z));
			}
		}
		
		return supportPoints;
	}
	
	// Check if a point is inside a polygon (2D check on XZ plane)
	pointInSupportPolygon(point, polygonPoints) {
		// Implementation of the ray casting algorithm for point-in-polygon test
		let inside = false;
		for (let i = 0, j = polygonPoints.length - 1; i < polygonPoints.length; j = i++) {
			const xi = polygonPoints[i].x, zi = polygonPoints[i].z;
			const xj = polygonPoints[j].x, zj = polygonPoints[j].z;
			
			const intersect = ((zi > point.z) !== (zj > point.z)) &&
				(point.x < (xj - xi) * (point.z - zi) / (zj - zi) + xi);
				
			if (intersect) inside = !inside;
		}
		
		return inside;
	}
	
	// Create visual elements to represent the balance status
	createBalanceVisualization(comPosition, projectedCoM, supportPoints, groundY) {
		// Create a group for all balance visualization elements
		const balanceGroup = new THREE.Group();
		
		// 1. Create the support polygon visualization
		const supportGeometry = new THREE.BufferGeometry();
		supportGeometry.setFromPoints(supportPoints);
		
		// Close the polygon by connecting the last point back to the first
		const supportLines = [...supportPoints];
		if (supportPoints.length > 0) {
			supportLines.push(supportPoints[0].clone());
		}
		
		const supportLineGeometry = new THREE.BufferGeometry().setFromPoints(supportLines);
		const supportMaterial = new THREE.LineBasicMaterial({ 
			color: this.isBalanced ? 0x00ff00 : 0xff0000,
			linewidth: 2
		});
		
		this.supportPolygon = new THREE.Line(supportLineGeometry, supportMaterial);
		balanceGroup.add(this.supportPolygon);
		
		// 2. Create the projected CoM visualization
		const projectedGeometry = new THREE.SphereGeometry(3, 16, 16);
		const projectedMaterial = new THREE.MeshBasicMaterial({ 
			color: this.isBalanced ? 0x00ff00 : 0xff0000,
			transparent: true,
			opacity: 0.7
		});
		
		this.projectedCoM = new THREE.Mesh(projectedGeometry, projectedMaterial);
		this.projectedCoM.position.copy(projectedCoM);
		balanceGroup.add(this.projectedCoM);
		
		// 3. Create a vertical line from CoM to its projection
		const verticalLinePoints = [comPosition, projectedCoM];
		const verticalLineGeometry = new THREE.BufferGeometry().setFromPoints(verticalLinePoints);
		const verticalLineMaterial = new THREE.LineBasicMaterial({ 
			color: 0xffffff,
			transparent: true,
			opacity: 0.5
		});
		
		const verticalLine = new THREE.Line(verticalLineGeometry, verticalLineMaterial);
		balanceGroup.add(verticalLine);
		
		// 4. Create a status text indicator
		const balanceText = this.isBalanced ? "BALANCED (1)" : "UNBALANCED (0)";
		console.log(`Balance status: ${balanceText} (CoM projection ${this.isBalanced ? 'inside' : 'outside'} support polygon)`);
		
		// 5. Create a visual indicator box at the top of the scene
		const boxSize = 10;
		const boxGeometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
		const boxMaterial = new THREE.MeshBasicMaterial({ 
			color: this.isBalanced ? 0x00ff00 : 0xff0000,
			transparent: true,
			opacity: 0.7
		});
		
		this.balanceIndicator = new THREE.Mesh(boxGeometry, boxMaterial);
		// Position the indicator above the character
		this.balanceIndicator.position.set(
			comPosition.x, 
			comPosition.y + 50, 
			comPosition.z
		);
		balanceGroup.add(this.balanceIndicator);
		
		// Add the balance group to the descriptors group
		this.descriptorsGroup.add(balanceGroup);
		
		return balanceGroup;
	}
	
	updateBalance() {
		if (this.activeDescriptor === 'balance') {
			this.createBalance();
		}
	}
	
	// Initialize distance tracking
	initDistanceTracking() {
		// Clean up existing tracking elements
		if (this.distanceTracker) {
			this.descriptorsGroup.remove(this.distanceTracker);
		}
		
		// Create a container group for all distance tracking elements
		this.distanceTracker = new THREE.Group();
		this.descriptorsGroup.add(this.distanceTracker);
		
		// Reset tracking data
		this.pathPoints = [];
		this.pathColors = []; // Store colors for path segments
		this.pathSpeeds = []; // Store speed values for coloring
		this.totalDistance = 0;
		this.lastTrackedPosition = null;
		this.lastTrackedTime = performance.now() / 1000; // Track time for speed calculation
		this.distanceTrackingActive = true;
		this.markerDistance = 10; // Place a marker every 10 units
		this.nextMarkerAt = this.markerDistance; // Distance for next marker
		this.lastAnimationTime = 0; // Store last animation time to detect loops
		
		// Find ground level
		const groundY = this.findGroundLevel();
		
		// Use the currently selected joint
		const currentJointName = selectedJoint();
		const jointIndex = this.jointIndex[currentJointName] || 0;
		
		if (!this.sphereMeshes.children[jointIndex]) {
			console.error(`Selected joint ${currentJointName} not found for distance tracking`);
			return null;
		}
		
		// Get initial position
		const worldPos = new THREE.Vector3();
		this.sphereMeshes.children[jointIndex].getWorldPosition(worldPos);
		this.descriptorsGroup.parent.worldToLocal(worldPos);
		
		// Set the Y component to ground level (so we're tracking the projection on the floor)
		worldPos.y = groundY;
		this.lastTrackedPosition = worldPos.clone();
		this.pathPoints.push(worldPos.clone());
		this.pathSpeeds.push(0); // Initial speed is 0
		this.pathColors.push(this.getColorFromSpeed(0)); // Initial color
		
		// Create a ground reference plane for better visual context (semi-transparent)
		const groundSize = 300;
		const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
		const groundMaterial = new THREE.MeshBasicMaterial({
			color: 0xf0f0f0,
			transparent: true,
			opacity: 0.2,
			side: THREE.DoubleSide,
			depthWrite: false
		});
		
		const groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
		groundPlane.rotation.x = Math.PI / 2; // Make horizontal
		groundPlane.position.y = groundY + 0.1; // Slightly above ground level
		groundPlane.name = 'groundReferencePlane';
		this.distanceTracker.add(groundPlane);
		
		// Create enhanced information display panel
		this.createDistanceInfoPanel(currentJointName, groundY);
		
		// Create initial path visualization
		this.createPathVisualization();
		
		return this.distanceTracker;
	}
	
	// Create an enhanced information panel for distance data
	createDistanceInfoPanel(jointName, groundY) {
		// Remove previous HTML elements if they exist
		this.removeExistingHTMLPanel();
		
		// Create a new HTML element to display the distance tracking info
		const distanceDisplay = document.createElement('div');
		distanceDisplay.id = 'distance-tracker-hud';
		distanceDisplay.style.position = 'fixed';
		distanceDisplay.style.top = '20px';
		distanceDisplay.style.right = 'auto'; // Don't position from right
		distanceDisplay.style.left = '150px'; // Position from left instead
		distanceDisplay.style.padding = '5px';
		distanceDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
		distanceDisplay.style.color = 'white';
		distanceDisplay.style.fontFamily = 'Arial, sans-serif';
		distanceDisplay.style.fontSize = '14px';
		distanceDisplay.style.borderRadius = '5px';
		distanceDisplay.style.zIndex = '1000';
		distanceDisplay.style.textAlign = 'left';
		distanceDisplay.style.width = '200px';
		distanceDisplay.style.border = '1px solid rgba(0, 100, 200, 0.8)';
		distanceDisplay.style.boxShadow = '0px 0px 10px rgba(0, 0, 0, 0.5)';
		distanceDisplay.style.cursor = 'move'; // Add move cursor to indicate draggable
		
		// Add HTML content
		distanceDisplay.innerHTML = `
			<div style="background-color: rgba(0, 100, 200, 0.8); padding: 4px; border-radius: 4px 4px 0 0; text-align: center; font-weight: bold; cursor: move;" class="distance-tracker-header">
				Distance: ${jointName}
			</div>
			<div id="distance-value" style="padding: 4px; font-size: 16px;">
				Total: 0.00 units
			</div>
			<div id="speed-value" style="padding: 4px; color: rgb(100, 200, 255);">
				Speed: 0.00 units/s
			</div>
			<div style="padding: 4px; font-size: 11px;">
				Speed:
				<div style="width: 100%; height: 10px; background: linear-gradient(to right, blue, green, red);"></div>
			</div>
		`;
		
		// Append to document body
		document.body.appendChild(distanceDisplay);
		
		// Store reference to the elements we need to update
		this.distanceDisplay = distanceDisplay;
		this.distanceValueElement = document.getElementById('distance-value');
		this.speedValueElement = document.getElementById('speed-value');
		
		// Make the panel draggable
		this.makeDistancePanelDraggable(distanceDisplay);
	}
	
	// Make the distance panel draggable
	makeDistancePanelDraggable(element) {
		let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
		const header = element.querySelector('.distance-tracker-header') || element;
		
		header.onmousedown = dragMouseDown;
		
		function dragMouseDown(e) {
			e = e || window.event;
			e.preventDefault();
			// Get the mouse cursor position at startup
			pos3 = e.clientX;
			pos4 = e.clientY;
			document.onmouseup = closeDragElement;
			// Call a function whenever the cursor moves
			document.onmousemove = elementDrag;
		}
		
		function elementDrag(e) {
			e = e || window.event;
			e.preventDefault();
			// Calculate the new cursor position
			pos1 = pos3 - e.clientX;
			pos2 = pos4 - e.clientY;
			pos3 = e.clientX;
			pos4 = e.clientY;
			// Set the element's new position
			element.style.top = (element.offsetTop - pos2) + "px";
			element.style.left = (element.offsetLeft - pos1) + "px";
		}
		
		function closeDragElement() {
			// Stop moving when mouse button is released
			document.onmouseup = null;
			document.onmousemove = null;
		}
	}
	
	// Remove existing HTML panel if it exists
	removeExistingHTMLPanel() {
		const existingPanel = document.getElementById('distance-tracker-hud');
		if (existingPanel) {
			existingPanel.parentNode.removeChild(existingPanel);
		}
	}
	
	// Helper function to draw rounded rectangles on canvas
	roundRect(ctx, x, y, width, height, radius) {
		if (typeof radius === 'number') {
			radius = {tl: radius, tr: radius, br: radius, bl: radius};
		} else {
			radius = {...{tl: 0, tr: 0, br: 0, bl: 0}, ...radius};
		}
		ctx.beginPath();
		ctx.moveTo(x + radius.tl, y);
		ctx.lineTo(x + width - radius.tr, y);
		ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
		ctx.lineTo(x + width, y + height - radius.br);
		ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
		ctx.lineTo(x + radius.bl, y + height);
		ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
		ctx.lineTo(x, y + radius.tl);
		ctx.quadraticCurveTo(x, y, x + radius.tl, y);
		ctx.closePath();
	}
	
	// Create the path visualization with color-coding
	createPathVisualization() {
		// Remove existing path if any
		const existingPath = this.distanceTracker.getObjectByName('pathLine');
		if (existingPath) {
			this.distanceTracker.remove(existingPath);
		}
		
		// Create a group for the path visualization
		const pathGroup = new THREE.Group();
		pathGroup.name = 'pathLine';
		this.distanceTracker.add(pathGroup);
		
		// Create multi-colored line segments
		if (this.pathPoints.length < 2) return;
		
		for (let i = 1; i < this.pathPoints.length; i++) {
			// Create a line segment between consecutive points with color based on speed
			const segmentGeometry = new THREE.BufferGeometry().setFromPoints([
				this.pathPoints[i-1], 
				this.pathPoints[i]
			]);
			
			const segmentMaterial = new THREE.LineBasicMaterial({ 
				color: this.pathColors[i-1],
				linewidth: 3
			});
			
			const lineSegment = new THREE.Line(segmentGeometry, segmentMaterial);
			pathGroup.add(lineSegment);
		}
		
		// Add distance markers at regular intervals
		this.createDistanceMarkers(pathGroup);
	}
	
	// Create distance markers along the path
	createDistanceMarkers(pathGroup) {
		// Clear existing markers first
		const existingMarkers = this.distanceTracker.getObjectByName('distanceMarkers');
		if (existingMarkers) {
			this.distanceTracker.remove(existingMarkers);
		}
		
		const markersGroup = new THREE.Group();
		markersGroup.name = 'distanceMarkers';
		this.distanceTracker.add(markersGroup);
		
		// Calculate positions for markers at regular distances
		let currentDistance = this.markerDistance;
		let cumulativeDistance = 0;
		
		for (let i = 1; i < this.pathPoints.length; i++) {
			const lastPos = this.pathPoints[i-1];
			const currentPos = this.pathPoints[i];
			const segmentLength = lastPos.distanceTo(currentPos);
			
			// Check if we cross a marker threshold in this segment
			if (cumulativeDistance + segmentLength >= currentDistance) {
				// Calculate how far along this segment the marker should be
				const fraction = (currentDistance - cumulativeDistance) / segmentLength;
				const markerPos = new THREE.Vector3().lerpVectors(lastPos, currentPos, fraction);
				
				// Create marker geometry
				const markerGeometry = new THREE.CircleGeometry(1, 16);
				const markerMaterial = new THREE.MeshBasicMaterial({ 
					color: 0xffff00,
					side: THREE.DoubleSide
				});
				
				const marker = new THREE.Mesh(markerGeometry, markerMaterial);
				marker.position.copy(markerPos);
				marker.rotation.x = -Math.PI/2; // Make horizontal
				markersGroup.add(marker);
				
				// Create text label for distance
				this.createDistanceLabel(markersGroup, markerPos.clone(), currentDistance);
				
				// Set up the next marker distance
				currentDistance += this.markerDistance;
			}
			
			cumulativeDistance += segmentLength;
		}
	}
	
	// Create a text label for a distance marker
	createDistanceLabel(group, position, distance) {
		const canvas = document.createElement('canvas');
		canvas.width = 64;
		canvas.height = 32;
		const context = canvas.getContext('2d');
		
		// Draw background
		context.fillStyle = 'rgba(0, 0, 0, 0.7)';
		this.roundRect(context, 0, 0, canvas.width, canvas.height, 5);
		context.fill();
		
		// Draw text
		context.font = 'bold 16px Arial';
		context.fillStyle = 'white';
		context.textAlign = 'center';
		context.fillText(`${distance.toFixed(0)}`, canvas.width/2, canvas.height/2 + 5);
		
		// Create sprite
		const texture = new THREE.CanvasTexture(canvas);
		const material = new THREE.SpriteMaterial({ 
			map: texture,
			transparent: true
		});
		
		const label = new THREE.Sprite(material);
		label.position.copy(position);
		label.position.y += 3; // Raise above the ground
		label.scale.set(6, 3, 1);
		group.add(label);
	}
	
	// Map speed value to color
	getColorFromSpeed(speed) {
		// Define color stops for the gradient
		const colorStops = [
			{ speed: 0, color: new THREE.Color(0x0000ff) },   // Blue for slow
			{ speed: 20, color: new THREE.Color(0x00ff00) },  // Green for medium
			{ speed: 50, color: new THREE.Color(0xff0000) }   // Red for fast
		];
		
		// Find appropriate color range
		for (let i = 0; i < colorStops.length - 1; i++) {
			if (speed <= colorStops[i+1].speed) {
				// Calculate interpolation factor between the two color stops
				const factor = (speed - colorStops[i].speed) / 
							   (colorStops[i+1].speed - colorStops[i].speed);
				
				// Create a new color interpolated between the two stops
				const color = new THREE.Color().lerpColors(
					colorStops[i].color,
					colorStops[i+1].color,
					factor
				);
				
				return color;
			}
		}
		
		// If speed is higher than the max defined, return the last color
		return colorStops[colorStops.length - 1].color;
	}
	
	// Update distance tracking with current position
	updateDistanceTracking() {
		if (!this.distanceTrackingActive || !this.distanceTracker) {
			return;
		}
		
		// Use the currently selected joint
		const currentJointName = selectedJoint();
		const jointIndex = this.jointIndex[currentJointName] || 0;
		
		if (!this.sphereMeshes.children[jointIndex]) {
			return;
		}
		
		// Get current animation time to detect loops
		const currentAnimationTime = this.mixer ? this.mixer.time : 0;
		const isPlaying = playPressed();
		
		// Check if animation has looped (current time is significantly less than last time)
		// This happens when animation restarts from the beginning
		if (this.lastAnimationTime > 0 && 
		    ((currentAnimationTime < this.lastAnimationTime && 
		    (this.lastAnimationTime - currentAnimationTime) > 0.5) ||
		    // Also reset when manually restarting the animation
		    (currentAnimationTime === 0 && this.lastAnimationTime > 0.5))) {
		    
		    console.log("Animation loop/restart detected - resetting distance tracking");
		    this.resetDistanceTracking();
		    return;
		}
		
		// Only track distance if animation is actually playing
		if (!isPlaying) {
		    // Still store current time for comparison
		    this.lastAnimationTime = currentAnimationTime;
		    return;
		}
		
		// Store current time for next comparison
		this.lastAnimationTime = currentAnimationTime;
		
		// Get current time for speed calculation
		const currentTime = performance.now() / 1000;
		const deltaTime = currentTime - this.lastTrackedTime;
		
		// Get current position
		const worldPos = new THREE.Vector3();
		this.sphereMeshes.children[jointIndex].getWorldPosition(worldPos);
		this.descriptorsGroup.parent.worldToLocal(worldPos);
		
		// Get ground level
		const groundY = this.findGroundLevel();
		
		// Set the Y component to ground level (tracking projection on floor)
		worldPos.y = groundY;
		
		// Calculate distance and speed
		if (this.lastTrackedPosition && deltaTime > 0) {
			// Create temporary vectors with Y set to 0 to measure XZ distance only
			const lastPos2D = new THREE.Vector3(this.lastTrackedPosition.x, 0, this.lastTrackedPosition.z);
			const currPos2D = new THREE.Vector3(worldPos.x, 0, worldPos.z);
			
			// Calculate distance between points
			const segmentDistance = lastPos2D.distanceTo(currPos2D);
			const speed = segmentDistance / deltaTime;
			
			// Only add to path if moved a significant distance (to avoid tiny segments)
			// Reduced threshold for more accurate tracking
			if (segmentDistance > 0.1) {
				this.pathPoints.push(worldPos.clone());
				this.pathSpeeds.push(speed);
				this.pathColors.push(this.getColorFromSpeed(speed));
				this.totalDistance += segmentDistance;
				this.lastTrackedPosition = worldPos.clone();
				this.lastTrackedTime = currentTime;
				
				// Update visualization
				this.createPathVisualization();
				this.updateDistanceInfoPanel(speed);
			}
		} else if (!this.lastTrackedPosition) {
			// Initialize tracking position if this is the first update
			this.lastTrackedPosition = worldPos.clone();
			this.lastTrackedTime = currentTime;
		}
	}
	
	// Update the information panel with new distance and speed data
	updateDistanceInfoPanel(currentSpeed) {
		// Update the HTML elements
		if (this.distanceValueElement && this.speedValueElement) {
			// Update distance value
			this.distanceValueElement.textContent = `Total: ${this.totalDistance.toFixed(2)} units`;
			
			// Update speed with color coding based on speed
			this.speedValueElement.textContent = `Speed: ${currentSpeed.toFixed(2)} units/s`;
			
			// Apply color to speed text based on value
			let speedColor = 'rgb(100, 200, 255)'; // Default blue for slow
			if (currentSpeed >= 30) {
				speedColor = 'rgb(255, 100, 100)'; // Red for fast
			} else if (currentSpeed >= 10) {
				speedColor = 'rgb(100, 255, 100)'; // Green for medium
			}
			this.speedValueElement.style.color = speedColor;
		}
	}
	
	// Reset distance tracking
	resetDistanceTracking() {
		this.pathPoints = [];
		this.pathColors = [];
		this.pathSpeeds = [];
		this.totalDistance = 0;
		this.lastTrackedPosition = null;
		this.lastTrackedTime = performance.now() / 1000;
		this.nextMarkerAt = this.markerDistance;
		
		if (this.distanceTrackingActive && this.distanceTracker) {
			this.initDistanceTracking();
		}
	}
}

export default SkeletonViewer
