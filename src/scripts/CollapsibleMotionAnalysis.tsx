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
import { MetricAnalysisPanel } from "./MetricAnalysisPanel.tsx"
import { MetricInfoPanel } from "./MetricInfoPanel"

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
        { value: "jerk", label: "Jerk" },
        { value: "rula", label: "RULA Ergonomics" }
    ]

    // Handle metric selection changes
    const handleGeometricalMetricChange = (event) => {
        const value = event.target.value
        console.log("Geometrical Metric Changed to:", value); // Log selection
        setActiveGeometricDescriptor(value)
        console.log("Active Geometric Descriptor:", activeGeometricDescriptor()); // Log state after update
        
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
        console.log("Spatial Metric Changed to:", value); // Log selection
        setActiveSpaceDescriptor(value)
        console.log("Active Space Descriptor:", activeSpaceDescriptor()); // Log state after update
        
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
        console.log("Temporal Metric Changed to:", value)
        setActiveTemporalDescriptor(value)
        console.log("Active Temporal Descriptor:", activeTemporalDescriptor())
        setMotionMetric(value)
        
        // For RULA, we want to see the visualization plots, so ensure speed plot is shown
        if (value === "rula") {
            setShowSpeedPlot(true)
        }
        
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
        } else if (value === "rula") {
            setCurrentMetricInfo({
                title: "RULA Ergonomic Assessment",
                description: "Rapid Upper Limb Assessment (RULA) is an ergonomic assessment tool used to evaluate the posture, force, and movement associated with sedentary tasks.",
                calculation: "Scores are calculated based on joint angles and posture, then combined into a final risk score from 1-7.",
                quality: "RULA provides insight into ergonomic risk factors and potential for musculoskeletal disorders.",
                interpretation: "> Scores 1-2 (Green): Acceptable posture.\n> Scores 3-4 (Yellow): Further investigation needed.\n> Scores 5-6 (Orange): Investigation and changes required soon.\n> Score 7 (Red): Immediate investigation and changes required.",
                unit: "RULA risk score (1-7)"
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
            // Ensure metric info panel is visible
            setShowMetricInfo(true);
        }
    })

    // Function to check if any metric is active (for Show component)
    const isAnyMetricActive = () => {
        const geoActive = activeGeometricDescriptor() !== "none";
        const spaceActive = activeSpaceDescriptor() !== "none";
        const temporalActive = activeTemporalDescriptor() !== "none";
        const shouldShow = geoActive || spaceActive || temporalActive;
        console.log(`Checking if metric active: Geo=${geoActive}, Space=${spaceActive}, Temporal=${temporalActive}, ShouldShow=${shouldShow}`);
        return shouldShow;
    }

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
                    
                    {/* Metric Information Checkbox and Panel Section */}
                    {/* Use the logging function in the 'when' prop */}
                    <Show when={isAnyMetricActive()}>
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
                            
                            {/* Remove the MetricInfoPanel from here - it will show in the 3D plot area instead */}
                        </div>
                    </Show>

                    {/* Metric Analysis Panel Section */}
                    <Show when={activeGeometricDescriptor() !== "none" || activeSpaceDescriptor() !== "none" || activeTemporalDescriptor() !== "none"}>
                        <div style="margin-top: 20px;">
                            <h3 style="margin-bottom: 10px; font-size: 16px; color: #333;">Metric Analysis</h3>
                            <MetricAnalysisPanel />
                        </div>
                    </Show>
                </div>
            </Collapsible.Content>
        </Collapsible>
    )
}