import { createEffect, onCleanup, onMount } from "solid-js";
import * as echarts from "echarts";
import {
  speedData2D,
  speedData3D,
  accelerationDataX,
  accelerationDataY,
  accelerationDataZ,
  accelerationDataNorm,
  jerkDataNorm,
  motionMetric,
  setMotionMetric,
  chartSpeed,
  setChartSpeed,
  selectedJoint,
  scaleX,
} from "./store";

export function SpeedPlot() {
  let containerRef;

  onMount(() => {
    if (!chartSpeed() && containerRef) {
      const myChart = echarts.init(containerRef);
      setChartSpeed(myChart);
      updateChart(myChart);
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
    const chart = chartSpeed();
    if (chart) {
      chart.dispose();
      setChartSpeed(null);
    }
  });

  const handleResize = () => {
    const chart = chartSpeed();
    if (chart && containerRef) {
      chart.resize();
    }
  };

  function updateChart(chart) {
    const joint = selectedJoint();
    const metric = motionMetric();
    const speeds2D = speedData2D();
    const speeds3D = speedData3D();
    const accX = accelerationDataX();
    const accY = accelerationDataY();
    const accZ = accelerationDataZ();
    const accNorm = accelerationDataNorm();
    const jerkNorm = jerkDataNorm();

    // Validate that we have data for the selected metric
    if (metric === 'speed' && (!speeds2D?.length || !speeds3D?.length)) return;
    if (metric === 'acceleration' && (!accX?.length || !accY?.length || !accZ?.length || !accNorm?.length)) return;
    if (metric === 'jerk' && !jerkNorm?.length) return;

    // Clear the chart first
    chart.clear();

    let data = [];
    let yAxisName = "";

    // Select data based on motion metric
    switch (metric) {
      case 'speed':
        data = speeds3D;
        yAxisName = "Speed (units/s)";
        break;
      case 'acceleration':
        data = accNorm;
        yAxisName = "Acceleration (units/s²)";
        break;
      case 'jerk':
        data = jerkNorm;
        yAxisName = "Jerk (units/s³)";
        break;
    }

    const option = {
      title: {
        text: metric === 'speed' ? `Movement Speed Analysis - ${joint}` : metric === 'acceleration' ? `Movement Acceleration Analysis - ${joint}` : `Movement Jerk Analysis - ${joint}`,
        left: 'center',
        top: 10
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        }
      },
      legend: {
        data: metric === 'speed' 
          ? ['2D Speed (XZ Plane)', '3D Speed']
          : metric === 'acceleration'
          ? ['X Acceleration', 'Y Acceleration', 'Z Acceleration', 'Acceleration Magnitude']
          : ['Jerk'],
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
        name: yAxisName
      },
      series: metric === 'speed' ? [
        {
          name: '2D Speed (XZ Plane)',
          type: 'line',
          data: speeds2D,
          smooth: true,
          lineStyle: {
            color: '#145e9f'
          }
        },
        {
          name: '3D Speed',
          type: 'line',
          data: speeds3D,
          smooth: true,
          lineStyle: {
            color: '#ff4d4f'
          }
        }
      ] : metric === 'acceleration' ? [
        {
          name: 'X Acceleration',
          type: 'line',
          data: accX,
          smooth: true,
          lineStyle: {
            color: '#ff4444'
          }
        },
        {
          name: 'Y Acceleration',
          type: 'line',
          data: accY,
          smooth: true,
          lineStyle: {
            color: '#44ff44'
          }
        },
        {
          name: 'Z Acceleration',
          type: 'line',
          data: accZ,
          smooth: true,
          lineStyle: {
            color: '#4444ff'
          }
        },
        {
          name: 'Acceleration Magnitude',
          type: 'line',
          data: accNorm,
          smooth: true,
          lineStyle: {
            color: '#dba21c'
          }
        }
      ] : [
        {
          name: 'Jerk',
          type: 'line',
          data: jerkNorm,
          smooth: true,
          lineStyle: {
            color: '#dba21c'
          }
        }
      ]
    };

    chart.setOption(option, true); // Added true to enforce complete refresh
  }

  // Watch for changes in selected joint
  createEffect(() => {
    const joint = selectedJoint();
    const chart = chartSpeed();
    if (chart) {
      updateChart(chart);
    }
  });

  // Watch for changes in motion metric
  createEffect(() => {
    const metric = motionMetric();
    const chart = chartSpeed();
    if (chart) {
      updateChart(chart);
    }
  });

  // Watch for changes in data
  createEffect(() => {
    const speeds2D = speedData2D();
    const speeds3D = speedData3D();
    const accX = accelerationDataX();
    const accY = accelerationDataY();
    const accZ = accelerationDataZ();
    const accNorm = accelerationDataNorm();
    const jerkNorm = jerkDataNorm();
    
    const chart = chartSpeed();
    if (chart && (speeds2D?.length || accX?.length)) {
      updateChart(chart);
    }
  });

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div style={{ position: "absolute", top: "10px", right: "10px", "z-index": 1 }}>
        <select 
          value={motionMetric()}
          onChange={(e) => setMotionMetric(e.target.value)}
          style={{
            padding: "4px 8px",
            "border-radius": "4px",
            border: "1px solid #ccc",
            "background-color": "white",
            "font-size": "14px",
            cursor: "pointer"
          }}
        >
          <option value="speed">Speed</option>
          <option value="acceleration">Acceleration</option>
          <option value="jerk">Jerk</option>
        </select>
      </div>
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