import { createEffect, createSignal } from "solid-js"
import { currentMetricInfo } from "./store"

export function MetricInfoPanel() {
    // Create a local signal that tracks the current metric info
    const [localInfo, setLocalInfo] = createSignal({
        title: '',
        description: '',
        calculation: '',
        quality: '',
        interpretation: '',
        unit: ''
    });
    
    // Update local state whenever the store changes
    createEffect(() => {
        const info = currentMetricInfo();
        console.log("MetricInfoPanel: Metric info updated", info);
        setLocalInfo(info);
    });
    
    return (
        <div 
            style="
                background-color: #f5f5f5;
                border: 1px solid #ddd;
                border-radius: 5px;
                padding: 12px;
                font-size: 14px;
                line-height: 1.4;
            "
        >
            {localInfo().title ? (
                <>
                    <h4 style="margin-top: 0; margin-bottom: 8px; font-size: 16px; color: #333;">
                        What is {localInfo().title}?
                    </h4>
                    <p style="margin-top: 0; margin-bottom: 10px;">{localInfo().description}</p>
                    
                    <h4 style="margin-top: 12px; margin-bottom: 8px; font-size: 16px; color: #333;">
                        How is it calculated?
                    </h4>
                    <p style="margin-top: 0; margin-bottom: 10px;">{localInfo().calculation}</p>
                    
                    <h4 style="margin-top: 12px; margin-bottom: 8px; font-size: 16px; color: #333;">
                        To which motion quality it is related?
                    </h4>
                    <p style="margin-top: 0; margin-bottom: 10px;">{localInfo().quality}</p>
                    
                    <h4 style="margin-top: 12px; margin-bottom: 8px; font-size: 16px; color: #333;">
                        How it can be interpreted?
                    </h4>
                    <p style="margin-top: 0; margin-bottom: 10px; white-space: pre-line;">{localInfo().interpretation}</p>
                    
                    <h4 style="margin-top: 12px; margin-bottom: 8px; font-size: 16px; color: #333;">
                        Measurement unit
                    </h4>
                    <p style="margin-top: 0; margin-bottom: 0;">{localInfo().unit}</p>
                </>
            ) : (
                <p style="margin: 0; color: #666;">Select a metric to see information about it.</p>
            )}
        </div>
    )
}