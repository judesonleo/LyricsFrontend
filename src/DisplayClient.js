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
	const [isFullscreen, setIsFullscreen] = useState(false);
	const lyricsRef = useRef(null);
	const wsRef = useRef(null);
	const containerRef = useRef(null);
	const [currentContent, setCurrentContent] = useState(null);
	const [currentLanguage, setCurrentLanguage] = useState("en");
	const [languages, setLanguages] = useState([
		{ code: "en", name: "English" },
		{ code: "kn", name: "Kannada" },
		{ code: "te", name: "Telugu" },
	]);

	// Load default room on mount
	useEffect(() => {
		if (defaultRoom) {
			setSessionId(defaultRoom);
		}
	}, []);

	// Handle fullscreen changes
	useEffect(() => {
		const handleFullscreenChange = () => {
			setIsFullscreen(!!document.fullscreenElement);
		};

		document.addEventListener("fullscreenchange", handleFullscreenChange);
		return () => {
			document.removeEventListener("fullscreenchange", handleFullscreenChange);
		};
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
			process.env.REACT_APP_WS_URL || "wss://song-cast-server.judesonleo.dev";
		const ws = new WebSocket(serverUrl);
		wsRef.current = ws;

		ws.onopen = () => {
			console.log("[Display] WebSocket connected");
			ws.send(
				JSON.stringify({
					type: "join",
					roomId: sessionId,
				})
			);
		};

		ws.onmessage = (event) => {
			console.log("[Display] Received message:", event.data);
			try {
				const data = JSON.parse(event.data);
				console.log("[Display] Parsed message data:", data);

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

					// Apply scroll with smooth behavior
					if (lyricsRef.current) {
						lyricsRef.current.scrollTo({
							top: data.position,
							behavior: "smooth",
						});
					}
				} else if (data.type === "controllerDisconnected") {
					setError(
						"Controller disconnected. The session will remain active for 5 minutes."
					);
				} else if (data.type === "song") {
					console.log("[Display] Setting song content:", data.song);
					setCurrentContent({
						type: "song",
						title: data.song.title,
						lyrics: data.song.lyrics,
					});
				} else if (data.type === "bible") {
					console.log("[Display] Setting Bible content:", data);
					setCurrentContent({
						type: "bible",
						reference: data.reference,
						text: data.text,
						language: data.language,
					});
					setCurrentLanguage(data.language);
				}
			} catch (error) {
				console.error("[Display] Error parsing message:", error);
			}
		};

		ws.onclose = () => {
			console.log("[Display] WebSocket disconnected");
			setConnected(false);
			setError("Connection closed");
		};

		ws.onerror = (error) => {
			console.error("[Display] WebSocket error:", error);
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
			lyricsRef.current.scrollTo({
				top: scrollPosition,
				behavior: "smooth",
			});
		}
	}, [scrollPosition]);

	// Cleanup on unmount
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

	const toggleFullscreen = () => {
		if (!document.fullscreenElement) {
			containerRef.current?.requestFullscreen();
		} else {
			document.exitFullscreen();
		}
	};

	const displayMode = connected && currentSong && currentSection;

	const handleLanguageChange = (e) => {
		const newLanguage = e.target.value;
		console.log("[Display] Language changed to:", newLanguage);
		setCurrentLanguage(newLanguage);
		if (
			currentContent?.type === "bible" &&
			wsRef.current &&
			wsRef.current.readyState === WebSocket.OPEN
		) {
			console.log("[Display] Requesting verse in new language:", newLanguage);
			wsRef.current.send(
				JSON.stringify({
					type: "bible",
					action: "select",
					reference: currentContent.reference,
					language: newLanguage,
				})
			);
		}
	};

	console.log("[Display] Current content:", currentContent);

	return (
		<div
			ref={containerRef}
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
					<div className="display-header">
						<h2>Display Mode</h2>
						<div className="language-selector">
							<select value={currentLanguage} onChange={handleLanguageChange}>
								{languages.map((lang) => (
									<option key={lang.code} value={lang.code}>
										{lang.name}
									</option>
								))}
							</select>
						</div>
					</div>

					<div className="content-display">
						{currentContent ? (
							currentContent.type === "song" ? (
								<div className="song-display">
									<h3>{currentContent.title}</h3>
									<div className="lyrics">
										{currentContent.lyrics.split("\n").map((line, index) => (
											<p key={index}>{line}</p>
										))}
									</div>
								</div>
							) : (
								<div className="bible-display">
									<h3>{currentContent.reference}</h3>
									<div className="verse-text">{currentContent.text}</div>
								</div>
							)
						) : (
							<div className="no-content">
								<p>No content selected</p>
							</div>
						)}
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
								Waiting for section selection...
							</div>
						</div>
					) : (
						<div className="no-song-display">
							<div className="waiting-message">
								Enter a session ID to connect
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default DisplayClient;
