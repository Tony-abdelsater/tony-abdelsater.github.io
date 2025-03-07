import { CircularProgress } from "@suid/material"

function LoadingApp() {
	return (
		<div class="loadingScreen">
			<div style="display: flex; justify-content: center; align-items: center; width: 100vh; height: 100vh;">
				<CircularProgress
					disableShrink={true}
					sx={{
						// color: "#4873c5",
						color: "#145e9f",
						height: "30%",
						width: "30%",
					}}
				/>
			</div>
		</div>
	)
}

export { LoadingApp }
