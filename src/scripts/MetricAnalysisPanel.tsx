import { createEffect, createSignal, Show } from "solid-js"
import { SpeedPlot } from "./SpeedPlot"
import { 
    activeGeometricDescriptor, 
    activeSpaceDescriptor, 
    activeTemporalDescriptor,
    showSpeedPlot
} from "./store"

export function MetricAnalysisPanel() {
    // Track which metric category is active
    const [activePanelType, setActivePanelType] = createSignal('none')
    
    // Update the active panel type based on the selected metrics
    createEffect(() => {
        const geometrical = activeGeometricDescriptor()
        const spatial = activeSpaceDescriptor()
        const temporal = activeTemporalDescriptor()
        
        if (temporal !== 'none') {
            setActivePanelType('temporal')
        } else if (spatial !== 'none') {
            setActivePanelType('spatial')
        } else if (geometrical !== 'none') {
            setActivePanelType('geometrical')
        } else {
            setActivePanelType('none')
        }
    })
    
    return (
        <div style="border: 1px solid #ddd; border-radius: 5px; overflow: hidden;">
            <Show when={activePanelType() === 'temporal' && showSpeedPlot()}>
                <div style="height: 300px; width: 100%;">
                    <SpeedPlot />
                </div>
            </Show>
            
            <Show when={activePanelType() === 'spatial'}>
                <div style="padding: 15px; text-align: center; background: #f5f5f5;">
                    <p>Spatial analysis is displayed on the 3D model view.</p>
                    <p style="font-size: 12px; color: #666; margin-top: 5px;">
                        Note: For the Distance Covered metric, a draggable popup will appear in the scene.
                    </p>
                </div>
            </Show>
            
            <Show when={activePanelType() === 'geometrical'}>
                <div style="padding: 15px; text-align: center; background: #f5f5f5;">
                    <p>Geometrical analysis is displayed on the 3D model view.</p>
                </div>
            </Show>
            
            <Show when={activePanelType() === 'none'}>
                <div style="padding: 15px; text-align: center; background: #f5f5f5;">
                    <p>Select a metric to see analysis.</p>
                </div>
            </Show>
        </div>
    )
}