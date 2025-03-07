// BaseScene.js
import * as THREE from "three"
import { OrbitControls } from "./OrbitControls.js"
import { OrbitControlsGizmo } from "./OrbitControlsGizmo.js"
import Stats from "../../build/stats.module.js"
import { GPUStatsPanel } from "../../build/GPUStatsPanel.js"

class BaseScene {
	constructor(containerId) {
		this.clock = new THREE.Clock()
		this.containerId = containerId
		this.container = null

		this.camera = null
		this.scene = null
		this.renderer = null
		this.controls = null
		this.grid = null
		this.gpuPanel = null
		this.stats = null
		this.container = null
		this.init()
	}

	init() {
		this.container = document.getElementById(this.containerId)

		// Create a scene, camera, renderer, and controls
		this.camera = new THREE.PerspectiveCamera(
			60,
			window.innerWidth / window.innerHeight,
			1,
			1000
		)
		this.camera.position.set(0, 200, 300)

		this.scene = new THREE.Scene()
		// this.scene.background = new THREE.Color(0xeeeeee)
		this.grid = new THREE.GridHelper(400, 10)

		this.scene.add(this.grid)

		this.grid.position.copy(new THREE.Vector3(0, 0, 0)) // Update grid position

		this.renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: true,
		})
		this.renderer.setPixelRatio(window.devicePixelRatio)
		this.renderer.setSize(window.innerWidth, window.innerHeight)

		// Attach the renderer's DOM element to the container
		document
			.getElementById(this.containerId)
			.appendChild(this.renderer.domElement)

		// Set up orbit controls
		this.controls = new OrbitControls(this.camera, this.renderer.domElement)
		this.controls.minDistance = 0
		this.controls.maxDistance = 700

		this.helper = new OrbitControlsGizmo(this.controls, {
			size: 100,
			padding: 8,
			bubbleSizePrimary: 9,
			bubbleSizeSecondary: 9,
			// fontSize: 8,
		})
		this.helper.domElement.id = "helperElement"

		this.container.appendChild(this.helper.domElement)
		this.stats = new Stats()
		this.container.appendChild(this.stats.dom)
		this.stats.dom.id = "myStatsContainer"

		this.gpuPanel = new GPUStatsPanel(this.renderer.getContext())
		this.stats.addPanel(this.gpuPanel)
		this.stats.showPanel(0)

		// Handle window resize events
		window.addEventListener("resize", this.onWindowResize.bind(this))

		// Start the animation loop
		this.animate()
	}

	onWindowResize() {
		// this.camera.aspect = window.innerWidth / window.innerHeight
		// this.camera.updateProjectionMatrix()

		// this.renderer.setSize(window.innerWidth, window.innerHeight)

		//////////////////////////////////////////////////////////////////////////////////////////////

		this.container = document.getElementById("threePanel")
		// this.renderedScene=document.getElementById('threelogs');
		this.width = this.container.clientWidth
		this.height = this.container.clientHeight
		this.camera.aspect = this.width / this.height

		this.camera.updateProjectionMatrix()
		this.renderer.setSize(this.width, this.height)

		console.log(this.width, this.height)

		// this.updateClonedSkeletonControls()
	}

	animate() {
		// Override this method in child classes if needed
		this.renderer.render(this.scene, this.camera)
		requestAnimationFrame(this.animate.bind(this))
	}
}

// let baseScene: BaseScene | null = null // Declare baseScene globally

export default BaseScene
