import { Collapsible } from "@kobalte/core/collapsible"
import { createEffect, createSignal, Show } from "solid-js"
import { 
    showSpeedPlot, 
    setShowSpeedPlot,
    activeGeometricDescriptor,
    setActiveGeometricDescriptor,
    activeSpaceDescriptor,
    setActiveSpaceDescriptor,
    activeTemporalDescriptor,
    setActiveTemporalDescriptor,
    skeletonViewersSig,
    showMetricInfo,
    setShowMetricInfo,
    currentMetricInfo,
    setCurrentMetricInfo,
    motionMetric,
    setMotionMetric
} from "./store"
import { Checkbox } from "@kobalte/core/checkbox"
import { MetricInfoPanel } from "./MetricInfoPanel.tsx"
import { MetricAnalysisPanel } from "./MetricAnalysisPanel.tsx"

export function CollapsibleMotionAnalysis() {
    const [arrow, setArrow] = createSignal("\u25BC")
    
    // Options for each category
    const geometricalMetricOptions = [
        { value: "none", label: "None" },
        { value: "box", label: "Bounding Box" },
        { value: "sphere", label: "Bounding Sphere" },
        { value: "ellipsoid", label: "Bounding Ellipsoid" },
        { value: "com", label: "Center of Mass (CoM)" },
        { value: "balance", label: "Balance" },
    ]
    
    const spatialMetricOptions = [
        { value: "none", label: "None" },
        { value: "distance", label: "Distance Covered" }
    ]
    
    const temporalMetricOptions = [
        { value: "none", label: "None" },
        { value: "speed", label: "Speed/Velocity" },
        { value: "acceleration", label: "Acceleration" },
        { value: "jerk", label: "Jerk" }
    ]

    // Handle metric selection changes
    const handleGeometricalMetricChange = (event) => {
        const value = event.target.value
        setActiveGeometricDescriptor(value)
        
        // Update all skeleton viewers
        skeletonViewersSig().forEach(viewer => {
            viewer.setActiveDescriptor(value)
        })
        
        // Ensure the metric info panel is shown when a metric is selected
        if (value !== "none") {
            setShowMetricInfo(true)
        }
        
        // Update the information panel with details about this metric
        if (value === "box") {
            setCurrentMetricInfo({
                title: "Bounding Box",
                description: "The minimal rectangular parallelepiped (or cuboid) that completely encloses all the points representing the body's joints.",
                calculation: "By finding the minimum and maximum coordinates of the body in each spatial dimension (x, y, and z).",
                quality: "Bounding box quantifies the \"spread\" or spatial extent of the body corresponding to the \"expansiveness\" or \"contraction\" of motion that is associated to motion styles such as expressivity (expanded = dramatic etc.)",
                interpretation: "> Big Bounding Box: an open, expansive posture and dynamic, expressive movement.\n> Small Bounding Box: a contracted, controlled posture and potentially a subtler, less extroverted movement style.",
                unit: "Cubic meter/centimeter"
            })
        } else if (value === "sphere") {
            setCurrentMetricInfo({
                title: "Bounding Sphere",
                description: "The smallest sphere that completely encloses all the points representing the body's joints.",
                calculation: "By determining the center of the sphere and the radius that encompasses all joint positions.",
                quality: "The bounding sphere relates to the overall spatial occupancy of the body and can indicate the expansiveness of movement.",
                interpretation: "> Large Sphere Radius: indicates expanded, outreaching movements.\n> Small Sphere Radius: indicates contained, centralized movements.",
                unit: "Cubic meter/centimeter"
            })
        } else if (value === "ellipsoid") {
            setCurrentMetricInfo({
                title: "Bounding Ellipsoid",
                description: "A more form-fitting enclosure than a sphere or box that better approximates the body's shape.",
                calculation: "By calculating principal axes and dimensions of an ellipsoid that best fits the joint positions.",
                quality: "The bounding ellipsoid provides information about directional extension of the body in space.",
                interpretation: "> Elongated Ellipsoid: indicates a stretched-out posture in specific directions.\n> Spherical Ellipsoid: suggests a balanced extension in all directions.",
                unit: "Cubic meter/centimeter"
            })
        } else if (value === "com") {
            setCurrentMetricInfo({
                title: "Center of Mass (CoM)",
                description: "The weighted average position of all parts of the body.",
                calculation: "By computing a weighted average of joint positions, with weights proportional to the mass of body segments.",
                quality: "The CoM trajectory provides insights into balance, stability, and overall movement efficiency.",
                interpretation: "> Stable CoM: indicates controlled, balanced movement.\n> Dynamic CoM: suggests expressive, potentially less stable movement.",
                unit: "Meters/centimeters (position coordinates)"
            })
        } else if (value === "balance") {
            setCurrentMetricInfo({
                title: "Balance",
                description: "A measure of postural stability based on the relationship between the center of mass and the base of support.",
                calculation: "By analyzing the projection of the CoM relative to the support polygon formed by the feet.",
                quality: "Balance relates to stability, control, and the potential for movement initiation.",
                interpretation: "> High Balance Value: indicates stable, controlled posture.\n> Low Balance Value: suggests dynamic, potentially unstable posture ready for movement.",
                unit: "Normalized ratio (0-1) or percentage"
            })
        } else {
            setCurrentMetricInfo({
                title: "",
                description: "No data available",
                calculation: "",
                quality: "",
                interpretation: "",
                unit: ""
            })
        }
    }
    
    const handleSpatialMetricChange = (event) => {
        const value = event.target.value
        setActiveSpaceDescriptor(value)
        
        // Update all skeleton viewers with the spatial descriptor
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
        
        // Ensure the metric info panel is shown when a metric is selected
        if (value !== "none") {
            setShowMetricInfo(true)
        }
        
        // Update information panel for the distance covered metric
        if (value === "distance") {
            setCurrentMetricInfo({
                title: "Distance Covered",
                description: "The total path length traveled by a joint or the center of mass during the motion sequence.",
                calculation: "By summing the Euclidean distances between consecutive positions of the tracked point over time.",
                quality: "Distance covered relates to the overall motion quantity and spatial exploration of the performer.",
                interpretation: "> Large Distance: indicates extensive movement with high mobility.\n> Small Distance: suggests contained, economical movement with limited spatial exploration.",
                unit: "Meters/centimeters"
            })
        } else {
            setCurrentMetricInfo({
                title: "",
                description: "",
                calculation: "",
                quality: "",
                interpretation: "",
                unit: ""
            })
        }
    }
    
    const handleTemporalMetricChange = (event) => {
        const value = event.target.value
        setActiveTemporalDescriptor(value)
        setMotionMetric(value)
        
        // Ensure the metric info panel is shown when a metric is selected
        if (value !== "none") {
            setShowMetricInfo(true)
        }
        
        // Update information panel based on the selected temporal metric
        if (value === "speed") {
            setCurrentMetricInfo({
                title: "Speed/Velocity",
                description: "The rate of change of position with respect to time, indicating how fast the body or a joint is moving.",
                calculation: "First derivative of position with respect to time: v = Δposition/Δtime",
                quality: "Speed relates to the tempo and dynamics of movement, indicating energy and urgency.",
                interpretation: "> High Speed: suggests energetic, possibly urgent or expressive movement.\n> Low Speed: indicates controlled, deliberate, or restrained movement.",
                unit: "Meters/centimeters per second"
            })
        } else if (value === "acceleration") {
            setCurrentMetricInfo({
                title: "Acceleration",
                description: "The rate of change of velocity with respect to time, indicating how quickly speed changes.",
                calculation: "Second derivative of position with respect to time: a = Δvelocity/Δtime",
                quality: "Acceleration provides insights into movement dynamics, effort, and expressiveness.",
                interpretation: "> High Acceleration: indicates forceful, dynamic movement with rapid changes.\n> Low Acceleration: suggests smooth, continuous movement with gradual transitions.",
                unit: "Meters/centimeters per second squared"
            })
        } else if (value === "jerk") {
            setCurrentMetricInfo({
                title: "Jerk",
                description: "The rate of change of acceleration with respect to time, indicating the smoothness of movement.",
                calculation: "Third derivative of position with respect to time: j = Δacceleration/Δtime",
                quality: "Jerk relates to movement quality, particularly smoothness and control.",
                interpretation: "> Low Jerk: indicates smooth, well-controlled movement.\n> High Jerk: suggests abrupt, potentially less controlled or more expressive movement.",
                unit: "Meters/centimeters per second cubed"
            })
        } else {
            setCurrentMetricInfo({
                title: "",
                description: "",
                calculation: "",
                quality: "",
                interpretation: "",
                unit: ""
            })
        }
    }

    // Initialize with stored state
    createEffect(() => {
        handleGeometricalMetricChange({ target: { value: activeGeometricDescriptor() } })
    })
    
    createEffect(() => {
        handleSpatialMetricChange({ target: { value: activeSpaceDescriptor() } })
    })
    
    createEffect(() => {
        handleTemporalMetricChange({ target: { value: activeTemporalDescriptor() } })
    })
    
    // Special effect to update metric info when motionMetric changes externally (e.g., from SpeedPlot)
    createEffect(() => {
        const currentMetric = motionMetric();
        // Only update if a temporal metric is active and it doesn't match the current activeTemporalDescriptor
        if (currentMetric && currentMetric !== activeTemporalDescriptor() && currentMetric !== 'none') {
            // Update activeTemporalDescriptor to match the external change
            setActiveTemporalDescriptor(currentMetric);
            // Update the information with new metric details
            handleTemporalMetricChange({ target: { value: currentMetric } });
        }
    })

    return (
        <Collapsible
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
                    {/* Metric Categories */}
                    <div style="display: flex; flex-direction: column; gap: 15px;">
                        {/* Spatial Metrics */}
                        <div>
                            <h3 style="margin-bottom: 5px; font-size: 16px; color: #333;">Spatial Metrics</h3>
                            <select 
                                style="width:100%; padding:5px; border-radius:4px; border: 1px solid #ccc;" 
                                value={activeSpaceDescriptor()}
                                onChange={handleSpatialMetricChange}
                            >
                                {spatialMetricOptions.map((option) => (
                                    <option value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Temporal Metrics */}
                        <div>
                            <h3 style="margin-bottom: 5px; font-size: 16px; color: #333;">Temporal Metrics</h3>
                            <select 
                                style="width:100%; padding:5px; border-radius:4px; border: 1px solid #ccc;" 
                                value={activeTemporalDescriptor()}
                                onChange={handleTemporalMetricChange}
                            >
                                {temporalMetricOptions.map((option) => (
                                    <option value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Geometrical Metrics */}
                        <div>
                            <h3 style="margin-bottom: 5px; font-size: 16px; color: #333;">Geometrical Metrics</h3>
                            <select 
                                style="width:100%; padding:5px; border-radius:4px; border: 1px solid #ccc;" 
                                value={activeGeometricDescriptor()}
                                onChange={handleGeometricalMetricChange}
                            >
                                {geometricalMetricOptions.map((option) => (
                                    <option value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    {/* Show the information panel when a metric is selected */}
                    <Show when={activeGeometricDescriptor() !== "none" || activeSpaceDescriptor() !== "none" || activeTemporalDescriptor() !== "none"}>
                        <div style="margin-top: 20px; display: flex; flex-direction: column; gap: 15px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <h3 style="margin: 0; font-size: 16px; color: #333;">Metric Information</h3>
                                <Checkbox
                                    class="checkbox"
                                    checked={showMetricInfo()}
                                    onChange={(checked) => setShowMetricInfo(checked)}
                                >
                                    <Checkbox.Input class="checkbox__input" />
                                    <Checkbox.Control class="checkbox__control">
                                        <Checkbox.Indicator>
                                            &#10004;
                                        </Checkbox.Indicator>
                                    </Checkbox.Control>
                                </Checkbox>
                            </div>
                            
                            <Show when={showMetricInfo()}>
                                <MetricInfoPanel />
                            </Show>
                        </div>
                    </Show>
                </div>
            </Collapsible.Content>
        </Collapsible>
    )
}