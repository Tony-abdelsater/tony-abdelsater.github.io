import { createEffect } from "solid-js"
import { currentMetricInfo } from "./store"

export function MetricInfoPanel() {
    // Get the current metric information from the store
    const info = currentMetricInfo()
    
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
            {info.title ? (
                <>
                    <h4 style="margin-top: 0; margin-bottom: 8px; font-size: 16px; color: #333;">
                        What is {info.title}?
                    </h4>
                    <p style="margin-top: 0; margin-bottom: 10px;">{info.description}</p>
                    
                    <h4 style="margin-top: 12px; margin-bottom: 8px; font-size: 16px; color: #333;">
                        How is it calculated?
                    </h4>
                    <p style="margin-top: 0; margin-bottom: 10px;">{info.calculation}</p>
                    
                    <h4 style="margin-top: 12px; margin-bottom: 8px; font-size: 16px; color: #333;">
                        To which motion quality it is related?
                    </h4>
                    <p style="margin-top: 0; margin-bottom: 10px;">{info.quality}</p>
                    
                    <h4 style="margin-top: 12px; margin-bottom: 8px; font-size: 16px; color: #333;">
                        How it can be interpreted?
                    </h4>
                    <p style="margin-top: 0; margin-bottom: 10px; white-space: pre-line;">{info.interpretation}</p>
                    
                    <h4 style="margin-top: 12px; margin-bottom: 8px; font-size: 16px; color: #333;">
                        Measurement unit
                    </h4>
                    <p style="margin-top: 0; margin-bottom: 0;">{info.unit}</p>
                </>
            ) : (
                <p style="margin: 0; color: #666;">Select a metric to see information about it.</p>
            )}
        </div>
    )
}