import "./App.css"
import { onMount, onCleanup, createSignal } from "solid-js"
// import { myScene } from "./scripts/myScene"
// import { resizePlots } from "./scripts/plots"
import { MainPage } from "./scripts/MainPage"
import { scaleApp } from "./scripts/MainPage"
import { ResizeEverything } from "./scripts/ResizeEverything"

function App() {
	const handler = () => {
		ResizeEverything()
		scaleApp()
	}

	onMount(() => {
		window.addEventListener("resize", handler)
		window.addEventListener(
			"message",
			function (event) {
				// Make sure the message is coming from the expected origin
				if (event.origin !== "http://localhost") {
					console.log("wronggg: ", event.origin)
					return
				}

				// Handle the message
				const userData = event.data
				console.log("EventData: ", userData)
				if (userData.name) {
					console.log("User's name received:", userData.name) // Log the user's name
				} else {
					console.log("No user name received.")
				}
			},
			false
		)
		document.addEventListener("resize", handler)

		document.addEventListener("fullscreenchange", handler)
		document.addEventListener("webkitfullscreenchange", handler)
		document.addEventListener("mozfullscreenchange", handler)
		document.addEventListener("msfullscreenchange", handler)
	})

	// createSignal(() => {
	// 	window.addEventListener("resize", handler)
	// 	document.addEventListener("resize", handler)

	// 	document.addEventListener("fullscreenchange", handler)
	// 	document.addEventListener("webkitfullscreenchange", handler)
	// 	document.addEventListener("mozfullscreenchange", handler)
	// 	document.addEventListener("msfullscreenchange", handler)
	// 	console.log("lalalalal")
	// })

	onCleanup(() => {
		window.removeEventListener("resize", handler)
	})

	return <MainPage />
}

export default App
