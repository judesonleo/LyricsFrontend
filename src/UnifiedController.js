import React, { useState } from "react";
import "./UnifiedController.css";

const UnifiedController = ({ ws, roomId }) => {
	const [activeTab, setActiveTab] = useState("songs"); // 'songs' or 'bible'
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState([]);
	const [selectedVerse, setSelectedVerse] = useState(null);
	const [selectedSong, setSelectedSong] = useState(null);
	const [languages, setLanguages] = useState([
		{ code: "en", name: "English" },
		{ code: "kn", name: "Kannada" },
		{ code: "te", name: "Telugu" },
	]);
	const [currentLanguage, setCurrentLanguage] = useState("en");
	const [history, setHistory] = useState([]);
	const [selectedBook, setSelectedBook] = useState("");
	const [selectedChapter, setSelectedChapter] = useState("");
	const [selectedVerseNum, setSelectedVerseNum] = useState("");

	// Complete Bible books data
	const BIBLE_BOOKS = [
		{ id: "gen", name: "Genesis", chapters: 50 },
		{ id: "exo", name: "Exodus", chapters: 40 },
		{ id: "lev", name: "Leviticus", chapters: 27 },
		{ id: "num", name: "Numbers", chapters: 36 },
		{ id: "deu", name: "Deuteronomy", chapters: 34 },
		{ id: "jos", name: "Joshua", chapters: 24 },
		{ id: "jdg", name: "Judges", chapters: 21 },
		{ id: "rut", name: "Ruth", chapters: 4 },
		{ id: "1sa", name: "1 Samuel", chapters: 31 },
		{ id: "2sa", name: "2 Samuel", chapters: 24 },
		{ id: "1ki", name: "1 Kings", chapters: 22 },
		{ id: "2ki", name: "2 Kings", chapters: 25 },
		{ id: "1ch", name: "1 Chronicles", chapters: 29 },
		{ id: "2ch", name: "2 Chronicles", chapters: 36 },
		{ id: "ezr", name: "Ezra", chapters: 10 },
		{ id: "neh", name: "Nehemiah", chapters: 13 },
		{ id: "est", name: "Esther", chapters: 10 },
		{ id: "job", name: "Job", chapters: 42 },
		{ id: "psa", name: "Psalms", chapters: 150 },
		{ id: "pro", name: "Proverbs", chapters: 31 },
		{ id: "ecc", name: "Ecclesiastes", chapters: 12 },
		{ id: "sng", name: "Song of Solomon", chapters: 8 },
		{ id: "isa", name: "Isaiah", chapters: 66 },
		{ id: "jer", name: "Jeremiah", chapters: 52 },
		{ id: "lam", name: "Lamentations", chapters: 5 },
		{ id: "ezk", name: "Ezekiel", chapters: 48 },
		{ id: "dan", name: "Daniel", chapters: 12 },
		{ id: "hos", name: "Hosea", chapters: 14 },
		{ id: "jol", name: "Joel", chapters: 3 },
		{ id: "amo", name: "Amos", chapters: 9 },
		{ id: "oba", name: "Obadiah", chapters: 1 },
		{ id: "jon", name: "Jonah", chapters: 4 },
		{ id: "mic", name: "Micah", chapters: 7 },
		{ id: "nam", name: "Nahum", chapters: 3 },
		{ id: "hab", name: "Habakkuk", chapters: 3 },
		{ id: "zep", name: "Zephaniah", chapters: 3 },
		{ id: "hag", name: "Haggai", chapters: 2 },
		{ id: "zec", name: "Zechariah", chapters: 14 },
		{ id: "mal", name: "Malachi", chapters: 4 },
		{ id: "mat", name: "Matthew", chapters: 28 },
		{ id: "mrk", name: "Mark", chapters: 16 },
		{ id: "luk", name: "Luke", chapters: 24 },
		{ id: "jhn", name: "John", chapters: 21 },
		{ id: "act", name: "Acts", chapters: 28 },
		{ id: "rom", name: "Romans", chapters: 16 },
		{ id: "1co", name: "1 Corinthians", chapters: 16 },
		{ id: "2co", name: "2 Corinthians", chapters: 13 },
		{ id: "gal", name: "Galatians", chapters: 6 },
		{ id: "eph", name: "Ephesians", chapters: 6 },
		{ id: "php", name: "Philippians", chapters: 4 },
		{ id: "col", name: "Colossians", chapters: 4 },
		{ id: "1th", name: "1 Thessalonians", chapters: 5 },
		{ id: "2th", name: "2 Thessalonians", chapters: 3 },
		{ id: "1ti", name: "1 Timothy", chapters: 6 },
		{ id: "2ti", name: "2 Timothy", chapters: 4 },
		{ id: "tit", name: "Titus", chapters: 3 },
		{ id: "phm", name: "Philemon", chapters: 1 },
		{ id: "heb", name: "Hebrews", chapters: 13 },
		{ id: "jas", name: "James", chapters: 5 },
		{ id: "1pe", name: "1 Peter", chapters: 5 },
		{ id: "2pe", name: "2 Peter", chapters: 3 },
		{ id: "1jn", name: "1 John", chapters: 5 },
		{ id: "2jn", name: "2 John", chapters: 1 },
		{ id: "3jn", name: "3 John", chapters: 1 },
		{ id: "jud", name: "Jude", chapters: 1 },
		{ id: "rev", name: "Revelation", chapters: 22 },
	];

	const handleTabChange = (tab) => {
		console.log(`[Tab Change] Switching to ${tab} tab`);
		setActiveTab(tab);
		setSearchQuery("");
		setSearchResults([]);
		setSelectedVerse(null);
		setSelectedSong(null);
	};

	const handleSearch = () => {
		console.log(`[Search] Active tab: ${activeTab}, Query: "${searchQuery}"`);
		if (activeTab === "bible") {
			searchBibleVerses();
		} else {
			searchSongs();
		}
	};

	const searchBibleVerses = async () => {
		console.log(
			`[Bible Search] Searching for: "${searchQuery}" in ${currentLanguage}`
		);
		try {
			const response = await fetch(
				`/api/bible/search?query=${encodeURIComponent(
					searchQuery
				)}&language=${currentLanguage}`
			);
			const data = await response.json();
			console.log(`[Bible Search] Found ${data.verses?.length || 0} results`);
			setSearchResults(data.verses || []);
		} catch (error) {
			console.error("[Bible Search] Error:", error);
		}
	};

	const searchSongs = async () => {
		console.log(`[Song Search] Searching for: "${searchQuery}"`);
		try {
			const response = await fetch(
				`/api/songs/search?query=${encodeURIComponent(searchQuery)}`
			);
			const data = await response.json();
			console.log(`[Song Search] Found ${data.songs?.length || 0} results`);
			setSearchResults(data.songs || []);
		} catch (error) {
			console.error("[Song Search] Error:", error);
		}
	};

	const selectItem = async (item) => {
		if (activeTab === "bible") {
			selectVerse(item);
		} else {
			selectSong(item);
		}
	};

	const selectVerse = async (reference) => {
		console.log(
			`[Verse Selection] Selecting verse: ${reference} in ${currentLanguage}`
		);
		try {
			const response = await fetch(
				`/api/bible/verse?reference=${encodeURIComponent(
					reference
				)}&language=${currentLanguage}`
			);
			const data = await response.json();
			console.log(`[Verse Selection] Received verse data:`, data);
			setSelectedVerse(data);

			if (ws && ws.readyState === WebSocket.OPEN) {
				console.log(`[WebSocket] Sending verse selection to room ${roomId}`);
				ws.send(
					JSON.stringify({
						type: "bible",
						action: "select",
						reference,
						language: currentLanguage,
					})
				);
			}

			setHistory((prev) => [
				...prev,
				{ type: "bible", reference, language: currentLanguage },
			]);
		} catch (error) {
			console.error("[Verse Selection] Error:", error);
		}
	};

	const selectSong = async (song) => {
		console.log(`[Song Selection] Selecting song: ${song.title}`);
		try {
			const response = await fetch(`/api/songs/${song.id}`);
			const data = await response.json();
			console.log(`[Song Selection] Received song data:`, data);
			setSelectedSong(data);

			if (ws && ws.readyState === WebSocket.OPEN) {
				console.log(`[WebSocket] Sending song selection to room ${roomId}`);
				ws.send(
					JSON.stringify({
						type: "song",
						action: "select",
						song: data,
					})
				);
			}

			setHistory((prev) => [...prev, { type: "song", song: data }]);
		} catch (error) {
			console.error("[Song Selection] Error:", error);
		}
	};

	const handleBookChange = (e) => {
		const bookId = e.target.value;
		console.log(`[Book Selection] Selected book: ${bookId}`);
		setSelectedBook(bookId);
		setSelectedChapter("");
		setSelectedVerseNum("");
	};

	const handleChapterChange = (e) => {
		const chapter = e.target.value;
		console.log(`[Chapter Selection] Selected chapter: ${chapter}`);
		setSelectedChapter(chapter);
		setSelectedVerseNum("");
	};

	const handleVerseNumChange = (e) => {
		const verseNum = e.target.value;
		console.log(`[Verse Number] Entered verse number: ${verseNum}`);
		setSelectedVerseNum(verseNum);
	};

	const handleLanguageChange = (e) => {
		const newLanguage = e.target.value;
		console.log(`[Language Change] Switching to ${newLanguage}`);
		setCurrentLanguage(newLanguage);
	};

	return (
		<div className="unified-controller">
			<div className="tabs">
				<button
					className={activeTab === "songs" ? "active" : ""}
					onClick={() => handleTabChange("songs")}
				>
					Songs
				</button>
				<button
					className={activeTab === "bible" ? "active" : ""}
					onClick={() => handleTabChange("bible")}
				>
					Bible Verses
				</button>
			</div>

			<div className="search-section">
				<input
					type="text"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					onKeyPress={(e) => e.key === "Enter" && handleSearch()}
					placeholder={
						activeTab === "songs" ? "Search songs..." : "Search Bible verses..."
					}
				/>
				<button onClick={handleSearch}>Search</button>

				{activeTab === "bible" && (
					<select
						value={currentLanguage}
						onChange={(e) => setCurrentLanguage(e.target.value)}
					>
						{languages.map((lang) => (
							<option key={lang.code} value={lang.code}>
								{lang.name}
							</option>
						))}
					</select>
				)}
			</div>

			{activeTab === "bible" && (
				<div className="book-selection">
					<select
						value={selectedBook}
						onChange={(e) => setSelectedBook(e.target.value)}
					>
						<option value="">Select a Book</option>
						{BIBLE_BOOKS.map((book) => (
							<option key={book.id} value={book.id}>
								{book.name}
							</option>
						))}
					</select>

					{selectedBook && (
						<select
							value={selectedChapter}
							onChange={(e) => setSelectedChapter(e.target.value)}
						>
							<option value="">Select Chapter</option>
							{[
								...Array(
									BIBLE_BOOKS.find((b) => b.id === selectedBook).chapters
								),
							].map((_, i) => (
								<option key={i + 1} value={i + 1}>
									Chapter {i + 1}
								</option>
							))}
						</select>
					)}

					{selectedChapter && (
						<input
							type="number"
							value={selectedVerseNum}
							onChange={(e) => setSelectedVerseNum(e.target.value)}
							placeholder="Verse number"
							min="1"
						/>
					)}

					{selectedBook && selectedChapter && selectedVerseNum && (
						<button
							onClick={() => {
								const reference = `${selectedBook} ${selectedChapter}:${selectedVerseNum}`;
								selectVerse(reference);
							}}
						>
							Display Verse
						</button>
					)}
				</div>
			)}

			{activeTab === "songs" && searchResults.length > 0 && (
				<div className="results-section">
					<h3>Search Results</h3>
					<div className="song-list">
						{searchResults.map((song, index) => (
							<div
								key={index}
								className="song-item"
								onClick={() => selectSong(song)}
							>
								<div className="song-title">{song.title}</div>
								<div className="song-artist">{song.artist}</div>
								<div className="song-language">{song.Language}</div>
							</div>
						))}
					</div>
				</div>
			)}

			<div className="selected-item">
				{activeTab === "bible" && selectedVerse && (
					<>
						<h3>{selectedVerse.reference}</h3>
						<p>{selectedVerse.text}</p>
					</>
				)}
				{activeTab === "songs" && selectedSong && (
					<>
						<h3>{selectedSong.title}</h3>
						<p>{selectedSong.lyrics}</p>
					</>
				)}
			</div>

			<div className="history-section">
				<h4>History</h4>
				{history.map((item, index) => (
					<div
						key={index}
						className="history-item"
						onClick={() => {
							if (item.type === "bible") {
								selectVerse(item.reference);
							} else {
								selectSong(item.song);
							}
						}}
					>
						{item.type === "bible"
							? `${item.reference} (${item.language})`
							: item.song.title}
					</div>
				))}
			</div>
		</div>
	);
};

export default UnifiedController;
