import * as echarts from "echarts"
import "echarts-gl"
import {
	chart2D,
	setChart2D,
	positionsX_2D,
	positionsY_2D,
	positionsZ_2D,
	positionsX_3D,
	positionsY_3D,
	positionsZ_3D,
	chart3D,
	setChart3D,
	chartVector,
	setChartVector,
	name2DPlot,
	name3DPlot,
	selectedJoint,
	samplingFactor,
	selectedRow,
	set_df_coef_mod,
	df_coef_mod,
	chart2D_predict,
	setChart2D_predict,
	axisSelected,
	df_pred,
	df_pred_sampled,
	scaleX,
	skeletonViewersSig,
} from "./store"
import * as aq from "arquero"

import { createSignal, createEffect } from "solid-js"

// Function to calculate the mean of an array
function mean(data) {
	return data.reduce((acc, val) => acc + val, 0) / data.length
}

// Function to calculate the standard deviation of an array
function stdDev(data) {
	const mu = mean(data)
	const diffArr = data.map((a) => (a - mu) ** 2)
	return Math.sqrt(diffArr.reduce((acc, val) => acc + val, 0) / data.length)
}

function confindenceInterval(data) {
	let alpha = 0.05
	let ci = ((1 - alpha / 2) * stdDev(data)) / mean(data)
	return ci
}

async function createVectorPLot(dataSeriesUnmod, dataSeriesMod) {
	// createEffect(() => {
	// 	chartVector()
	// 	updatePosition()
	// })
	const [moveY, setMoveY] = createSignal(0)
	const [isDragging, setIsDragging] = createSignal(false)
	// const [isSelectEmpty, setIsSelectEmpty] = createSignal(false)

	function sampleEveryNthElement(arr, n) {
		let sampledArray = []
		for (let i = 0; i < arr.length; i += n) {
			sampledArray.push(arr[i])
		}
		console.log("dataseries length after sample: ", sampledArray.length)
		return sampledArray
	}

	const container = document.getElementById("tablePlots")

	if (!chartVector()) {
		console.log("den yparxei!!!!!!")
		const myChart = echarts.init(container)
		setChartVector(myChart) // Store the chart instance the first time
	}

	function enableBrush(brushType) {
		myChart.dispatchAction({
			type: "takeGlobalCursor",
			key: "brush",
			brushOption: {
				brushType: brushType,
			},
		})
	}

	const myChart = chartVector()
	var symbolSize = 7
	const generalInterval = samplingFactor()

	// let data = sampleEveryNthElement(dataSeries, generalInterval)
	let data = [...dataSeriesMod]

	let unmodifiableData = [...dataSeriesUnmod]

	// const yMin = Math.min(...data)
	// const yMax = Math.max(...data)

	let selectedItems = []
	let initialPosition = null

	myChart.setOption({
		tooltip: {
			triggerOn: "none",
			formatter: function (params) {
				return (
					"X: " +
					params.data[0].toFixed(2) +
					"<br />Y: " +
					params.data[1].toFixed(2)
				)
			},
		},
		brush: {
			xAxisIndex: "all",
			brushLink: "all",
			outOfBrush: { colorAlpha: 0.1 },
			toolbox: ["rect", "keep", "clear"],
			inBrush: {
				color: "#437CC0",
			},
			brushStyle: {
				borderWidth: 1,
				color: "rgb(67, 124, 192, 0.01)",
				borderColor: "rgb(67, 124, 192, 0.8)",
			},
			z: 99,
		},
		toolbox: {
			feature: {
				brush: { type: ["rect", "clear"] },
			},
		},
		legend: {
			data: [
				{
					name: "Modifiable Data",
					lineStyle: {
						width: 1.5, // setting width is important to have regular dashes
						type: "dashed",

						color: "#DBA21C",
					},
					itemStyle: {
						color: "#DBA21C",
					},
				},
				{
					name: "Unmodifiable Data",
					symbolSize: 0,
					lineStyle: {
						color: "#c0def7",
						type: "solid",
					},
					itemStyle: { color: "transparent" },
				},
			],
			orient: "vertical", // Orientation of the legend: 'vertical' or 'horizontal'
			left: "25px", // Position of the legend: 'left', 'right', 'top', 'bottom'
			top: "30px", // Vertical alignment when left/right is used
		},
		grid: { left: "60px", right: "60px", bottom: "205px", top: "130px" },
		dataZoom: [
			// { type: "inside", xAxisIndex: 0 },

			{
				type: "slider",
				xAxisIndex: 0,
				filterMode: "none",
				bottom: "135px",
				height: 30 * scaleX(),
			},
			{ type: "inside", yAxisIndex: 0, filterMode: "none" }, // Inside zoom for yAxis
			{
				type: "slider",
				yAxisIndex: 0,
				filterMode: "none",
				width: 30 * scaleX(),
			},
		],
		xAxis: {
			type: "category",
			data: data.map((_, index) => index),
			axisLine: { onZero: false },
			axisLabel: {
				formatter: function (value) {
					return value * generalInterval
				},
			},
			axisTick: {
				interval: 0,
			},
			triggerEvent: true,
		},
		yAxis: {
			type: "value",
			name: "position",
			axisLine: { onZero: false },
		},
		series: [
			{
				id: "a",
				name: "Modifiable Data",
				type: "line",
				smooth: true,
				symbolSize: symbolSize,
				symbol: "circle",
				showAllSymbol: true,
				lineStyle: {
					color: "#DBA21C",
					type: "dashed",
				},
				//green
				itemStyle: {
					color: function (params) {
						return selectedItems.includes(params.dataIndex)
							? "#145e9f"
							: "#DBA21C"
					},
				},

				data: data.map((item, index) => [index, item]),
				// triggerLineEvent: true,
			},

			{
				id: "b",
				name: "Unmodifiable Data",
				type: "line",
				symbol: "none",
				smooth: true,
				symbolSize: 0, // Hide symbols for unmodifiable data
				lineStyle: {
					color: "#c0def7",
					// type: "dashed",
				},
				data: unmodifiableData.map((item, index) => [index, item]),
			},
		],
	})

	enableBrush("rect")

	setTimeout(function () {
		// Add shadow circles (which are not visible) to enable drag.
		myChart.setOption({
			graphic: data.map(function (item, dataIndex) {
				return {
					type: "circle",
					position: myChart.convertToPixel("grid", [dataIndex, item]),
					shape: {
						cx: 0,
						cy: 0,
						r: symbolSize,
					},
					invisible: true,
					draggable: true,
					onmousedown: function () {
						initialPosition = myChart.convertFromPixel("grid", [
							this.x,
							this.y,
						])
					},
					ondrag: function (dx, dy) {
						onPointDragging(dataIndex, [this.x, this.y])
						if (selectedItems.length > 0) {
							moveBrushByDeltaY(moveY())
							enableBrush("rect")
						}
					},
					ondragstart: function () {
						updatePosition()
						setIsDragging(true)
					},
					ondragend: function () {
						updatePosition()
						setIsDragging(false)
						if (selectedItems.length > 0) {
							moveBrushByDeltaY(moveY())
							enableBrush("rect")
						}
						getSeriesData()
					},
					onmousemove: function () {
						showTooltip(dataIndex)
					},
					onmouseout: function () {
						hideTooltip(dataIndex)
					},
					z: 100,
				}
			}),
		})
	}, 0)

	window.addEventListener("resize", function () {
		updatePosition()
		myChart.resize()
	})

	// const resetAllButton = document.getElementById("resetAllButton")
	// resetAllButton.addEventListener("click", function () {
	// 	resetButtonFunc()
	// })

	const resetButton = document.getElementById("resetButton")
	resetButton.addEventListener("click", function () {
		resetButtonFunc()
	})

	async function resetButtonFunc() {
		data = [...dataSeriesUnmod]
		myChart.setOption({
			series: [
				{
					id: "a",
					name: "Modifiable Data",
					type: "line",
					smooth: true,
					symbolSize: symbolSize,
					symbol: "circle",
					showAllSymbol: true,
					lineStyle: {
						color: "#DBA21C",
					},
					//green
					itemStyle: {
						color: function (params) {
							return selectedItems.includes(params.dataIndex)
								? "#145e9f"
								: "#DBA21C"
						},
					},

					data: data.map((item, index) => [index, item]),
					// triggerLineEvent: true,
				},
			],
		})
		getSeriesData()
	}
	myChart.on("dataZoom", updatePosition)
	let currentBrushCoords = null

	myChart.on("brushSelected", function (params) {
		const brushComponent = params.batch[0]

		if (brushComponent.areas.length > 0) {
			const brushArea = brushComponent.areas[0]
			currentBrushCoords = brushArea.coordRange
		}
		if (!isDragging()) {
			selectedItems = []

			brushComponent.areas.forEach((area) => {
				const coordRange = area.coordRange
				const xAxisIndices = coordRange[0]
				const yAxisRange = coordRange[1]
				for (let i = xAxisIndices[0]; i <= xAxisIndices[1]; i++) {
					const yValue = data[i]
					if (yValue >= yAxisRange[0] && yValue <= yAxisRange[1]) {
						selectedItems.push(i)
					}
				}
			})
		}
		// console.log("Selected items:", selectedItems)
		updatePosition()
	})

	async function getSeriesData() {
		console.log("try to save")
		var chartOption = myChart.getOption()
		var series = chartOption.series
		let secondValuesArray = series[0].data.map((subArray) => subArray[1])
		const columnSelected = {}
		columnSelected[selectedRow()] = secondValuesArray
		console.log(selectedRow())
		// Modify the dataframe with Arquero
		const modifiedDataFrame = await df_coef_mod().assign(
			aq.table(columnSelected)
		)
		set_df_coef_mod(modifiedDataFrame)
	}

	function updatePosition(dataType = data) {
		try {
			// console.log("updated")
			myChart.setOption({
				graphic: dataType.map(function (item, dataIndex) {
					return {
						type: "circle",
						position: myChart.convertToPixel("grid", [
							dataIndex,
							item,
						]),
					}
				}),
			})
		} catch (error) {
			console.error(error)
		}
	}

	function showTooltip(dataIndex) {
		myChart.dispatchAction({
			type: "showTip",
			seriesIndex: 0,
			dataIndex: dataIndex,
		})
	}

	function hideTooltip(dataIndex) {
		myChart.dispatchAction({
			type: "hideTip",
		})
	}

	function moveBrushByDeltaY(deltaY) {
		if (currentBrushCoords) {
			const [[startX, endX], [startY, endY]] = currentBrushCoords

			// Update the Y coordinates
			const newStartY = startY + deltaY
			const newEndY = endY + deltaY

			// Move the brush to the new position
			myChart.dispatchAction({
				type: "brush",
				areas: [
					{
						brushType: "rect",
						// xAxisIndex: 0,
						coordRange: [
							[startX, endX],
							[startY + deltaY, endY + deltaY],
						],
						// yAxisIndex: 0,
						range: [
							[startX, endX],
							[startY + deltaY, endY + deltaY],
						],
						xAxisIndex: 0,
						yAxisIndex: 0,
					},
				],
			})

			// Update the stored brush coordinates
			currentBrushCoords = [startX, endX, newStartY, newEndY]
		} else {
			console.log("No brush area found.")
		}
	}

	function onPointDragging(dataIndex, pos) {
		if (selectedItems.length === 0) {
			data[dataIndex] = myChart.convertFromPixel("grid", pos)[1] // Only update the y-coordinate

			// Update data
			myChart.setOption({
				series: [
					{
						id: "a",
						data: data.map((y, x) => [x, y]), // Convert 1D array to 2D for series
					},
				],
			})
		} else {
			const currentPos = myChart.convertFromPixel("grid", pos)
			const deltaY = currentPos[1] - initialPosition[1] // Calculate the y-offset
			setMoveY(deltaY)
			// Apply the same y-offset to all selected items
			selectedItems.forEach((selectedIndex) => {
				data[selectedIndex] += deltaY
			})

			// Update data
			myChart.setOption({
				series: [
					{
						id: "a",
						data: data.map((y, x) => [x, y]), // Convert 1D array to 2D for series
						//green
						itemStyle: {
							color: function (params) {
								return selectedItems.includes(params.dataIndex)
									? "#145e9f"
									: "#DBA21C"
							},
						},
					},
				],
			})

			// Update the initial position
			initialPosition = currentPos
		}
	}
}

function LineTitle2D() {
	return name2DPlot() + " Trajectory"
}

function ScatterTitle2D() {
	return "Current " + name2DPlot()
}

function plot2DTitle(axis) {
	return (
		"2D " +
		name2DPlot() +
		" Trajectory of " +
		selectedJoint() +
		" on " +
		axis.toUpperCase() +
		"-Axis"
	)
}
function percentageToPixels(percentage, parentElement) {
	const parentWidth = parentElement.clientWidth
	return (percentage / 100) * parentWidth
}
// ######################################
// ######################################
// ######################################
// #############################################################################################################################################################
// ######################################
// ######################################
// ######################################

// const createPlot2D = (currentTime, axis = "x") => {
// 	const container = document.getElementById("plotPanel_2D")
// 	if (!chart2D()) {
// 		const myChart = echarts.init(container)
// 		setChart2D(myChart) // Store the chart instance the first time
// 	}

// 	const myChart = chart2D()
// 	const currentPointIndex = Math.round(currentTime * 90)
// 	let positions =
// 		axis === "x"
// 			? positionsX_2D()
// 			: axis === "y"
// 			? positionsY_2D()
// 			: positionsZ_2D()

// 	const yMin = Math.min(...positions)
// 	const yMax = Math.max(...positions)

// 	// 2D Position Trajectory of Knee Joint on X-Axis

// 	// Example usage:
// 	const parentElement = container // Replace with the actual parent element's ID
// 	const percentageSize = 2 // 20%

// 	function minPlot2D() {
// 		const yMinValue = Number(yMin)
// 		const yMaxValue = Number(yMax)
// 		const value = (yMinValue - (yMaxValue - yMinValue)).toFixed(0)
// 		return parseFloat(value) // Convert back to number if needed elsewhere
// 	}

// 	function maxPlot2D() {
// 		const yMinValue = Number(yMin)
// 		const yMaxValue = Number(yMax)
// 		const value = (yMaxValue + (yMaxValue - yMinValue)).toFixed(0)
// 		return parseFloat(value) // Convert back to number if needed elsewhere
// 	}

// 	const option = {
// 		tooltip: {
// 			trigger: "axis",
// 			axisPointer: {
// 				type: "cross",
// 				animation: false,
// 				label: {
// 					backgroundColor: "#ccc",
// 					borderColor: "#aaa",
// 					borderWidth: 1,
// 					shadowBlur: 0,
// 					shadowOffsetX: 0,
// 					shadowOffsetY: 0,
// 					color: "#222",
// 				},
// 			},
// 		},
// 		toolbox: {
// 			feature: {
// 				dataZoom: {},
// 			},
// 			right: "65px",
// 		},

// 		legend: [
// 			{
// 				data: [LineTitle2D(), ScatterTitle2D()], // Names of the series to show in the legend
// 				orient: "vertical", // Orientation of the legend: 'vertical' or 'horizontal'
// 				left: "20px", // Position of the legend: 'left', 'right', 'top', 'bottom'
// 				top: "0px", // Vertical alignment when left/right is used
// 			},
// 			{
// 				data: [LineTitle2D(), ScatterTitle2D()], // Names of the series to show in the legend
// 				orient: "vertical", // Orientation of the legend: 'vertical' or 'horizontal'
// 				left: "20px", // Position of the legend: 'left', 'right', 'top', 'bottom'
// 				top: "0px", // Vertical alignment when left/right is used
// 			},
// 		],
// 		// grid: { left: "10%", right: "10%", bottom: "43%", top: "20%" },
// 		grid: { left: "50px", right: "65px", bottom: "170px", top: "90px" },

// 		dataZoom: [
// 			{ type: "inside", xAxisIndex: 0 },

// 			{
// 				type: "slider",
// 				xAxisIndex: 0,
// 				filterMode: "none",
// 				// bottom: "25%",
// 				bottom: "105px",
// 				height: 30 * scaleX(),
// 			},
// 			{ type: "inside", yAxisIndex: 0, filterMode: "none" }, // Inside zoom for yAxis
// 			{
// 				type: "slider",
// 				yAxisIndex: 0,
// 				filterMode: "none",
// 				right: "15px",
// 				width: 30 * scaleX(),
// 			},
// 		],
// 		xAxis: {
// 			type: "category",
// 			data: positions.map((_, index) => index),
// 			axisLine: {
// 				onZero: false, // This is important, so x axis can start from non-zero number
// 			},
// 		},
// 		yAxis: {
// 			type: "value",
// 			name: name2DPlot(),
// 			min: minPlot2D(),
// 			max: maxPlot2D(),
// 		},
// 		series: [
// 			{
// 				name: LineTitle2D(),
// 				type: "line",
// 				data: positions,
// 				smooth: false,
// 				lineStyle: {
// 					color: "#145e9f",
// 				},
// 				itemStyle: {
// 					color: "#145e9f",
// 				},
// 			},

// 			{
// 				name: ScatterTitle2D(),
// 				type: "scatter",
// 				data: [[currentPointIndex, positions[currentPointIndex]]],
// 				symbolSize: 15,
// 				itemStyle: {
// 					color: "red",
// 					borderColor: "black",
// 					borderWidth: 0,
// 				},
// 				animation: false,
// 				z: 10,
// 			},
// 		],
// 	}

// 	myChart.setOption(option)
// 	myChart.dispatchAction(
// 		{
// 			type: "takeGlobalCursor",
// 			key: "brush",
// 			brushOption: { brushType: "lineX", brushMode: "single" },
// 		},
// 		true
// 	)
// }

// const updatePlot2D = (currentTime, axis = "x") => {
// 	const myChart = chart2D()
// 	if (!myChart) return

// 	const currentPointIndex = Math.round(currentTime * 90)
// 	let positions =
// 		axis === "x"
// 			? positionsX_2D()
// 			: axis === "y"
// 			? positionsY_2D()
// 			: positionsZ_2D()

// 	myChart.setOption({
// 		series: [
// 			{
// 				name: ScatterTitle2D(),
// 				data: [[currentPointIndex, positions[currentPointIndex]]],
// 			},
// 		],
// 		animation: false,
// 	})
// }

const createPlot2D = (currentTime, axis = "x") => {
	const container = document.getElementById("plotPanel_2D")
	if (!chart2D()) {
		const myChart = echarts.init(container)
		setChart2D(myChart) // Store the chart instance the first time
	}

	const myChart = chart2D()
	const currentPointIndex = Math.round(currentTime * 90)

	// Prepare data for all viewers
	const series = skeletonViewersSig().map((viewer, index) => {
		const label = viewer.plotLabel || `Viewer ${index + 1}`
		const positions =
			axis === "x"
				? positionsX_2D()[index]
				: axis === "y"
				? positionsY_2D()[index]
				: positionsZ_2D()[index]

		return [
			{
				// Line Series
				name: `${label} Line`,
				type: "line",
				data: positions,
				smooth: false,
				// lineStyle: {
				// 	color: `hsl(${
				// 		(index * 360) / skeletonViewersSig().length
				// 	}, 70%, 50%)`,
				// },
				// itemStyle: {
				// 	color: `hsl(${
				// 		(index * 360) / skeletonViewersSig().length
				// 	}, 70%, 50%)`,
				// },

				lineStyle: {
					color: "#145e9f",
				},
				itemStyle: {
					color: "#145e9f",
				},
			},
			{
				// Scatter Point Series
				name: `${label} Point`,
				type: "scatter",
				data: [[currentPointIndex, positions[currentPointIndex]]],
				symbolSize: 15,
				itemStyle: {
					color: "red",
					borderColor: "black",
					borderWidth: 0,
				},
				animation: false,
				z: 10,
			},
		]
	})

	// Flatten the series array
	const flatSeries = series.flat()

	// Find global min and max for all viewers
	const allPositions = skeletonViewersSig().flatMap((_, index) => {
		const positions =
			axis === "x"
				? positionsX_2D()[index]
				: axis === "y"
				? positionsY_2D()[index]
				: positionsZ_2D()[index]
		return positions
	})
	const yMin = Math.min(...allPositions)
	const yMax = Math.max(...allPositions)

	// Define global min and max functions
	function minPlot2D() {
		const yMinValue = Number(yMin)
		const yMaxValue = Number(yMax)
		const value = (yMinValue - (yMaxValue - yMinValue)).toFixed(0)
		return parseFloat(value)
	}

	function maxPlot2D() {
		const yMinValue = Number(yMin)
		const yMaxValue = Number(yMax)
		const value = (yMaxValue + (yMaxValue - yMinValue)).toFixed(0)
		return parseFloat(value)
	}

	// Chart options
	const option = {
		tooltip: {
			trigger: "axis",
			axisPointer: {
				type: "cross",
				animation: false,
				label: {
					backgroundColor: "#ccc",
					borderColor: "#aaa",
					borderWidth: 1,
					shadowBlur: 0,
					shadowOffsetX: 0,
					shadowOffsetY: 0,
					color: "#222",
				},
			},
		},
		toolbox: {
			feature: {
				dataZoom: {},
			},
			right: "65px",
		},
		legend: {
			data: flatSeries.map((s) => s.name),
			orient: "vertical",
			left: "20px",
			top: "0px",
		},
		grid: { left: "50px", right: "65px", bottom: "170px", top: "90px" },
		dataZoom: [
			{ type: "inside", xAxisIndex: 0 },
			{
				type: "slider",
				xAxisIndex: 0,
				filterMode: "none",
				bottom: "105px",
				height: 30 * scaleX(),
			},
			{ type: "inside", yAxisIndex: 0, filterMode: "none" },
			{
				type: "slider",
				yAxisIndex: 0,
				filterMode: "none",
				right: "15px",
				width: 30 * scaleX(),
			},
		],
		xAxis: {
			type: "category",
			data: allPositions.map((_, index) => index),
			axisLine: {
				onZero: false,
			},
		},
		yAxis: {
			type: "value",
			name: name2DPlot(),
			min: minPlot2D(),
			max: maxPlot2D(),
		},
		series: flatSeries,
	}

	myChart.setOption(option)
	myChart.dispatchAction({
		type: "takeGlobalCursor",
		key: "brush",
		brushOption: { brushType: "lineX", brushMode: "single" },
	})
}

const updatePlot2D = (currentTime, axis = "x") => {
	// const myChart = chart2D()
	// if (!myChart) return
	// const currentPointIndex = Math.round(currentTime * 90)
	// // Prepare updated scatter data for all viewers
	// const updatedSeries = skeletonViewersSig().map((viewer, index) => {
	// 	const positions =
	// 		axis === "x"
	// 			? positionsX_2D()[index]
	// 			: axis === "y"
	// 			? positionsY_2D()[index]
	// 			: positionsZ_2D()[index]
	// 	return {
	// 		name: `${viewer.plotLabel || `Viewer ${index + 1}`} Point`,
	// 		data: [[currentPointIndex, positions[currentPointIndex]]], // Update current point
	// 	}
	// })
	// // Update only scatter series in the chart
	// myChart.setOption({
	// 	series: updatedSeries.map((scatter) => ({
	// 		name: scatter.name,
	// 		data: scatter.data,
	// 		type: "scatter", // Ensure scatter type remains the same
	// 	})),
	// 	animation: false, // Disable animation for real-time updates
	// })
}

function LineTitle3D() {
	return name3DPlot() + " Trajectory"
}

function ScatterTitle3D() {
	return "Current " + name3DPlot()
}

// const createPlot3D = (currentTime) => {
// 	const myChart = echarts.init(document.getElementById("plotPanel_3D"))

// 	if (!chart3D()) {
// 		const myChart = echarts.init(document.getElementById("plotPanel_3D"))
// 		setChart3D(myChart) // Store the chart instance the first time
// 	}

// 	const currentPointIndex = Math.round(currentTime * 90)
// 	const xPositions = positionsZ_3D()
// 	const yPositions = positionsX_3D()
// 	const zPositions = positionsY_3D()

// 	// Calculate min and max for each axis
// 	const xMin = Math.min(...xPositions)
// 	const xMax = Math.max(...xPositions)
// 	const yMin = Math.min(...yPositions)
// 	const yMax = Math.max(...yPositions)
// 	const zMin = Math.min(...zPositions)
// 	const zMax = Math.max(...zPositions)

// 	// Calculate the range of each axis
// 	const xRange = xMax - xMin
// 	const yRange = yMax - yMin
// 	const zRange = zMax - zMin

// 	const scaleFactor = 80

// 	const normalizedXRange =
// 		(xRange / Math.max(xRange, yRange, zRange)) * scaleFactor
// 	const normalizedYRange =
// 		(yRange / Math.max(xRange, yRange, zRange)) * scaleFactor
// 	const normalizedZRange =
// 		(zRange / Math.max(xRange, yRange, zRange)) * scaleFactor

// 	const option = {
// 		tooltip: {},
// 		xAxis3D: {
// 			type: "value",
// 			min: Math.round(xMin),
// 			max: Math.round(xMax),
// 			name: "Z",
// 		},
// 		yAxis3D: {
// 			type: "value",
// 			min: Math.round(yMin),
// 			max: Math.round(yMax),
// 			name: "X",
// 		},
// 		zAxis3D: {
// 			type: "value",
// 			min: Math.round(zMin),
// 			max: Math.round(zMax),
// 			name: "Y",
// 		},

// 		axisLabel: {
// 			fontSize: 10, // Adjust the font size of the axis labels
// 		},

// 		grid3D: {
// 			boxWidth: normalizedXRange,
// 			boxHeight: normalizedYRange,
// 			boxDepth: normalizedZRange,
// 			left: "0%",
// 			right: "0%",
// 			bottom: "0%",
// 			top: "0%",
// 			viewControl: {
// 				distance: 170,
// 				alpha: 30, // A small tilt from the vertical top-down view
// 				beta: -70,
// 			},
// 		},
// 		legend: {
// 			data: [
// 				{
// 					name: LineTitle3D(),
// 					icon: "line",
// 				},
// 				{
// 					name: ScatterTitle3D(),
// 				},
// 			],

// 			orient: "vertical", // Orientation of the legend: 'vertical' or 'horizontal'
// 			left: "20px", // Position of the legend: 'left', 'right', 'top', 'bottom'
// 			top: "101px", // Vertical alignment when left/right is used
// 		},
// 		series: [
// 			{
// 				name: LineTitle3D(),
// 				type: "line3D",
// 				data: xPositions.map((x, i) => [
// 					x,
// 					yPositions[i],
// 					zPositions[i],
// 				]),
// 				lineStyle: {
// 					width: 2,
// 					color: "#145e9f",
// 				},
// 			},
// 			{
// 				name: ScatterTitle3D(),
// 				type: "scatter3D",
// 				data: [
// 					[
// 						xPositions[currentPointIndex],
// 						yPositions[currentPointIndex],
// 						zPositions[currentPointIndex],
// 					],
// 				],
// 				symbolSize: 8,
// 				itemStyle: {
// 					color: "red",
// 				},
// 			},
// 		],
// 		animation: false,
// 	}

// 	myChart.setOption(option, false)
// }

const createPlot3D = (currentTime) => {
	const container = document.getElementById("plotPanel_3D")
	if (!chart3D()) {
		const myChart = echarts.init(container)
		setChart3D(myChart) // Store the chart instance the first time
	}

	const myChart = chart3D()
	const currentPointIndex = Math.round(currentTime * 90)

	// Prepare data for all viewers
	const series = skeletonViewersSig().map((viewer, index) => {
		const label = viewer.plotLabel || `Viewer ${index + 1}`
		const xPositions = positionsZ_3D()[index] // Z-axis
		const yPositions = positionsX_3D()[index] // X-axis
		const zPositions = positionsY_3D()[index] // Y-axis

		// Line3D series for each viewer
		const lineSeries = {
			name: `${label} Line`,
			type: "line3D",
			data: xPositions.map((x, i) => [x, yPositions[i], zPositions[i]]),
			lineStyle: {
				width: 2,
				color: "#145e9f",
			},
			// lineStyle: {
			// 	width: 2,
			// 	color: `hsl(${
			// 		(index * 360) / skeletonViewersSig().length
			// 	}, 70%, 50%)`,
			// },
		}

		// Scatter3D series for each viewer's current point
		const scatterSeries = {
			name: `${label} Point`,
			type: "scatter3D",
			data: [
				[
					xPositions[currentPointIndex],
					yPositions[currentPointIndex],
					zPositions[currentPointIndex],
				],
			],
			symbolSize: 8,
			itemStyle: {
				color: "red",
			},
		}

		return [lineSeries, scatterSeries]
	})

	// Flatten series for the chart
	const flatSeries = series.flat()

	// Find global min and max across all viewers for each axis
	const allXPositions = skeletonViewersSig().flatMap(
		(_, index) => positionsZ_3D()[index]
	)
	const allYPositions = skeletonViewersSig().flatMap(
		(_, index) => positionsX_3D()[index]
	)
	const allZPositions = skeletonViewersSig().flatMap(
		(_, index) => positionsY_3D()[index]
	)

	const xMin = Math.min(...allXPositions)
	const xMax = Math.max(...allXPositions)
	const yMin = Math.min(...allYPositions)
	const yMax = Math.max(...allYPositions)
	const zMin = Math.min(...allZPositions)
	const zMax = Math.max(...allZPositions)

	// Calculate ranges and normalization factors
	const xRange = xMax - xMin
	const yRange = yMax - yMin
	const zRange = zMax - zMin
	const scaleFactor = 80

	const normalizedXRange =
		(xRange / Math.max(xRange, yRange, zRange)) * scaleFactor
	const normalizedYRange =
		(yRange / Math.max(xRange, yRange, zRange)) * scaleFactor
	const normalizedZRange =
		(zRange / Math.max(xRange, yRange, zRange)) * scaleFactor

	// Chart options
	const option = {
		tooltip: {},
		xAxis3D: {
			type: "value",
			min: Math.round(xMin),
			max: Math.round(xMax),
			name: "Z",
		},
		yAxis3D: {
			type: "value",
			min: Math.round(yMin),
			max: Math.round(yMax),
			name: "X",
		},
		zAxis3D: {
			type: "value",
			min: Math.round(zMin),
			max: Math.round(zMax),
			name: "Y",
		},
		grid3D: {
			boxWidth: normalizedXRange,
			boxHeight: normalizedYRange,
			boxDepth: normalizedZRange,
			left: "0%",
			right: "0%",
			bottom: "0%",
			top: "0%",
			viewControl: {
				distance: 170,
				alpha: 30, // A small tilt from the vertical top-down view
				beta: -70,
			},
		},
		legend: {
			data: flatSeries.map((s) => s.name),
			orient: "vertical",
			left: "20px",
			top: "101px",
		},
		series: flatSeries,
		animation: false,
	}

	myChart.setOption(option)
}

const updatePlot3D = (currentTime) => {
	// const myChart = chart3D()
	// const currentPointIndex = Math.round(currentTime * 90)
	// const xPositions = positionsZ_3D()
	// const yPositions = positionsX_3D()
	// const zPositions = positionsY_3D()
	// myChart.setOption({
	// 	series: [
	// 		{
	// 			type: "line3D",
	// 			data: xPositions.map((x, i) => [
	// 				x,
	// 				yPositions[i],
	// 				zPositions[i],
	// 			]),
	// 		},
	// 		{
	// 			// Assuming the scatter is the second series
	// 			type: "scatter3D",
	// 			data: [
	// 				[
	// 					xPositions[currentPointIndex],
	// 					yPositions[currentPointIndex],
	// 					zPositions[currentPointIndex],
	// 				],
	// 			],
	// 		},
	// 	],
	// })
}

const createPlot2D_Predict = async () => {
	const columnName = `${selectedJoint()}_${axisSelected()}rotation`

	const container = document.getElementById("plotPredict_2D")
	if (!chart2D_predict()) {
		const myChart = echarts.init(container)
		setChart2D_predict(myChart) // Store the chart instance the first time
	}

	const myChart = chart2D_predict()
	let positions = await df_pred().array(columnName)
	let positions2 = await df_pred_sampled().array(columnName)
	console.log("positions: ", positions.length)
	console.log("positions2: ", positions2.length)

	const yMin = Math.min(...positions2)
	const yMax = Math.max(...positions2)

	function minPlot2D() {
		const yMinValue = Number(yMin)
		const yMaxValue = Number(yMax)
		const value = (yMinValue - (yMaxValue - yMinValue) * 0.3).toFixed(0)
		return parseFloat(value) // Convert back to number if needed elsewhere
	}

	function maxPlot2D() {
		const yMinValue = Number(yMin)
		const yMaxValue = Number(yMax)
		const value = (yMaxValue + (yMaxValue - yMinValue) * 0.3).toFixed(0)
		return parseFloat(value) // Convert back to number if needed elsewhere
	}

	const option = {
		tooltip: {
			trigger: "axis",
			axisPointer: {
				type: "cross",
				animation: false,
				label: {
					backgroundColor: "#ccc",
					borderColor: "#aaa",
					borderWidth: 1,
					shadowBlur: 0,
					shadowOffsetX: 0,
					shadowOffsetY: 0,
					color: "#222",
				},
			},
		},
		toolbox: {
			feature: {
				dataZoom: {},
			},
			right: "65px",
		},

		legend: {
			// data: [LineTitle2D(), ScatterTitle2D()], // Names of the series to show in the legend
			orient: "vertical", // Orientation of the legend: 'vertical' or 'horizontal'
			left: "10px", // Position of the legend: 'left', 'right', 'top', 'bottom'
			top: "0px", // Vertical alignment when left/right is used
		},
		// grid: { left: "10%", right: "10%", bottom: "43%", top: "20%" },
		grid: { left: "40px", right: "80px", bottom: "100px", top: "100px" },

		dataZoom: [
			// { type: "inside", xAxisIndex: 0 },

			{
				type: "slider",
				xAxisIndex: 0,
				filterMode: "none",
				// bottom: "25%",
				bottom: "20px",
				height: 30 * scaleX(),
			},
			{ type: "inside", yAxisIndex: 0, filterMode: "none" }, // Inside zoom for yAxis
			{
				type: "slider",
				yAxisIndex: 0,
				filterMode: "none",
				right: "15px",
				width: 30 * scaleX(),
			},
		],
		xAxis: {
			type: "category",
			data: positions.map((_, index) => index),
			axisLine: {
				onZero: false, // This is important, so x axis can start from non-zero number
			},
		},
		yAxis: {
			type: "value",
			name: name2DPlot(),
			min: minPlot2D(),
			max: maxPlot2D(),
		},
		series: [
			{
				name: "Original Trajectory",
				type: "line",
				data: positions,
				smooth: false,
				lineStyle: {
					color: "#145e9f",
				},
				itemStyle: {
					color: "#145e9f",
				},
			},

			{
				name: "Generated Trajecory",
				type: "line",
				data: positions2,
				smooth: false,
				lineStyle: {
					// color: "#DBA21C",
					color: "red",
					type: "dashed",
				},
				itemStyle: {
					color: "red",
					// color: "#DBA21C",
				},
			},
		],
	}

	myChart.setOption(option)
	myChart.dispatchAction(
		{
			type: "takeGlobalCursor",
			key: "brush",
			brushOption: { brushType: "lineX", brushMode: "single" },
		},
		true
	)
}

const resizePlots = () => {
	//console.log('jhjkhjkjkhkj')

	chart2D().resize()
	chart3D().resize()

	try {
		chartVector().resize()
		chart2D_predict().resize()
	} catch (error) {
		console.error(error)
	}
}

export {
	createPlot2D,
	updatePlot2D,
	createPlot3D,
	updatePlot3D,
	resizePlots,
	createVectorPLot,
	createPlot2D_Predict,
}
