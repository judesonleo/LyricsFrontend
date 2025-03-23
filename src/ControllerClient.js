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
	const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5050";
	const [showFullLyrics, setShowFullLyrics] = useState(false);

	useEffect(() => {
		const fetchSongs = async () => {
			try {
				const response = await fetch(`${apiUrl}/api/songs`);
				const data = await response.json();
				setSongs(data);
			} catch (err) {
				setError("Failed to load songs");
				console.error(err);
			}
		};

		fetchSongs();
	}, []);

	const connectToRoom = (roomId = null) => {
		// Close existing connection if any
		if (wsRef.current) {
			wsRef.current.close();
		}

		const serverUrl = process.env.REACT_APP_WS_URL || "ws://localhost:5050";
		const ws = new WebSocket(serverUrl);
		wsRef.current = ws;

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

		// Calculate new scroll position
		const newPosition =
			direction === "up"
				? Math.max(0, scrollPosition - 20)
				: scrollPosition + 20;

		setScrollPosition(newPosition);

		wsRef.current.send(
			JSON.stringify({
				type: "scrollDisplay",
				position: newPosition,
			})
		);
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
									<button
										className="scroll-button up"
										onClick={() => handleScroll("up")}
										title="Scroll Up"
									>
										<FaArrowUp />
									</button>
									<div className="scroll-position">
										Scroll: {scrollPosition}px
									</div>
									<button
										className="scroll-button down"
										onClick={() => handleScroll("down")}
										title="Scroll Down"
									>
										<FaArrowDown />
									</button>
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
