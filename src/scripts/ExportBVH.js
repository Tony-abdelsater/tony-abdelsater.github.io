import { Quaternion, Vector3, Euler } from "three"

function exportBVH(skeleton, clip) {
	const hierarchy = buildHierarchy(skeleton)
	const motion = buildMotion(skeleton, clip)
	return `${hierarchy}\n${motion}`
}

function buildHierarchy(skeleton) {
	const lines = ["HIERARCHY"]
	const rootBone = skeleton.bones[0]
	processBone(rootBone, lines, 0, true)
	return lines.join("\n")
}

function processBone(bone, lines, level, isRoot = false) {
	const indent = "\t".repeat(level)
	const jointType = isRoot ? "ROOT" : "JOINT"

	if (bone.name.endsWith("_end")) {
		lines.push(`${indent}End Site`)
		lines.push(`${indent}{`)
		lines.push(
			`${indent}\tOFFSET ${bone.position.x.toFixed(
				4
			)} ${bone.position.y.toFixed(4)} ${bone.position.z.toFixed(4)}`
		)
		lines.push(`${indent}}`)
	} else {
		const offsetX = (bone.position.x / 2).toFixed(4)
		const offsetY = (bone.position.y / 2).toFixed(4)
		const offsetZ = (bone.position.z / 2).toFixed(4)

		lines.push(`${indent}${jointType} ${bone.name}`)
		lines.push(`${indent}{`)
		lines.push(`${indent}\tOFFSET ${offsetX} ${offsetY} ${offsetZ}`)
		lines.push(
			`${indent}\tCHANNELS 6 Xposition Yposition Zposition Zrotation Xrotation Yrotation`
		)

		for (let i = 0; i < bone.children.length; i++) {
			processBone(bone.children[i], lines, level + 1)
		}

		lines.push(`${indent}}`)
	}
}

function buildMotion(skeleton, clip) {
	const lines = ["MOTION"]
	const numFrames = Math.round(
		clip.duration / (clip.tracks[0].times[1] - clip.tracks[0].times[0])
	)
	const frameTime = clip.tracks[0].times[1] - clip.tracks[0].times[0]

	lines.push(`Frames: ${numFrames}`)
	lines.push(`Frame Time: ${frameTime.toFixed(8)}`)

	for (let i = 0; i < numFrames; i++) {
		const frameData = buildFrameData(skeleton, clip, i)
		lines.push(frameData.join(" "))
	}

	return lines.join("\n")
}

function buildFrameData(skeleton, clip, frameIndex) {
	const frameData = []
	for (let bone of skeleton.bones) {
		const positionTrack = clip.tracks.find(
			(track) => track.name === `${bone.name}.position`
		)
		const rotationTrack = clip.tracks.find(
			(track) => track.name === `${bone.name}.quaternion`
		)

		if (positionTrack && rotationTrack) {
			const position = new Vector3().fromArray(
				positionTrack.values,
				frameIndex * 3
			)
			const rotation = new Quaternion().fromArray(
				rotationTrack.values,
				frameIndex * 4
			)

			frameData.push(
				(position.x / 2).toFixed(4),
				(position.y / 2).toFixed(4),
				(position.z / 2).toFixed(4)
			)

			const euler = new Euler()
			euler.setFromQuaternion(rotation, "ZXY")
			frameData.push(
				((euler.z * 180) / Math.PI).toFixed(4),
				((euler.x * 180) / Math.PI).toFixed(4),
				((euler.y * 180) / Math.PI).toFixed(4)
			)
		}
	}
	return frameData
}
// Usage example
// const bvhData = exportBVH(skeleton, animationClip);
// console.log(bvhData);

export { exportBVH }
