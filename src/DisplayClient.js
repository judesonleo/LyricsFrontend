import React, { useState, useEffect, useRef } from "react";
import { FaPlug, FaExclamationTriangle, FaSave, FaTrash } from "react-icons/fa";
import "./DisplayClient.css";

const DisplayClient = () => {
	const [sessionId, setSessionId] = useState("");
	const [connected, setConnected] = useState(false);
	const [currentSong, setCurrentSong] = useState(null);
	const [currentSection, setCurrentSection] = useState(null);
	const [currentSectionName, setCurrentSectionName] = useState("");
	const [error, setError] = useState("");
	const [scrollPosition, setScrollPosition] = useState(0);
	const [defaultRoom, setDefaultRoom] = useState(
		localStorage.getItem("defaultRoom") || ""
	);
	const lyricsRef = useRef(null);
	const wsRef = useRef(null);

	// Load default room on mount
	useEffect(() => {
		if (defaultRoom) {
			setSessionId(defaultRoom);
		}
	}, []);

	const connectToSession = () => {
		if (!sessionId) {
			setError("Please enter a session ID");
			return;
		}

		if (wsRef.current) {
			wsRef.current.close();
		}

		const serverUrl =
			process.env.REACT_APP_WS_URL || "wss://song-cast-server.judesonleo.me";
		const ws = new WebSocket(serverUrl);
		wsRef.current = ws;

		ws.onopen = () => {
			ws.send(
				JSON.stringify({
					type: "init",
					clientType: "display",
					sessionId: sessionId,
				})
			);
		};

		ws.onmessage = (event) => {
			const data = JSON.parse(event.data);

			if (data.type === "error") {
				setError(data.message);
				setConnected(false);
			} else if (data.type === "songSelected") {
				setCurrentSong(data.song);
				setCurrentSection(null);
				setCurrentSectionName("");
				setScrollPosition(0);
				setConnected(true);
				setError("");
			} else if (data.type === "displaySection") {
				setCurrentSection(data.section);
				setCurrentSectionName(data.sectionName || "");
				setScrollPosition(data.scrollPosition || 0);

				// Reset scroll position when section changes
				if (lyricsRef.current) {
					lyricsRef.current.scrollTop = 0;
				}
			} else if (data.type === "scrollDisplay") {
				setScrollPosition(data.position);

				// Apply scroll
				if (lyricsRef.current) {
					lyricsRef.current.scrollTop = data.position;
				}
			} else if (data.type === "controllerDisconnected") {
				setError(
					"Controller disconnected. The session will remain active for 5 minutes."
				);
			}
		};

		ws.onclose = () => {
			setConnected(false);
			setError("Connection closed");
		};

		ws.onerror = () => {
			setConnected(false);
			setError("Connection error");
		};
	};

	// Effect to auto-connect using default room
	useEffect(() => {
		if (defaultRoom && !connected) {
			connectToSession();
		}
	}, [defaultRoom]); // eslint-disable-line react-hooks/exhaustive-deps

	// Effect for updating scroll position
	useEffect(() => {
		if (lyricsRef.current) {
			lyricsRef.current.scrollTop = scrollPosition;
		}
	}, [scrollPosition]);

	useEffect(() => {
		return () => {
			if (wsRef.current) {
				wsRef.current.close();
			}
		};
	}, []);

	const saveDefaultRoom = () => {
		localStorage.setItem("defaultRoom", sessionId);
		setDefaultRoom(sessionId);
		alert(`Room ${sessionId} set as default`);
	};

	const clearDefaultRoom = () => {
		localStorage.removeItem("defaultRoom");
		setDefaultRoom("");
		alert("Default room cleared");
	};

	const displayMode = connected && currentSong && currentSection;

	return (
		<div
			className={`display-client-container ${
				displayMode ? "display-mode" : ""
			}`}
		>
			{!displayMode && (
				<div className={`connection-bar ${connected ? "connected" : ""}`}>
					{connected ? (
						<div className="connection-content">
							<div className="connection-status">
								<div className="status-indicator"></div>
								<span className="status-text">Connected: {sessionId}</span>
							</div>
							<div className="connection-actions">
								<button
									className="default-room-button"
									onClick={saveDefaultRoom}
									title="Save as Default Room"
								>
									<FaSave /> Save as Default
								</button>
								{defaultRoom && (
									<button
										className="clear-default-button"
										onClick={clearDefaultRoom}
										title="Clear Default Room"
									>
										<FaTrash /> Clear Default
									</button>
								)}
								<button
									className="disconnect-button"
									onClick={() => {
										if (wsRef.current) {
											wsRef.current.close();
										}
										setConnected(false);
										setCurrentSong(null);
										setCurrentSection(null);
									}}
								>
									Disconnect
								</button>
							</div>
						</div>
					) : (
						<div className="connection-input">
							<input
								type="text"
								value={sessionId}
								onChange={(e) => setSessionId(e.target.value.toUpperCase())}
								placeholder="Enter Session ID"
								maxLength={6}
								className="session-input"
							/>
							<button className="connect-button" onClick={connectToSession}>
								<FaPlug className="connect-icon" /> Connect
							</button>
							{defaultRoom && (
								<button
									className="clear-default-button"
									onClick={clearDefaultRoom}
									title="Clear Default Room"
								>
									<FaTrash />
								</button>
							)}
						</div>
					)}
				</div>
			)}

			{error && !displayMode && (
				<div className="error-message">
					<FaExclamationTriangle className="error-icon" />
					<span>{error}</span>
				</div>
			)}

			{displayMode ? (
				<div className="fullscreen-display">
					<div className="song-info">
						<div>
							<h2 className="song-title">{currentSong.title}</h2>
							<p className="song-artist">{currentSong.artist}</p>
							<p className="song-artist">{currentSong.Language}</p>
						</div>
						{currentSectionName && (
							<div className="section-indicator">{currentSectionName}</div>
						)}
					</div>

					<div className="lyrics-display">
						<div className="lyrics-content" ref={lyricsRef}>
							{currentSection.split("\n").map((line, i) => (
								<div
									key={i}
									className={`lyrics-line ${
										line.trim() === "" ? "empty-line" : ""
									}`}
								>
									{line}
								</div>
							))}
						</div>
					</div>

					<div className="session-info">{sessionId}</div>
				</div>
			) : (
				<div className="waiting-display">
					{currentSong ? (
						<div className="song-selected-display">
							<div className="song-details">
								<h1 className="song-title">{currentSong.title}</h1>
								<p className="song-artist">{currentSong.artist}</p>
								<p className="song-artist">{currentSong.Language}</p>
							</div>

							<div className="waiting-message">
								<div className="music-icon">🎵</div>
								<p>Waiting for a section to be selected...</p>
							</div>
						</div>
					) : (
						<div className="no-song-display">
							<div className="music-icon">🎵</div>
							<div className="waiting-message">
								{connected
									? "Waiting for song selection..."
									: "Connect to a session to display lyrics"}
							</div>
							<div className="instructions">
								Enter the session ID provided by the controller to display
								lyrics in full screen mode. Perfect for worship services,
								presentations, or any event that needs lyrics projection.
								{defaultRoom && <p>Default room: {defaultRoom}</p>}
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default DisplayClient;
