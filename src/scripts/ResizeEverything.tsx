import { resizePlots } from "./plots"
import {
	name2DPlot,
	name3DPlot,
	selectedJoint,
	toggleValue,
	baseScene,
} from "./store"
// import { myScene } from "./myScene"

function ResizeEverything() {
	baseScene().onWindowResize()
	resizePlots()
	if (document.activeElement instanceof HTMLElement) {
		document.activeElement.blur()
	}
}

function ResizeTitlePlot(plotTitle) {
	const childElement = document.getElementById(plotTitle)

	const parentWidth = childElement.clientWidth

	childElement.style.fontSize =
		"clamp(" + 13 + "px," + parentWidth * 0.028 + "px," + 16 + "px)"
}

export { ResizeEverything }
