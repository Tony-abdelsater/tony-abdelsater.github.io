import { resizePlots } from "./plots"
import {
    name2DPlot,
    name3DPlot,
    selectedJoint,
    toggleValue,
    baseScene,
    chart2D,
    chart3D,
    chartVector,
    chartSpeed
} from "./store"

export function ResizeEverything() {
    const chart2DInstance = chart2D()
    const chart3DInstance = chart3D()
    const chartSpeedInstance = chartSpeed()
    const chartVectorInstance = chartVector()

    if (chart2DInstance) {
        chart2DInstance.resize()
    }
    if (chart3DInstance) {
        chart3DInstance.resize()
    }
    if (chartSpeedInstance) {
        chartSpeedInstance.resize()
    }
    if (chartVectorInstance) {
        chartVectorInstance.resize()
    }

    baseScene().onWindowResize()
    resizePlots()
    if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
    }
}

export function ResizeTitlePlot(plotTitle: string) {
    const childElement = document.getElementById(plotTitle)
    if (!childElement) return

    const parentWidth = childElement.clientWidth
    childElement.style.fontSize = `clamp(13px, ${parentWidth * 0.028}px, 16px)`
}
