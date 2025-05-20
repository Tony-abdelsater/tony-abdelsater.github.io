import { createEffect, onCleanup, onMount } from "solid-js";
import * as echarts from "echarts";
import {
  weightEffortData,
  weightEffortMax,
  activeEffortDescriptor,
  selectedJoint,
} from "./store";

export function WeightEffortPlot() {
  let containerRef;
  let chart = null;

  console.log("Rendering WeightEffortPlot component");

  onMount(() => {
    if (containerRef) {
      chart = echarts.init(containerRef);
      updateChart(chart);
    }
    
    // Ensure chart is resized when container size changes
    const resizeObserver = new ResizeObserver(() => handleResize());
    if (containerRef) {
      resizeObserver.observe(containerRef);
    }
    window.addEventListener('resize', handleResize);

    // Cleanup resize observer
    onCleanup(() => {
      if (containerRef) {
        resizeObserver.unobserve(containerRef);
      }
      resizeObserver.disconnect();
    });
  });

  onCleanup(() => {
    window.removeEventListener('resize', handleResize);
    if (chart) {
      chart.dispose();
      chart = null;
    }
  });

  const handleResize = () => {
    if (chart && containerRef) {
      chart.resize();
    }
  };
  function updateChart(chart) {
    const joint = selectedJoint();
    const data = weightEffortData();
    const maxEffort = weightEffortMax();

    // Validate that we have data
    if (!data?.length) {
      console.log("No Weight Effort data available");
      return;
    }
    
    console.log(`Updating Weight Effort chart with ${data.length} points, max value: ${maxEffort}`);

    // Clear the chart first
    chart.clear();

    // Normalize the data if we have a maximum value
    let normalizedData = data;
    if (maxEffort > 0) {
      normalizedData = data.map(value => (value / maxEffort) * 100);
    }

    const option = {
      title: {
        text: `Weight Effort Analysis - ${joint}`,
        left: 'center',
        top: 10
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        formatter: function(params) {
          const dataIndex = params[0].dataIndex;
          const normalizedValue = params[0].value;
          const actualValue = data[dataIndex];
          
          return `Frame: ${dataIndex}<br/>
                 Normalized Weight: ${normalizedValue.toFixed(2)}%<br/>
                 Weight Energy: ${actualValue.toFixed(2)} units`;
        }
      },
      legend: {
        data: ['Weight Effort (Normalized)'],
        top: 30
      },
      grid: {
        left: '5%',
        right: '5%',
        bottom: '10%',
        top: '25%',
        containLabel: true
      },
      dataZoom: [
        {
          type: "inside",
          xAxisIndex: 0
        },
        {
          type: "slider",
          xAxisIndex: 0,
          bottom: 10
        }
      ],
      xAxis: {
        type: 'category',
        data: Array.from({ length: data.length }, (_, i) => i),
        name: 'Frame'
      },
      yAxis: {
        type: 'value',
        name: 'Weight Effort (%)',
        max: 100,
        min: 0
      },
      series: [
        {
          name: 'Weight Effort (Normalized)',
          type: 'line',
          data: normalizedData,
          smooth: true,
          lineStyle: {
            color: '#ff8800'  // Orange color for Weight Effort
          },
          itemStyle: {
            color: '#ff8800'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: 'rgba(255, 136, 0, 0.7)' // More opaque at the top
                },
                {
                  offset: 1,
                  color: 'rgba(255, 136, 0, 0.1)' // More transparent at the bottom
                }
              ]
            }
          }
        }
      ],      visualMap: {
        show: true,
        type: 'piecewise',
        right: 10,
        top: 'middle',
        orient: 'vertical',
        seriesIndex: 0,
        dimension: 1,
        pieces: [
          {
            gt: 0,
            lte: 33,
            label: 'Light',
            color: '#91cc75' // Light (green)
          },
          {
            gt: 33,
            lte: 66,
            label: 'Medium',
            color: '#fac858' // Medium (yellow)
          },
          {
            gt: 66,
            label: 'Strong',
            color: '#ee6666' // Strong (red)
          }
        ],
        textStyle: {
          color: '#333'
        },
        formatter: function(value) {
          return value === 0 ? 'Light' : value === 33 ? 'Medium' : value === 66 ? 'Strong' : '';
        }
      }
    };    chart.setOption(option);
  }
  
  // Update chart when relevant data changes
  createEffect(() => {
    const data = weightEffortData();
    const maxEffort = weightEffortMax();
    const descriptor = activeEffortDescriptor();
    const joint = selectedJoint();
    
    console.log("Weight Effort Data:", data?.length || 0, "points");
    console.log("Weight Effort Max:", maxEffort);
    console.log("Active Effort Descriptor:", descriptor);
    
    // Always update the chart if we have data, regardless of descriptor
    if (chart) {
      if (!data || data.length === 0) {
        console.log("No Weight Effort data found, trying to calculate...");
        
        // Try to trigger a calculation by notifying the SkeletonViewer
        import("./store").then(({ skeletonViewersSig }) => {
          const viewers = skeletonViewersSig();
          if (viewers && viewers.length > 0) {
            viewers.forEach(viewer => {
              if (viewer.setEffortDescriptor) {
                viewer.setEffortDescriptor('weight');
              }
            });
          }
        });
      } else {
        console.log(`Updating chart with ${data.length} data points`);
        updateChart(chart);
      }
    }
    if (!chart) {
      console.error("ECharts instance not initialized.");
    } else {
      console.log("ECharts instance initialized successfully.");
    }
  });
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div
        ref={containerRef} 
        style={{ 
          width: "100%", 
          height: "calc(100% - 20px)",
          "margin-top": "20px"
        }}
      />
    </div>
  );
}

export function test() {
  console.log("Test function called");
  return true;
}
