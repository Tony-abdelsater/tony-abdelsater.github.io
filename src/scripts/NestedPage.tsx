import { createForm, insert, remove } from "@modular-forms/solid"
import { For, createEffect, onMount, createSignal } from "solid-js"
import { BVHSelector } from "./bvhSelector"
import {
	skeletons,
	setSkeletons,
	setSelectedBVH,
	selectedBVH,
	skeletonsArray,
	setSkeletonsArray,
	uploadOutput,
	setUploadOutput,
	setIsBVHdefault,
} from "./store" // Import shared state

type NestedForm = {
	options: string[]
}

const initialValues = {
	options: ["Option 1"],
}

export default function SimplifiedForm() {
	const [form, { Field, FieldArray }] = createForm<NestedForm>({
		initialValues,
	})

	let fileIsChanged = false

	let previousBVH = null // Keep track of the previous value of selectedBVH
	// const [skelIndex, setSkelIndex] = createSignal(1)

	let isFirstRun = true // Initialize the flag

	createEffect(() => {
		selectedBVH()
		if (isFirstRun) {
			isFirstRun = false // Skip the first execution
		} else {
			fileIsChanged = true // Your logic here
		}
	})

	async function uploadFile(obj, file_path, index) {
		const file = URL.createObjectURL(obj)

		const parts = file_path.split("\\") // Splits the string by '/' into an array
		const lastPart = parts[parts.length - 1] // Gets the last element of the array

		console.log(file)

		if (lastPart.endsWith(".bvh")) {
			// Ενημέρωσε το συγκεκριμένο index στο uploadOutputs
			setUploadOutput((prev) => ({ ...prev, [index]: lastPart }))
			setSelectedBVH(file) // Διατήρησε το URL αν χρειάζεται
		} else {
			setUploadOutput((prev) => ({
				...prev,
				[index]: "Please upload a .bvh file only!",
			}))
		}
	}

	function createSkeletonArray(fileName, index) {
		// This logic was previously inside createEffect
		if (!fileName || fileName === previousBVH) {
			console.log("No change detected in selected BVH.")
			return
		}

		previousBVH = fileName
		console.log("Selected BVH updated reactively:", fileName)

		// The rest of the logic remains the same
		const updatedSkeletons = [...skeletonsArray()]
		const label = `Skeleton ${index}`

		const cleanedSkeletons = updatedSkeletons.filter(
			(skeleton) => skeleton.fileName && skeleton.fileName.trim() !== ""
		)

		const existingIndex = cleanedSkeletons.findIndex(
			(skeleton) => skeleton.label === label
		)

		if (existingIndex !== -1) {
			cleanedSkeletons[existingIndex].fileName = fileName
		} else {
			cleanedSkeletons.push({ label, fileName })
		}

		setSkeletonsArray(cleanedSkeletons)
		console.log("Updated skeletons array:", cleanedSkeletons)
	}
	onMount(() => {
		createSkeletonArray("bvh2/MCEAS02G01R03.bvh", 1)
		setSelectedBVH("bvh2/MCEAS02G01R03.bvh")
		setIsBVHdefault(false)
	})

	return (
		<>
			<FieldArray name="options">
				{(fieldArray) => (
					<>
						<For each={fieldArray.items}>
							{(_, index) => (
								<div>
									<div class="toolbarDescription">
										Skeleton {index() + 1}
									</div>

									<Field
										name={`${fieldArray.name}.${index()}`}
									>
										{(_, props) => (
											<>
												<div class="toolbarDescription">
													Select File from Repository:
												</div>

												{/* Use onClickCapture to ensure event is caught before it reaches BVHSelector */}
												<div
													onClick={() => {
														console.log(
															"Clicked on Skeleton:",
															index() + 1
														)
														if (fileIsChanged) {
															createSkeletonArray(
																selectedBVH(),
																index() + 1
															)
														}
														fileIsChanged = false
													}}
												>
													<BVHSelector {...props} />
												</div>

												<div
													class="toolbarDescription"
													style="margin-bottom: 0; margin-top: -20px; padding: 0;"
												>
													or
												</div>

												<div class="upload-container">
													<label
														for={`file-upload-${index()}`}
														class="custom-file-upload"
													>
														Upload File
													</label>
													<input
														id={`file-upload-${index()}`}
														type="file"
														onChange={async (e) => {
															console.log(
																"Clicked2 on Skeleton:",
																index() + 1
															)
															console.log(
																"check target: ",
																e.target
																	.files[0],
																e.target.value
															)
															await uploadFile(
																e.target
																	.files[0],
																e.target.value,
																index()
															)
															if (fileIsChanged) {
																createSkeletonArray(
																	selectedBVH(),
																	index() + 1
																)
															}
															fileIsChanged =
																false
														}}
													/>
													<span class="file-info">
														{uploadOutput()[
															index()
														] ??
															"No file uploaded yet"}
													</span>
												</div>
											</>
										)}
									</Field>

									<button
										type="button"
										onClick={() => {
											const updatedSkeletons =
												skeletonsArray().filter(
													(_, i) => i !== index()
												)
											setSkeletonsArray(updatedSkeletons)
											remove(form, fieldArray.name, {
												at: index(),
											})
										}}
									>
										Delete Option
									</button>
								</div>
							)}
						</For>

						<button
							type="button"
							onClick={() => {
								insert(form, fieldArray.name, { value: "" })
								createSkeletonArray("", fieldArray.items.length)
							}}
						>
							Add Option
						</button>
					</>
				)}
			</FieldArray>
			{/* <button
				type="submit"
				onClick={() => {
					const randomFile = [
						"File1.bvh",
						"File2.bvh",
						"File3.bvh",
						"File4.bvh",
						"File5.bvh",
					][Math.floor(Math.random() * 5)]
					setSelectedBVH(randomFile)
					console.log("Random BVH selected:", randomFile)
				}}
			>
				Submit
			</button>{" "} */}
		</>
	)
}
