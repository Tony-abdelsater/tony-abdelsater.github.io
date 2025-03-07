import { loadFile } from "./useSceneSetup"

import { Select } from "@kobalte/core"

import {
	baseScene,
	setBaseScene,
	setSelectedBVH,
	selectedBVH,
	isBVHdefault,
	setIsBVHdefault,
} from "./store"

function cleanBVHpath(file) {
	//just for avoiding error!

	return file
}
function BVHSelector() {
	const BVH_list = [
		"GBBSS01G03R01.bvh",
		"GBBSS01G03R02.bvh",
		"GBBSS01G03R03.bvh",
		"GBBSS01G03R04.bvh",
		"GBBSS01G03R05.bvh",
		"MCEAS02G01R01.bvh",
		"MCEAS02G01R02.bvh",
		"MCEAS02G01R03.bvh",
		"PLNS01P02R05.bvh",
		"PLNS02P03R02.bvh",
		// "running.bvh",
		"S4P07R1.bvh",
		"S4P07R2.bvh",
		"S4P07R3.bvh",
		"SWMLS01G01R01.bvh",
		"SWMLS01G01R02.bvh",
		"Test_Bending.bvh",
		"Test_Glassblowing.bvh",
		"Train_Bending.bvh",
		"Train_Glassblowing.bvh",
		"TV_S01P01R13.bvh",
		"TVBS01P01R02.bvh",
		"TVBS01P02R07.bvh",
		"TVBS01P03R09.bvh",
	]

	return (
		<>
			<Select.Root
				// defaultValue={"MCEAS02G01R03.bvh"}
				// value={" "}
				defaultValue={isBVHdefault() ? "MCEAS02G01R03.bvh" : " "}
				options={BVH_list}
				allowDuplicateSelectionEvents={false}
				disallowEmptySelection={true}
				onChange={async (file) => {
					const file_path = "bvh2/" + file
					loadFile(file_path, "")
					setSelectedBVH(file_path)

					console.log("Selected Skeleton File: ", file, selectedBVH())
				}}
				placeholder="Select a BVH file..."
				itemComponent={(props) => (
					<Select.Item item={props.item} class="select__item">
						<Select.ItemLabel>
							{props.item.rawValue}
						</Select.ItemLabel>
						<Select.ItemIndicator class="select__item-indicator"></Select.ItemIndicator>
					</Select.Item>
				)}
			>
				<Select.Trigger class="select__trigger" aria-label="Fruit">
					<Select.Value class="select__value">
						{(state) => cleanBVHpath(state.selectedOption())}
					</Select.Value>
					<Select.Icon class="select__icon"></Select.Icon>
				</Select.Trigger>
				<Select.Description id="BVHSelectLabel">
					Choose file.
				</Select.Description>

				<Select.Portal>
					<Select.Content class="select__content">
						<Select.Listbox class="select__listbox" />
					</Select.Content>
				</Select.Portal>
			</Select.Root>
		</>
	)
}
export { BVHSelector }
