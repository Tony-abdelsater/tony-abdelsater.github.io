import {
	ColDef,
	ColGroupDef,
	GridApi,
	GridOptions,
	ModuleRegistry,
	createGrid,
	ValueFormatterParams,
} from "ag-grid-community"

import {
	setSplitterSizeL,
	setSplitterSizeR,
	inputGOM,
	outputGOM,
	setOutputGOM,
	selectedJoint,
	axisSelected,
	setAxisSelected,
	selectedAssumptionsIndex,
	df_coef,
	set_df_coef,
	df_pred,
	set_df_pred,
	df_coef_sub,
	set_df_coef_sub,
	df_A1,
	set_df_A1,
	df_A2,
	set_df_A2,
	df_A3,
	set_df_A3,
	df_A4,
	set_df_A4,
	df_A5,
	set_df_A5,
	df_A6,
	set_df_A6,
	selectedRow,
	setSelectedRow,
	df_coef_mod,
	skeletonViewersSig,
} from "./store"

import * as aq from "arquero"
import { op } from "arquero"

// import { myScene } from "./myScene_hide"
import { createVectorPLot } from "./plots"
import { createSignal } from "solid-js"

const variables = [
	"Spine_Xrotation",
	"Spine_Yrotation",
	"Spine_Zrotation",
	"Spine1_Xrotation",
	"Spine1_Yrotation",
	"Spine1_Zrotation",
	"Spine2_Xrotation",
	"Spine2_Yrotation",
	"Spine2_Zrotation",
	"Spine3_Xrotation",
	"Spine3_Yrotation",
	"Spine3_Zrotation",
	"Hips_Xrotation",
	"Hips_Yrotation",
	"Hips_Zrotation",
	"Neck_Xrotation",
	"Neck_Yrotation",
	"Neck_Zrotation",
	"Head_Xrotation",
	"Head_Yrotation",
	"Head_Zrotation",
	"LeftArm_Xrotation",
	"LeftArm_Yrotation",
	"LeftArm_Zrotation",
	"LeftForeArm_Xrotation",
	"LeftForeArm_Yrotation",
	"LeftForeArm_Zrotation",
	"RightArm_Xrotation",
	"RightArm_Yrotation",
	"RightArm_Zrotation",
	"RightForeArm_Xrotation",
	"RightForeArm_Yrotation",
	"RightForeArm_Zrotation",
	"LeftShoulder_Xrotation",
	"LeftShoulder_Yrotation",
	"LeftShoulder_Zrotation",
	"LeftShoulder2_Xrotation",
	"LeftShoulder2_Yrotation",
	"LeftShoulder2_Zrotation",
	"RightShoulder_Xrotation",
	"RightShoulder_Yrotation",
	"RightShoulder_Zrotation",
	"RightShoulder2_Xrotation",
	"RightShoulder2_Yrotation",
	"RightShoulder2_Zrotation",
	"LeftUpLeg_Xrotation",
	"LeftUpLeg_Yrotation",
	"LeftUpLeg_Zrotation",
	"LeftLeg_Xrotation",
	"LeftLeg_Yrotation",
	"LeftLeg_Zrotation",
	"RightUpLeg_Xrotation",
	"RightUpLeg_Yrotation",
	"RightUpLeg_Zrotation",
	"RightLeg_Xrotation",
	"RightLeg_Yrotation",
	"RightLeg_Zrotation",
]

const varSub = [
	"sp0x",
	"sp0y",
	"sp0z",
	"sp1x",
	"sp1y",
	"sp1z",
	"sp2x",
	"sp2y",
	"sp2z",
	"sp3x",
	"sp3y",
	"sp3z",
	"hipx",
	"hipy",
	"hipz",
	"nex",
	"ney",
	"nez",
	"hex",
	"hey",
	"hez",
	"lax",
	"lay",
	"laz",
	"lfax",
	"lfay",
	"lfaz",
	"rax",
	"ray",
	"raz",
	"rfax",
	"rfay",
	"rfaz",
	"lshx",
	"lshy",
	"lshz",
	"lsh2x",
	"lsh2y",
	"lsh2z",
	"rshx",
	"rshy",
	"rshz",
	"rsh2x",
	"rsh2y",
	"rsh2z",
	"lupx",
	"lupy",
	"lupz",
	"llx",
	"lly",
	"llz",
	"rupx",
	"rupy",
	"rupz",
	"rlx",
	"rly",
	"rlz",
]
let gridApi

async function onSelectionChangedTable() {
	const selectedRows = await gridApi.getSelectedRows()
	await setSelectedRow(selectedRows[0]["Variables"])
	await console.log(selectedRows[0]["Variables"])
	await createPlotSeries()
}

async function createPlotSeries() {
	let dataSeriesUnmodified = await df_coef().array(selectedRow())

	let dataSeriesModified = await df_coef_mod().array(selectedRow())
	await createVectorPLot(dataSeriesUnmodified, dataSeriesModified)
}

async function displayTable(df) {
	// function transformNumber(params: ValueFormatterParams) {
	// 	if (
	// 		typeof params.value === "number" &&
	// 		!Number.isInteger(params.value)
	// 	) {
	// 		return parseFloat(params.value.toFixed(6))
	// 	} else if (Number.isInteger(params.value)) {
	// 		return params.value
	// 	} else {
	// 		throw new Error("Input must be a number")
	// 	}
	// }

	const columns = df.columnNames()
	const transformedColumns = columns.map((column) => {
		if (column === "Index") {
			return {
				headerName: "id",
				field: column,
				floatingFilter: false,
			}
		} else {
			return {
				field: column,
				filter: "agTextColumnFilter",
				floatingFilter: true,
			}
		}
	})
	const data = df.objects()

	const gridOptions: GridOptions = {
		columnDefs: transformedColumns,
		autoSizeStrategy: {
			type: "fitCellContents",
		},
		defaultColDef: {
			// filter: "agTextColumnFilter",
			// floatingFilter: true,
		},
		rowSelection: "single",
		pagination: true,
		paginationPageSize: 200,
		paginationPageSizeSelector: [200],
		rowData: data,
		onSelectionChanged: onSelectionChangedTable,
		domLayout: "normal",
	}
	// const gridDiv = document.querySelector("#plotTable")
	const gridDiv = document.querySelector<HTMLElement>("#plotTable")!

	// Create the grid only if it doesn't already exist
	if (!gridApi) {
		gridApi = createGrid(gridDiv, gridOptions)
	} else {
		// Update the existing grid's data
		gridApi.setGridOption("rowData", data)
		gridApi.setGridOption("columnDefs", transformedColumns)
	}

	gridApi.getRowNode(0).setSelected(true, false)
}

async function CreateTableJoint(df_coef, df_pred) {
	const columnName = `${selectedJoint()}_${axisSelected()}rotation`

	const index = variables.indexOf(columnName)
	const j_var = varSub[index]
	console.log("columnName: ", columnName)
	console.log("index: ", index)
	console.log("j_var: ", j_var)

	const filteredColumns = df_coef
		.columnNames()
		.filter((col) => col.startsWith(j_var))
	let df_coef_sub = df_coef.select(aq.names(filteredColumns))
	const all_sub_Columns = df_coef_sub.columnNames()
	const columnsToDrop = all_sub_Columns.filter((col) => col.includes("t-3"))
	df_coef_sub = df_coef_sub.select(aq.not(columnsToDrop))

	return df_coef_sub
}

async function CreateTableA1(df_coef_sub) {
	const columnName = `${selectedJoint()}_${axisSelected()}rotation`
	const dfCoef_A1_filter = df_coef_sub
		.columnNames()
		.filter((col) => col.includes(columnName))

	const dfCoef_A1 = df_coef_sub.select(aq.names(dfCoef_A1_filter))
	const indexArray = Array.from(
		{ length: dfCoef_A1.numCols() },
		(_, i) => i + 1
	)
	const df_A1 = aq.table({
		Index: indexArray,
		Variables: dfCoef_A1.columnNames(),
	})
	return df_A1
}

async function CreateTableA2(df_coef_sub) {
	const columnName = `${selectedJoint()}_`
	const dfCoef_A2_filter = df_coef_sub
		.columnNames()
		.filter((col) => col.includes(columnName))

	let dfCoef_A2 = df_coef_sub.select(aq.names(dfCoef_A2_filter))
	const all_sub_Columns = dfCoef_A2.columnNames()
	const columnsToDrop = all_sub_Columns.filter((col) =>
		col.includes(axisSelected())
	)
	dfCoef_A2 = dfCoef_A2.select(aq.not(columnsToDrop))

	const indexArray = Array.from(
		{ length: dfCoef_A2.numCols() },
		(_, i) => i + 1
	)
	const df_A2 = aq.table({
		Index: indexArray,
		Variables: dfCoef_A2.columnNames(),
	})
	return df_A2
}

async function CreateTableA3(df_coef_sub) {
	const nosynergy = [
		"Spine",
		"Spine1",
		"Spine2",
		"Spine3",
		"Hips",
		"Neck",
		"Head",
	]

	if (!nosynergy.includes(selectedJoint())) {
		let selectAngleC
		if (selectedJoint().startsWith("Right")) {
			selectAngleC = selectedJoint().replace("Right", "Left")
		} else if (selectedJoint().startsWith("Left")) {
			selectAngleC = selectedJoint().replace("Left", "Right")
		}

		const dfCoef_A3_filter = df_coef_sub
			.columnNames()
			.filter((col) => col.includes(selectAngleC))

		let dfCoef_A3 = df_coef_sub.select(aq.names(dfCoef_A3_filter))
		const indexArray = Array.from(
			{ length: dfCoef_A3.numCols() },
			(_, i) => i + 1
		)
		const df_A3 = aq.table({
			Index: indexArray,
			Variables: dfCoef_A3.columnNames(),
		})
		return df_A3
	} else {
		const df_A3 = aq.table({
			Index: ["-"],
			Variables: ["-No Synergy-"],
		})
		return df_A3
	}
}

async function CreateTableA4(df_coef_sub) {
	let listA41

	const index = skeletonViewersSig()[0].jointIndex[selectedJoint()]
	const bone = skeletonViewersSig()[0].globalResult.skeleton.bones[index]

	if (!bone.children || bone.children.length === 0) {
		listA41 = bone.parent ? [bone.parent.name] : null
	} else if (!bone.parent) {
		listA41 = bone.children.map((child) => child.name)
	} else {
		listA41 = bone.children
			.map((child) => child.name)
			.concat(bone.parent.name)
	}
	// console.log(listA41)

	if (listA41) {
		listA41 = listA41.filter((name) => name !== "")
		listA41 = listA41.map((name) => name + "_")

		// console.log(listA41)

		const dfCoef_A4_filter = df_coef_sub
			.columnNames()
			.filter((col) => listA41.some((name) => col.includes(name)))

		const dfCoef_A4 = df_coef_sub.select(aq.names(dfCoef_A4_filter))
		const indexArray = Array.from(
			{ length: dfCoef_A4.numCols() },
			(_, i) => i + 1
		)
		const df_A4 = aq.table({
			Index: indexArray,
			Variables: dfCoef_A4.columnNames(),
		})
		// console.log(df_A4.array("Variables"))
		return df_A4
	} else {
		console.log("No valid bone names found in listA41.")
	}
}

async function CreateTableA5(df_coef_sub) {
	const namesToDropConcat = df_A1()
		.array("Variables")
		.concat(df_A2().array("Variables"))
		.concat(df_A3().array("Variables"))
		.concat(df_A4().array("Variables"))

	const dfCoef_A5 = df_coef_sub.select(aq.not(namesToDropConcat))

	const indexArray = Array.from(
		{ length: dfCoef_A5.numCols() },
		(_, i) => i + 1
	)
	const df_A5 = aq.table({
		Index: indexArray,
		Variables: dfCoef_A5.columnNames(),
	})

	return df_A5
}

async function CreateTableA6(df_coef_sub) {
	const meanRollupObj = {}
	const quantile25RollupObj = {}
	const quantile50RollupObj = {}
	const quantile75RollupObj = {}
	const stdevRollupObj = {}
	const minRollupObj = {}
	const maxRollupObj = {}

	for (const col_name of df_coef_sub.columnNames()) {
		// https://uwdata.github.io/arquero/api/expressions
		// https://talk.observablehq.com/t/dynamic-rollup-object-for-arquero/4721/4
		meanRollupObj[`${col_name}`] = `d =>  op.mean(d["${col_name}"])`
		minRollupObj[`${col_name}`] = `d =>  op.min(d["${col_name}"])`
		maxRollupObj[`${col_name}`] = `d =>  op.max(d["${col_name}"])`
		quantile25RollupObj[
			`${col_name}`
		] = `d =>  op.quantile(d["${col_name}"],0.25)`
		quantile50RollupObj[
			`${col_name}`
		] = `d =>  op.quantile(d["${col_name}"],0.5)`
		quantile75RollupObj[
			`${col_name}`
		] = `d =>  op.quantile(d["${col_name}"],0.75)`
		stdevRollupObj[`${col_name}`] = `d =>  op.stdev(d["${col_name}"])`
	} // for
	const means = df_coef_sub.rollup(meanRollupObj)
	const mins = df_coef_sub.rollup(minRollupObj)

	const maxs = df_coef_sub.rollup(maxRollupObj)

	const q25s = df_coef_sub.rollup(quantile25RollupObj)

	const q50s = df_coef_sub.rollup(quantile50RollupObj)
	const q75s = df_coef_sub.rollup(quantile75RollupObj)
	const stdevs = df_coef_sub.rollup(stdevRollupObj)

	const counts = df_coef_sub.rollup({ count: (d) => op.count() })

	const arrayWithTwenty = new Array(means.numCols()).fill(counts.get("count"))

	// console.log("data_array", Object.values(means.object(0)))

	const indexArray = Array.from({ length: means.numCols() }, (_, i) => i + 1)

	const df_A6 = aq.table({
		Index: indexArray,
		Variables: means.columnNames(),
		count: arrayWithTwenty,
		mean: Object.values(means.object(0)),
		std: Object.values(stdevs.object(0)),
		min: Object.values(mins.object(0)),
		q25: Object.values(q25s.object(0)),
		q50: Object.values(q50s.object(0)),
		q75: Object.values(q75s.object(0)),
		max: Object.values(maxs.object(0)),
	})

	return df_A6
}

export {
	displayTable,
	CreateTableJoint,
	CreateTableA1,
	CreateTableA2,
	CreateTableA3,
	CreateTableA4,
	CreateTableA5,
	CreateTableA6,
	onSelectionChangedTable,
}
