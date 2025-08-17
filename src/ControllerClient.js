import React, { useState, useEffect, useRef } from "react";
import {
	FaMusic,
	FaShareAlt,
	FaInfoCircle,
	FaCog,
	FaChevronRight,
	FaPaperPlane,
	FaArrowUp,
	FaArrowDown,
	FaDoorOpen,
	FaPlay,
	FaPause,
	FaStepForward,
	FaStepBackward,
} from "react-icons/fa";
import "./ControllerClient.css"; // Import the CSS file

const ControllerClient = () => {
	const [sessionId, setSessionId] = useState(null);
	const [connected, setConnected] = useState(false);
	const [songs, setSongs] = useState([]);
	const [selectedSong, setSelectedSong] = useState(null);
	const [sections, setSections] = useState([]);
	const [selectedSection, setSelectedSection] = useState(null);
	const [error, setError] = useState("");
	const [copied, setCopied] = useState(false);
	const [scrollPosition, setScrollPosition] = useState(0);
	const [defaultRoom, setDefaultRoom] = useState(
		localStorage.getItem("defaultRoom") || ""
	);
	const [roomToJoin, setRoomToJoin] = useState("");
	const [showJoinRoom, setShowJoinRoom] = useState(false);
	const wsRef = useRef(null);
	const apiUrl =
		process.env.REACT_APP_API_URL || "https://song-cast-server.judesonleo.dev";
	const [showFullLyrics, setShowFullLyrics] = useState(false);
	const [isPlaying, setIsPlaying] = useState(false);
	const [autoScrollSpeed, setAutoScrollSpeed] = useState(1);
	const [scrollInterval, setScrollInterval] = useState(null);
	const [touchStartY, setTouchStartY] = useState(null);
	const [touchStartTime, setTouchStartTime] = useState(null);
	const [scrollMode, setScrollMode] = useState("manual"); // 'manual', 'auto', 'hold'
	const [holdInterval, setHoldInterval] = useState(null);
	const [scrollSpeed, setScrollSpeed] = useState(1);
	const [isDragging, setIsDragging] = useState(false);
	const [dragStartY, setDragStartY] = useState(null);
	const [dragStartScroll, setDragStartScroll] = useState(null);
	const [dragSensitivity, setDragSensitivity] = useState(1);

	useEffect(() => {
		const fetchSongs = async () => {
			try {
				console.log("Fetching songs from:", apiUrl);
				const response = await fetch(`${apiUrl}/api/songs`);
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				const data = await response.json();
				console.log("Received songs:", data);
				setSongs(data);
			} catch (err) {
				console.error("Error fetching songs:", err);
				setError(`Failed to load songs: ${err.message}`);
			}
		};

		fetchSongs();
	}, [apiUrl]);

	const connectToRoom = (roomId = null) => {
		// Close existing connection if any
		if (wsRef.current) {
			wsRef.current.close();
		}

		const serverUrl =
			process.env.REACT_APP_WS_URL || "wss://song-cast-server.judesonleo.dev";
		const ws = new WebSocket(serverUrl);
		wsRef.current = ws;
		console.log(serverUrl);
		ws.onopen = () => {
			ws.send(
				JSON.stringify({
					type: "init",
					clientType: "controller",
					roomId: roomId || defaultRoom || undefined, // Send specific room or default room if available
				})
			);
		};

		ws.onmessage = (event) => {
			const data = JSON.parse(event.data);

			if (data.type === "sessionCreated") {
				setSessionId(data.sessionId);
				setConnected(true);
				setError("");
				if (data.message) {
					setError(data.message); // Show info message if provided
				}
			} else if (data.type === "error") {
				setError(data.message);
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

	useEffect(() => {
		connectToRoom();

		return () => {
			if (wsRef.current) {
				wsRef.current.close();
			}
		};
	}, [defaultRoom]);

	const parseSections = (lyrics) => {
		const sectionRegex = /\[(.*?)\]/g;
		const matches = Array.from(lyrics.matchAll(sectionRegex));

		if (matches.length === 0) {
			return [{ name: "Full Lyrics", start: 0, end: lyrics.length }];
		}

		return matches.map((match, index) => {
			const start = match.index;
			const end =
				index < matches.length - 1 ? matches[index + 1].index : lyrics.length;
			return { name: match[1].trim(), start, end, index };
		});
	};

	const selectSong = (song) => {
		if (!connected || !wsRef.current) return;

		setSelectedSong(song);
		setSelectedSection(null);
		setScrollPosition(0);

		const parsedSections = parseSections(song.lyrics);
		setSections(parsedSections);

		wsRef.current.send(
			JSON.stringify({
				type: "selectSong",
				song: song,
			})
		);
	};

	const selectSection = (section) => {
		if (!connected || !wsRef.current || !selectedSong) return;

		setSelectedSection(section);
		setScrollPosition(0);

		const sectionLyrics = selectedSong.lyrics
			.substring(section.start, section.end)
			.trim();

		wsRef.current.send(
			JSON.stringify({
				type: "displaySection",
				sectionName: section.name,
				section: sectionLyrics,
				scrollPosition: 0,
			})
		);
	};

	const copySessionId = () => {
		navigator.clipboard.writeText(sessionId).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});
	};

	const handleScroll = (direction) => {
		if (!connected || !wsRef.current || !selectedSection) return;

		const scrollAmount = 20 * scrollSpeed;
		const newPosition =
			direction === "up"
				? Math.max(0, scrollPosition - scrollAmount)
				: scrollPosition + scrollAmount;

		setScrollPosition(newPosition);
		wsRef.current.send(
			JSON.stringify({
				type: "scrollDisplay",
				position: newPosition,
			})
		);
	};

	const startHoldScroll = (direction) => {
		if (holdInterval) {
			clearInterval(holdInterval);
		}

		const interval = setInterval(() => {
			handleScroll(direction);
		}, 50);

		setHoldInterval(interval);
		setScrollMode("hold");
	};

	const stopHoldScroll = () => {
		if (holdInterval) {
			clearInterval(holdInterval);
			setHoldInterval(null);
		}
		setScrollMode("manual");
	};

	const handleTouchStart = (e) => {
		e.preventDefault(); // Prevent default touch behavior
		const touch = e.touches[0];
		setTouchStartY(touch.clientY);
		setTouchStartTime(Date.now());
		setIsDragging(true);
		setDragStartY(touch.clientY);
		setDragStartScroll(scrollPosition);
		setScrollMode("manual");
	};

	const handleTouchMove = (e) => {
		e.preventDefault(); // Prevent default touch behavior
		if (!isDragging) return;

		const touch = e.touches[0];
		const currentY = touch.clientY;
		const deltaY = dragStartY - currentY;
		const sensitivity = 0.5; // Adjust this value to change drag sensitivity
		const newPosition = dragStartScroll + deltaY * sensitivity;

		setScrollPosition(Math.max(0, newPosition));
		if (connected && wsRef.current) {
			wsRef.current.send(
				JSON.stringify({
					type: "scrollDisplay",
					position: newPosition,
				})
			);
		}
	};

	const handleTouchEnd = (e) => {
		e.preventDefault(); // Prevent default touch behavior
		setIsDragging(false);
		setTouchStartY(null);
		setTouchStartTime(null);
	};

	const handleSpeedChange = (speed) => {
		setAutoScrollSpeed(speed);
		if (isPlaying) {
			stopAutoScroll();
			startAutoScroll();
		}
	};

	const startAutoScroll = () => {
		if (scrollInterval) {
			clearInterval(scrollInterval);
		}

		const interval = setInterval(() => {
			if (isPlaying && connected && wsRef.current) {
				const newPosition = scrollPosition + autoScrollSpeed;
				setScrollPosition(newPosition);
				wsRef.current.send(
					JSON.stringify({
						type: "scrollDisplay",
						position: newPosition,
					})
				);
			}
		}, 50); // Adjust speed by changing interval

		setScrollInterval(interval);
		setIsPlaying(true);
	};

	const stopAutoScroll = () => {
		if (scrollInterval) {
			clearInterval(scrollInterval);
			setScrollInterval(null);
		}
		setIsPlaying(false);
	};

	const saveDefaultRoom = () => {
		if (sessionId) {
			localStorage.setItem("defaultRoom", sessionId);
			setDefaultRoom(sessionId);
			setError("");
			alert(`Room ${sessionId} set as default`);
		}
	};

	const clearDefaultRoom = () => {
		localStorage.removeItem("defaultRoom");
		setDefaultRoom("");
		alert("Default room cleared");
	};

	const handleJoinRoom = (e) => {
		e.preventDefault();
		if (roomToJoin.trim() === "") {
			setError("Room code cannot be empty");
			return;
		}

		// Connect to the specified room
		connectToRoom(roomToJoin.trim().toUpperCase());
		setShowJoinRoom(false);
	};

	return (
		<div className="controller-client-container">
			<div className="status-bar">
				{connected ? (
					<div className="flex justify-between items-center">
						<div>
							<h2 className="status-title">
								<div className="status-indicator"></div>
								Lyrics Display Controller
							</h2>
							<p className="status-subtitle">Share this code with displays</p>
						</div>
						<div className="room-controls">
							<button className="copy-button" onClick={copySessionId}>
								<span className="session-id">{sessionId}</span>
								<FaShareAlt />
								{copied && <span className="copied-message">Copied!</span>}
							</button>
							<button className="default-room-button" onClick={saveDefaultRoom}>
								Set as Default
							</button>
							{defaultRoom && (
								<button
									className="clear-default-button"
									onClick={clearDefaultRoom}
								>
									Clear Default
								</button>
							)}
							<button
								className="join-room-button"
								onClick={() => setShowJoinRoom(!showJoinRoom)}
							>
								<FaDoorOpen /> Join Room
							</button>
						</div>
					</div>
				) : (
					<div className="connecting-message">
						<div className="connecting-indicator"></div>
						Connecting to server...
					</div>
				)}
			</div>

			{error && (
				<div className="error-message">
					<FaInfoCircle className="error-icon" />
					{error}
				</div>
			)}

			{showJoinRoom && (
				<div className="join-room-form">
					<form onSubmit={handleJoinRoom}>
						<input
							type="text"
							placeholder="Enter room code"
							value={roomToJoin}
							onChange={(e) => setRoomToJoin(e.target.value.toUpperCase())}
							className="room-code-input"
							maxLength={6}
						/>
						<button type="submit" className="join-button">
							Join
						</button>
						<button
							type="button"
							className="cancel-button"
							onClick={() => setShowJoinRoom(false)}
						>
							Cancel
						</button>
					</form>
				</div>
			)}

			<div className="main-content">
				<div className="song-selection">
					<div className="selection-header">
						<FaMusic className="selection-icon" />
						<h3 className="section-title">Select a Song</h3>
					</div>

					<div className="song-list">
						{songs.length > 0 ? (
							songs.map((song) => (
								<div
									key={song.id}
									className={`song-item ${
										selectedSong?.id === song.id ? "selected" : ""
									}`}
									onClick={() => selectSong(song)}
								>
									<div className="song-details">
										<div className="song-title">{song.title}</div>
										<div className="song-artist">{song.artist}</div>
										<div className="song-lang">{song.Language}</div>
									</div>
									<FaChevronRight className="song-arrow" />
								</div>
							))
						) : (
							<div className="no-songs">
								No songs available. Add song files to the songs directory.
							</div>
						)}
					</div>
				</div>
				{selectedSong && (
					<div className="full-lyrics-container">
						<div className="full-lyrics-header">
							<h4 className="full-lyrics-title">
								<FaMusic className="selection-icon" />
								Full Lyrics
							</h4>
							<button
								className="full-lyrics-toggle"
								onClick={() => setShowFullLyrics(!showFullLyrics)}
							>
								{showFullLyrics ? "Hide" : "Show"}
								<FaChevronRight
									style={{
										transform: showFullLyrics
											? "rotate(90deg)"
											: "rotate(0deg)",
										transition: "transform 0.3s ease",
									}}
								/>
							</button>
						</div>
						<div
							className={`full-lyrics-content ${
								showFullLyrics ? "expanded" : "collapsed"
							}`}
						>
							{selectedSong.lyrics}
						</div>
					</div>
				)}
				{selectedSong && sections.length > 0 && (
					<div className="section-selection">
						<div className="selection-header">
							<FaCog className="selection-icon" />
							<h3 className="section-title">Send Section to Display</h3>
						</div>

						<div className="section-buttons">
							{sections.map((section, index) => (
								<button
									key={index}
									className={`section-button ${
										selectedSection === section ? "selected" : ""
									}`}
									onClick={() => selectSection(section)}
								>
									{selectedSection === section && (
										<FaPaperPlane className="section-send-icon" />
									)}
									{section.name}
								</button>
							))}
						</div>

						{selectedSection && (
							<>
								<div className="section-preview">
									<div className="preview-label">Preview:</div>
									<div className="preview-content">
										{selectedSong.lyrics
											.substring(selectedSection.start, selectedSection.end)
											.trim()}
									</div>
								</div>

								<div className="scroll-controls">
									<div className="scroll-speed-controls">
										<button
											className={`speed-button ${
												scrollSpeed === 0.5 ? "active" : ""
											}`}
											onClick={() => setScrollSpeed(0.5)}
											title="Slow Speed"
										>
											0.5x
										</button>
										<button
											className={`speed-button ${
												scrollSpeed === 1 ? "active" : ""
											}`}
											onClick={() => setScrollSpeed(1)}
											title="Normal Speed"
										>
											1x
										</button>
										<button
											className={`speed-button ${
												scrollSpeed === 2 ? "active" : ""
											}`}
											onClick={() => setScrollSpeed(2)}
											title="Fast Speed"
										>
											2x
										</button>
									</div>

									<div className="scroll-mode-controls">
										<button
											className={`mode-button ${
												scrollMode === "manual" ? "active" : ""
											}`}
											onClick={() => setScrollMode("manual")}
											title="Manual Mode"
										>
											Manual
										</button>
										<button
											className={`mode-button ${
												scrollMode === "auto" ? "active" : ""
											}`}
											onClick={() => {
												setScrollMode("auto");
												startAutoScroll();
											}}
											title="Auto Scroll"
										>
											Auto
										</button>
										<button
											className={`mode-button ${
												scrollMode === "hold" ? "active" : ""
											}`}
											onClick={() => setScrollMode("hold")}
											title="Hold Mode"
										>
											Hold
										</button>
									</div>

									<div
										className="scroll-area"
										onTouchStart={handleTouchStart}
										onTouchMove={handleTouchMove}
										onTouchEnd={handleTouchEnd}
									>
										<div className="scroll-indicator">
											<div
												className="scroll-progress"
												style={{
													height: `${(scrollPosition / 100) * 100}%`,
												}}
											/>
										</div>
										<div className="scroll-text">
											{isDragging ? "Release to stop" : "Drag to scroll"}
										</div>
									</div>

									<div className="scroll-buttons">
										<button
											className="scroll-button hold-button"
											onTouchStart={() => startHoldScroll("up")}
											onTouchEnd={stopHoldScroll}
											onMouseDown={() => startHoldScroll("up")}
											onMouseUp={stopHoldScroll}
											onMouseLeave={stopHoldScroll}
											title="Hold to scroll up"
										>
											<FaArrowUp />
										</button>
										<button
											className="scroll-button hold-button"
											onTouchStart={() => startHoldScroll("down")}
											onTouchEnd={stopHoldScroll}
											onMouseDown={() => startHoldScroll("down")}
											onMouseUp={stopHoldScroll}
											onMouseLeave={stopHoldScroll}
											title="Hold to scroll down"
										>
											<FaArrowDown />
										</button>
									</div>

									<div className="scroll-position">
										Position: {Math.round(scrollPosition)}%
									</div>
								</div>
							</>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default ControllerClient;
