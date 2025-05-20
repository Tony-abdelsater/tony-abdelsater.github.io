import { createEffect, createSignal, onMount, Show } from "solid-js"
import { SpeedPlot } from "./SpeedPlot"
import { WeightEffortPlot } from "./WeightEffortPlot"
import { 
    activeGeometricDescriptor, 
    activeSpaceDescriptor, 
    activeTemporalDescriptor,
    activeEffortDescriptor,
    showSpeedPlot,
    setCurrentMetricInfo,
    setShowMetricInfo,
    skeletonViewersSig,
    selectedJoint
} from "./store"

export function MetricAnalysisPanel() {
    // Track which metric category is active
    const [activePanelType, setActivePanelType] = createSignal('none')
    const [lastActiveGeometric, setLastActiveGeometric] = createSignal('')
    const [lastActiveSpatial, setLastActiveSpatial] = createSignal('')
    const [lastActiveTemporal, setLastActiveTemporal] = createSignal('')
    const [lastActiveEffort, setLastActiveEffort] = createSignal('')
    
    // Helper function to update metric information for geometrical metrics
    const updateGeometricalInfo = (value) => {
        if (value === "none") return;
        
        if (value === "box") {
            setCurrentMetricInfo({
                title: "Bounding Box",
                description: "The minimal rectangular parallelepiped (or cuboid) that completely encloses all the points representing the body's joints.",
                calculation: "By finding the minimum and maximum coordinates on each axis (X, Y, Z) across all joint positions.",
                quality: "The bounding box provides information about the overall space occupied by the body.",
                interpretation: "> Large Box Volume: indicates expanded posture utilizing more space.\n> Small Box Volume: suggests contracted, compact posture.",
                unit: "Cubic meter/centimeter"
            });
        } else if (value === "sphere") {
            setCurrentMetricInfo({
                title: "Bounding Sphere",
                description: "The minimal sphere that encloses all the joint positions of the body.",
                calculation: "By determining the center point and the radius to the furthest joint position.",
                quality: "The bounding sphere relates to the overall spatial occupancy of the body and can indicate the expansiveness of movement.",
                interpretation: "> Large Sphere Radius: indicates expanded, outreaching movements.\n> Small Sphere Radius: indicates contained, centralized movements.",
                unit: "Cubic meter/centimeter"
            });
        } else if (value === "ellipsoid") {
            setCurrentMetricInfo({
                title: "Bounding Ellipsoid",
                description: "A more form-fitting enclosure than a sphere or box that better approximates the body's shape.",
                calculation: "By calculating principal axes and dimensions of an ellipsoid that best fits the joint positions.",
                quality: "The bounding ellipsoid provides information about directional extension of the body in space.",
                interpretation: "> Elongated Ellipsoid: indicates a stretched-out posture in specific directions.\n> Spherical Ellipsoid: suggests a balanced extension in all directions.",
                unit: "Cubic meter/centimeter"
            });
        } else if (value === "com") {
            setCurrentMetricInfo({
                title: "Center of Mass (CoM)",
                description: "The weighted average position of all parts of the body.",
                calculation: "By computing a weighted average of joint positions, with weights proportional to the mass of body segments.",
                quality: "The CoM trajectory provides insights into balance, stability, and overall movement efficiency.",
                interpretation: "> Stable CoM: indicates controlled, balanced movement.\n> Dynamic CoM: suggests expressive, potentially less stable movement.",
                unit: "Meters/centimeters (position coordinates)"
            });
        } else if (value === "balance") {
            setCurrentMetricInfo({
                title: "Balance",
                description: "A measure of postural stability based on the relationship between the center of mass and the base of support.",
                calculation: "By analyzing the projection of the CoM relative to the support polygon formed by the feet.",
                quality: "Balance relates to stability, control, and the potential for movement initiation.",
                interpretation: "> High Balance Value: indicates stable, controlled posture.\n> Low Balance Value: suggests dynamic, potentially unstable posture ready for movement.",
                unit: "Normalized ratio (0-1) or percentage"
            });
        }
        
        setShowMetricInfo(true);
    };
    
    // Helper function to update metric information for spatial metrics
    const updateSpatialInfo = (value) => {
        if (value === "none") return;
        
        if (value === "distance") {
            setCurrentMetricInfo({
                title: "Distance Covered",
                description: "The total path length traveled by a joint or the center of mass during the motion sequence.",
                calculation: "By summing the Euclidean distances between consecutive positions of the tracked point over time.",
                quality: "Distance covered relates to the overall motion quantity and spatial exploration of the performer.",
                interpretation: "> Large Distance: indicates extensive movement with high mobility.\n> Small Distance: suggests contained, economical movement with limited spatial exploration.",
                unit: "Meters/centimeters"
            });
            setShowMetricInfo(true);
        }
    };
    
    // Helper function to update metric information for temporal metrics
    const updateTemporalInfo = (value) => {
        if (value === "none") return;
        
        if (value === "speed") {
            setCurrentMetricInfo({
                title: "Speed/Velocity",
                description: "The rate of change of position with respect to time, indicating how fast the body or a joint is moving.",
                calculation: "First derivative of position with respect to time: v = Δposition/Δtime",
                quality: "Speed relates to the tempo and dynamics of movement, indicating energy and urgency.",
                interpretation: "> High Speed: suggests energetic, possibly urgent or expressive movement.\n> Low Speed: indicates controlled, deliberate, or restrained movement.",
                unit: "Meters/centimeters per second"
            });
        } else if (value === "acceleration") {
            setCurrentMetricInfo({
                title: "Acceleration",
                description: "The rate of change of velocity with respect to time, indicating how quickly speed changes.",
                calculation: "Second derivative of position with respect to time: a = Δvelocity/Δtime",
                quality: "Acceleration provides insights into movement dynamics, effort, and expressiveness.",
                interpretation: "> High Acceleration: indicates forceful, dynamic movement with rapid changes.\n> Low Acceleration: suggests smooth, continuous movement with gradual transitions.",
                unit: "Meters/centimeters per second squared"
            });
        } else if (value === "jerk") {
            setCurrentMetricInfo({
                title: "Jerk",
                description: "The rate of change of acceleration with respect to time, indicating the smoothness of movement.",
                calculation: "Third derivative of position with respect to time: j = Δacceleration/Δtime",
                quality: "Jerk relates to movement quality, particularly smoothness and control.",
                interpretation: "> Low Jerk: indicates smooth, well-controlled movement.\n> High Jerk: suggests abrupt, potentially less controlled or more expressive movement.",
                unit: "Meters/centimeters per second cubed"
            });
        }
        
        setShowMetricInfo(true);
    };
    
    // Helper function to update metric information for effort metrics
    const updateEffortInfo = (value) => {
        if (value === "none") return;
        
        if (value === "weight") {
            setCurrentMetricInfo({
                title: "Weight Effort",
                description: "Refers to physical properties of the motion, varying between Strong (powerful, forceful) or Light (gentle, delicate, sensitive).",
                calculation: "By computing the sum of the kinetic energy of the joints composing the body part: E(t) = Σ λk * vk(t)² and extracting the maximum energy over a time interval.",
                quality: "Weight effort relates to the force quality of movement, indicating power and intensity.",
                interpretation: "> High Weight Value: indicates Strong, powerful, forceful movement.\n> Low Weight Value: suggests Light, gentle, delicate, or sensitive movement.",
                unit: "Energy units (normalized)"
            });
        }
        
        setShowMetricInfo(true);
    };
      // Update the active panel type based on the selected metrics
    createEffect(() => {
        const geometrical = activeGeometricDescriptor()
        const spatial = activeSpaceDescriptor()
        const temporal = activeTemporalDescriptor()
        const effort = activeEffortDescriptor()
        
        // Check which metric type changed
        if (geometrical !== lastActiveGeometric()) {
            setLastActiveGeometric(geometrical);
            if (geometrical !== 'none') {
                updateGeometricalInfo(geometrical);
            }
        }
        
        if (spatial !== lastActiveSpatial()) {
            setLastActiveSpatial(spatial);
            if (spatial !== 'none') {
                updateSpatialInfo(spatial);
            }
        }
        
        if (temporal !== lastActiveTemporal()) {
            setLastActiveTemporal(temporal);
            if (temporal !== 'none') {
                updateTemporalInfo(temporal);
            }
        }
        
        if (effort !== lastActiveEffort()) {
            setLastActiveEffort(effort);
            if (effort !== 'none') {
                updateEffortInfo(effort);
            }
        }
          // Determine which panel type to show based on priority
        if (temporal !== 'none') {
            setActivePanelType('temporal')
        } else if (spatial !== 'none') {
            setActivePanelType('spatial')
        } else if (geometrical !== 'none') {
            setActivePanelType('geometrical')
        } else if (effort !== 'none') {
            setActivePanelType('effort')
        } else {
            setActivePanelType('none')
        }
    })
    
    return (
        <div style="border: 1px solid #ddd; border-radius: 5px; overflow: hidden;">
            <Show when={activePanelType() === 'temporal'}>
            <div style="padding: 15px; text-align: center; background: #f5f5f5;">
                    <p>Temporal analysis is displayed on a separate plot view.</p>
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
            </Show>            <Show when={activePanelType() === 'effort'}>
                <div style="padding: 15px; text-align: center; background: #f5f5f5;">
                    <p>Weight Effort analysis is displayed in a separate panel below.</p>
                    <p style="font-size: 12px; color: #666; margin-top: 5px;">
                        Check the panel below the collapsible sections.
                    </p>
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