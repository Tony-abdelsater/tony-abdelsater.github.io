import { Collapsible } from "@kobalte/core"
import { createEffect, createSignal } from "solid-js"
import { 
    showSpeedPlot, 
    setShowSpeedPlot,
    activeGeometricDescriptor,
    setActiveGeometricDescriptor,
    skeletonViewersSig
} from "./store"
import { Checkbox } from "@kobalte/core/checkbox"

export function CollapsibleSpeed() {
    const [arrow, setArrow] = createSignal("\u25BC")
    const [activeDescriptor, setActiveDescriptor] = createSignal("none")
    const [activeSpaceDescriptor, setActiveSpaceDescriptor] = createSignal("none")
    
    const descriptorOptions = [
        { value: "none", label: "None" },
        { value: "box", label: "Bounding Box" },
        { value: "sphere", label: "Bounding Sphere" },
        { value: "ellipsoid", label: "Bounding Ellipsoid" },
        { value: "com", label: "Center of Mass (CoM)" },
        { value: "balance", label: "Balance" },
    ]
    
    const spaceDescriptorOptions = [
        { value: "none", label: "None" },
        { value: "distance", label: "Distance Covered" }
    ]

    // Handle descriptor selection change
    const handleDescriptorChange = (event) => {
        const value = event.target.value
        setActiveDescriptor(value)
        setActiveGeometricDescriptor(value)
        
        // Update all skeleton viewers
        skeletonViewersSig().forEach(viewer => {
            viewer.setActiveDescriptor(value)
        })
    }
    
    // Handle space descriptor selection change
    const handleSpaceDescriptorChange = (event) => {
        const value = event.target.value
        setActiveSpaceDescriptor(value)
        
        // Update all skeleton viewers with the space descriptor
        skeletonViewersSig().forEach(viewer => {
            viewer.setActiveDescriptor(value)
            
            // If selecting "none", ensure we clean up the distance tracker HTML elements
            if (value === "none") {
                const existingPanel = document.getElementById('distance-tracker-hud');
                if (existingPanel) {
                    existingPanel.parentNode.removeChild(existingPanel);
                }
            }
        })
        
        console.log(`Selected space descriptor: ${value}`)
    }

    // Initialize with stored state
    createEffect(() => {
        setActiveDescriptor(activeGeometricDescriptor())
    })

    return (
        <Collapsible.Root
            defaultOpen={true}
            class="collapsible"
            onOpenChange={(bool) => {
                setArrow(bool ? "\u25BC" : "\u25B2")
            }}
        >
            <Collapsible.Trigger class="collapsible__trigger">
                <span>Motion Analysis {arrow()}</span>
            </Collapsible.Trigger>
            <Collapsible.Content class="collapsible__content">
                <div class="collapsible__content-text">
                    <div style="margin-top: 10px;" class="plot-mode-section">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span>Show Speed Analysis:</span>
                            <Checkbox
                                class="checkbox"
                                checked={showSpeedPlot()}
                                onChange={(checked) => {
                                    setShowSpeedPlot(checked)
                                }}
                            >
                                <Checkbox.Input class="checkbox__input" />
                                <Checkbox.Control class="checkbox__control">
                                    <Checkbox.Indicator>
                                        &#10004;
                                    </Checkbox.Indicator>
                                </Checkbox.Control>
                            </Checkbox>
                        </div>
                    </div>
                    
                    {/* Geometric Descriptors section */}
                    <div style="margin-top: 15px;">
                        <h4 style="margin-bottom: 5px; font-size: 14px;">Geometric Descriptors</h4>
                        <select 
                            style="width:100%; padding:5px; border-radius:4px;" 
                            value={activeDescriptor()}
                            onChange={handleDescriptorChange}
                        >
                            {descriptorOptions.map((option) => (
                                <option value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Space Descriptors section */}
                    <div style="margin-top: 15px;">
                        <h4 style="margin-bottom: 5px; font-size: 14px;">Space Descriptors</h4>
                        <select 
                            style="width:100%; padding:5px; border-radius:4px;" 
                            value={activeSpaceDescriptor()}
                            onChange={handleSpaceDescriptorChange}
                        >
                            {spaceDescriptorOptions.map((option) => (
                                <option value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </Collapsible.Content>
        </Collapsible.Root>
    )
}