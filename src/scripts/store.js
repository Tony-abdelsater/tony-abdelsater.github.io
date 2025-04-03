// store.js
import { createSignal } from "solid-js"

const [animationDuration, setAnimationDuration] = createSignal(0)
const [currentAnimationTime, setCurrentAnimationTime] = createSignal(0)
const [positionsX_2D, setPositionsX_2D] = createSignal([])
const [positionsY_2D, setPositionsY_2D] = createSignal([])
const [positionsZ_2D, setPositionsZ_2D] = createSignal([])

const [positionsX_3D, setPositionsX_3D] = createSignal([])
const [positionsY_3D, setPositionsY_3D] = createSignal([])
const [positionsZ_3D, setPositionsZ_3D] = createSignal([])

const [mode2DPlot, setMode2DPlot] = createSignal(false)
const [mode3DPlot, setMode3DPlot] = createSignal(false)

const [name2DPlot, setName2DPlot] = createSignal("Position")
const [name3DPlot, setName3DPlot] = createSignal("Position")

const [chart2D, setChart2D] = createSignal(null) // Signal to store the 2D ECharts instance
const [chart3D, setChart3D] = createSignal(null) // Signal to store the 2D ECharts instance
const [chart2D_predict, setChart2D_predict] = createSignal(null) // Signal to store the 2D ECharts instance

const [toggleValue, setToggleValue] = createSignal("x")
const [bonesList, setBonesList] = createSignal([])
const [selectedJoint, setSelectedJoint] = createSignal("Hips")
const [selectedValue, setSelectedValue] = createSignal("Hips")

const [loadingDone, setLoadingDone] = createSignal(false)
const [uploadOutput, setUploadOutput] = createSignal({})

const [splitterSizeL, setSplitterSizeL] = createSignal(100)
const [splitterSizeR, setSplitterSizeR] = createSignal(0)

const [splitterSizePlotL, setSplitterSizePlotL] = createSignal(50)
const [splitterSizePlotR, setSplitterSizePlotR] = createSignal(50)

const [splitterSizeSkelUp, setSplitterSizeSkelUp] = createSignal(50)
const [splitterSizeSkelDown, setSplitterSizeSkelDown] = createSignal(50)

const [mainPageLoaded, setMainPageLoaded] = createSignal(false)
const [inputGOM, setInputGOM] = createSignal([])
const [outputGOM, setOutputGOM] = createSignal([])
const [appIsLoaded, setAppIsLoaded] = createSignal(false)

const [selectedAssumptionsIndex, setSelectedAssumptionsIndex] = createSignal(2)
const [axisSelected, setAxisSelected] = createSignal("X")
const [df_coef, set_df_coef] = createSignal([])
const [df_pred, set_df_pred] = createSignal([])
const [df_pred_sampled, set_df_pred_sampled] = createSignal([])

const [df_coef_mod, set_df_coef_mod] = createSignal([])
const [df_pred_mod, set_df_pred_mod] = createSignal([])

const [df_coef_sub, set_df_coef_sub] = createSignal([])

const [df_A1, set_df_A1] = createSignal([])
const [df_A2, set_df_A2] = createSignal([])
const [df_A3, set_df_A3] = createSignal([])
const [df_A4, set_df_A4] = createSignal([])
const [df_A5, set_df_A5] = createSignal([])
const [df_A6, set_df_A6] = createSignal([])
const [scrollBarWidth, setScrollBarWidth] = createSignal(0)
const [checkboxFistClick, setCheckboxFistClick] = createSignal(false)
const [checkboxValue, setCheckboxValue] = createSignal(false)

const [splitterVtable, setSplitterVtable] = createSignal(40)
const [splitterVplotVector, setSplitterVplotVector] = createSignal(60)
const [scaleX, setScaleX] = createSignal(1)
const [scaleY, setScaleY] = createSignal(1)
const [selectedRow, setSelectedRow] = createSignal("Hips")
const [chartVector, setChartVector] = createSignal(null) // Signal to store the 2D ECharts instance
const [samplingFactor, setSamplingFactor] = createSignal(30) // Signal to store the 2D ECharts instance

const [translateFixerGlobal, setTranslateFixerGlobal] = createSignal(0) // Signal to store the 2D ECharts instance
const [mouseJointHover, setMouseJointHover] = createSignal(null) // Signal to store the 2D ECharts instance

const [selectedTab, setSelectedTab] = createSignal("Assumptions")

const [selectedBVH, setSelectedBVH] = createSignal("MCEAS02G01R03.bvh")

/////////////////////////////////////////////////////////////////////////
const [baseScene, setBaseScene] = createSignal([])
const [skeletons, setSkeletons] = createSignal([])
const [skeletonsArray, setSkeletonsArray] = createSignal([])

const [skeletonViewersSig, setSkeletonViewersSig] = createSignal([])
const [playPressed, setPlayPressed] = createSignal(false)
const [toolTipVisibility, setToolTipVisibility] = createSignal([])
const [isBVHdefault, setIsBVHdefault] = createSignal(true)

const [speedData2D, setSpeedData2D] = createSignal([])
const [speedData3D, setSpeedData3D] = createSignal([])
const [chartSpeed, setChartSpeed] = createSignal(null)
const [showSpeedPlot, setShowSpeedPlot] = createSignal(true)

// Motion analysis signals
const [motionMetric, setMotionMetric] = createSignal('speed')
const [accelerationDataX, setAccelerationDataX] = createSignal([])
const [accelerationDataY, setAccelerationDataY] = createSignal([])
const [accelerationDataZ, setAccelerationDataZ] = createSignal([])
const [accelerationDataNorm, setAccelerationDataNorm] = createSignal([])

// Add jerk data signals
const [jerkDataX, setJerkDataX] = createSignal([])
const [jerkDataY, setJerkDataY] = createSignal([])
const [jerkDataZ, setJerkDataZ] = createSignal([])
const [jerkDataNorm, setJerkDataNorm] = createSignal([])

// Geometric descriptor state
const [activeGeometricDescriptor, setActiveGeometricDescriptor] = createSignal('none')

// const [isXPressed, setXPressed] = createSignal(true);
// const [isYPressed, setYPressed] = createSignal(false);
// const [isZPressed, setZPressed] = createSignal(false);

function time_to_frame(time) {
	return Math.round(time * 90)
}

export {
	animationDuration,
	setAnimationDuration,
	currentAnimationTime,
	setCurrentAnimationTime,
	positionsX_2D,
	setPositionsX_2D,
	positionsY_2D,
	setPositionsY_2D,
	positionsZ_2D,
	setPositionsZ_2D,
	positionsX_3D,
	setPositionsX_3D,
	positionsY_3D,
	setPositionsY_3D,
	positionsZ_3D,
	setPositionsZ_3D,
	chart2D,
	setChart2D,
	chart3D,
	setChart3D,
	toggleValue,
	setToggleValue,
	time_to_frame,
	bonesList,
	setBonesList,
	selectedJoint,
	setSelectedJoint,
	loadingDone,
	setLoadingDone,
	uploadOutput,
	setUploadOutput,
	mode2DPlot,
	setMode2DPlot,
	mode3DPlot,
	setMode3DPlot,
	splitterSizeL,
	setSplitterSizeL,
	splitterSizeR,
	setSplitterSizeR,
	mainPageLoaded,
	setMainPageLoaded,
	inputGOM,
	setInputGOM,
	outputGOM,
	setOutputGOM,
	appIsLoaded,
	setAppIsLoaded,
	selectedAssumptionsIndex,
	setSelectedAssumptionsIndex,
	axisSelected,
	setAxisSelected,
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
	scrollBarWidth,
	setScrollBarWidth,
	checkboxFistClick,
	setCheckboxFistClick,
	splitterVtable,
	setSplitterVtable,
	splitterVplotVector,
	setSplitterVplotVector,
	scaleX,
	setScaleX,
	scaleY,
	setScaleY,
	selectedRow,
	setSelectedRow,
	chartVector,
	setChartVector,
	name2DPlot,
	setName2DPlot,
	name3DPlot,
	setName3DPlot,
	checkboxValue,
	setCheckboxValue,
	samplingFactor,
	setSamplingFactor,
	df_coef_mod,
	set_df_coef_mod,
	df_pred_mod,
	set_df_pred_mod,
	chart2D_predict,
	setChart2D_predict,
	df_pred_sampled,
	set_df_pred_sampled,
	translateFixerGlobal,
	setTranslateFixerGlobal,
	mouseJointHover,
	setMouseJointHover,
	selectedValue,
	setSelectedValue,
	selectedTab,
	setSelectedTab,
	splitterSizePlotL,
	setSplitterSizePlotL,
	splitterSizePlotR,
	setSplitterSizePlotR,
	splitterSizeSkelUp,
	setSplitterSizeSkelUp,
	splitterSizeSkelDown,
	setSplitterSizeSkelDown,
	baseScene,
	setBaseScene,
	skeletons,
	setSkeletons,
	setSelectedBVH,
	selectedBVH,
	skeletonsArray,
	setSkeletonsArray,
	skeletonViewersSig,
	setSkeletonViewersSig,
	playPressed,
	setPlayPressed,
	toolTipVisibility,
	setToolTipVisibility,
	isBVHdefault,
	setIsBVHdefault,
	speedData2D,
	setSpeedData2D,
	speedData3D,
	setSpeedData3D,
	chartSpeed,
	setChartSpeed,
	showSpeedPlot,
	setShowSpeedPlot,
	motionMetric,
	setMotionMetric,
	accelerationDataX,
	setAccelerationDataX,
	accelerationDataY,
	setAccelerationDataY,
	accelerationDataZ,
	setAccelerationDataZ,
	accelerationDataNorm,
	setAccelerationDataNorm,
	
	// Geometric descriptor exports
	activeGeometricDescriptor,
	setActiveGeometricDescriptor,
	
	// Jerk data exports
	jerkDataX,
	setJerkDataX,
	jerkDataY, 
	setJerkDataY,
	jerkDataZ,
	setJerkDataZ,
	jerkDataNorm,
	setJerkDataNorm
	
	// isXPressed,
	// isYPressed,
	// isZPressed,
	// setXPressed,
	// setYPressed,
	// setZPressed
}
