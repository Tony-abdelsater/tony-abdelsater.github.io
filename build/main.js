// main.js
import * as THREE from './build/three.module.js';
import { OrbitControls } from './build/OrbitControls.js';
import Stats from './build/stats.module.js';
import { GPUStatsPanel } from './build/GPUStatsPanel.js';
import { Line2 } from './build/lines/Line2.js';
import { LineMaterial } from './build/lines/LineMaterial.js';
import { LineGeometry } from './build/lines/LineGeometry.js';
import * as GeometryUtils from './build/GeometryUtils.js';
import { LineSegmentsGeometry } from './build/lines/LineSegmentsGeometry.js';
import { LineSegments2 } from './build/lines/LineSegments2.js';
import { BVHLoader } from './build/BVHLoader.js';
//import { init, animate } from './myScene.js';

// Καθορίστε εδώ τις εξαρτήσεις που χρειάζονται για το myScene
window.THREE = THREE;
window.OrbitControls = OrbitControls;
window.Stats = Stats;
window.GPUStatsPanel = GPUStatsPanel;
window.Line2 = Line2;
window.LineMaterial = LineMaterial;
window.LineGeometry = LineGeometry;
window.GeometryUtils = GeometryUtils;
window.LineSegmentsGeometry = LineSegmentsGeometry;
window.LineSegments2 = LineSegments2;
window.BVHLoader = BVHLoader;

// init();
// animate();
console.log('ola kala')