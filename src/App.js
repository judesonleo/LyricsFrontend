import React, { useState, useEffect } from "react";
import "./App.css";
import UnifiedController from "./UnifiedController";
import Display from "./DisplayClient";

function App() {
	const [ws, setWs] = useState(null);
	const [roomId, setRoomId] = useState("");
	const [isController, setIsController] = useState(false);
	const [error, setError] = useState("");
	const [showRoomInput, setShowRoomInput] = useState(false);
	const [inputRoomId, setInputRoomId] = useState("");

	const connectToRoom = (room, mode) => {
		console.log("[App] Connecting to room:", room, "mode:", mode);

		// Create WebSocket connection with correct port
		const wsUrl =
			process.env.REACT_APP_WS_URL || `ws://${window.location.hostname}:5050`;
		console.log("[App] Connecting to WebSocket at:", wsUrl);
		const socket = new WebSocket(wsUrl);

		socket.onopen = () => {
			console.log("[App] WebSocket connected");
			setWs(socket);
			setRoomId(room);
			setIsController(mode === "controller");

			// Join the room
			socket.send(
				JSON.stringify({
					type: "join",
					roomId: room,
					mode: mode,
				})
			);
		};

		socket.onmessage = (event) => {
			console.log("[App] Received message:", event.data);
			try {
				const data = JSON.parse(event.data);
				console.log("[App] Parsed message data:", data);
			} catch (error) {
				console.error("[App] Error parsing message:", error);
			}
		};

		socket.onclose = () => {
			console.log("[App] WebSocket disconnected");
			setError("Connection closed");
		};

		socket.onerror = (error) => {
			console.error("[App] WebSocket error:", error);
			setError("Connection error");
		};
	};

	useEffect(() => {
		console.log("[App] Component mounted");
		const urlParams = new URLSearchParams(window.location.search);
		const room = urlParams.get("room");
		const mode = urlParams.get("mode");

		if (room) {
			connectToRoom(room, mode);
		} else {
			setShowRoomInput(true);
		}
	}, []);

	const handleRoomSubmit = (e) => {
		e.preventDefault();
		if (inputRoomId.trim()) {
			connectToRoom(
				inputRoomId.trim(),
				isController ? "controller" : "display"
			);
			setShowRoomInput(false);
		}
	};

	const toggleMode = () => {
		console.log(
			"[App] Toggling mode from",
			isController ? "controller" : "display",
			"to",
			!isController ? "controller" : "display"
		);
		setIsController(!isController);

		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.send(
				JSON.stringify({
					type: "mode",
					mode: !isController ? "controller" : "display",
				})
			);
		}
	};

	console.log(
		"[App] Current state - roomId:",
		roomId,
		"isController:",
		isController,
		"ws status:",
		ws?.readyState
	);

	return (
		<div className="App">
			<header className="App-header">
				<h1>Song & Bible Display</h1>
				{!showRoomInput && (
					<button className="mode-toggle" onClick={toggleMode}>
						Switch to {isController ? "Display" : "Controller"} Mode
					</button>
				)}
			</header>

			{showRoomInput ? (
				<div className="room-input-container">
					<form onSubmit={handleRoomSubmit} className="room-input-form">
						<div className="form-group">
							<label htmlFor="roomId">Enter Room ID:</label>
							<input
								type="text"
								id="roomId"
								value={inputRoomId}
								onChange={(e) => setInputRoomId(e.target.value)}
								placeholder="Enter room ID"
								required
							/>
						</div>
						<div className="mode-selection">
							<label>
								<input
									type="radio"
									checked={isController}
									onChange={() => setIsController(true)}
								/>
								Controller Mode
							</label>
							<label>
								<input
									type="radio"
									checked={!isController}
									onChange={() => setIsController(false)}
								/>
								Display Mode
							</label>
						</div>
						<button type="submit" className="connect-button">
							Connect
						</button>
					</form>
				</div>
			) : error ? (
				<div className="error">{error}</div>
			) : isController ? (
				<UnifiedController ws={ws} roomId={roomId} />
			) : (
				<Display ws={ws} roomId={roomId} />
			)}
		</div>
	);
}

export default App;
