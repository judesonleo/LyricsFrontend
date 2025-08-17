import React, { useState, useEffect } from "react";
import "./BibleController.css";

const BibleController = ({ ws, roomId }) => {
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState([]);
	const [selectedVerse, setSelectedVerse] = useState(null);
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

	const searchVerses = async () => {
		try {
			const response = await fetch(
				`/api/bible/search?query=${encodeURIComponent(
					searchQuery
				)}&language=${currentLanguage}`
			);
			const data = await response.json();
			setSearchResults(data.verses || []);
		} catch (error) {
			console.error("Error searching verses:", error);
		}
	};

	const handleBookChange = (e) => {
		setSelectedBook(e.target.value);
		setSelectedChapter("");
		setSelectedVerseNum("");
	};

	const handleChapterChange = (e) => {
		setSelectedChapter(e.target.value);
		setSelectedVerseNum("");
	};

	const handleVerseChange = (e) => {
		setSelectedVerseNum(e.target.value);
	};

	const selectVerse = async (reference) => {
		try {
			const response = await fetch(
				`/api/bible/verse?reference=${encodeURIComponent(
					reference
				)}&language=${currentLanguage}`
			);
			const data = await response.json();
			setSelectedVerse(data);

			// Send to WebSocket
			if (ws && ws.readyState === WebSocket.OPEN) {
				ws.send(
					JSON.stringify({
						type: "bible",
						action: "select",
						reference,
						language: currentLanguage,
					})
				);
			}

			// Add to history
			setHistory((prev) => [...prev, { reference, language: currentLanguage }]);
		} catch (error) {
			console.error("Error selecting verse:", error);
		}
	};

	const handleKeyPress = (e) => {
		if (e.key === "Enter") {
			searchVerses();
		}
	};

	const handleLanguageChange = (e) => {
		const newLanguage = e.target.value;
		setCurrentLanguage(newLanguage);
		if (selectedVerse) {
			selectVerse(selectedVerse.reference);
		}
	};

	const getSelectedBook = () =>
		BIBLE_BOOKS.find((book) => book.id === selectedBook);
	const selectedBookData = getSelectedBook();

	return (
		<div className="bible-controller">
			<div className="search-section">
				<input
					type="text"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					onKeyPress={handleKeyPress}
					placeholder="Search Bible verses..."
				/>
				<button onClick={searchVerses}>Search</button>

				<select value={currentLanguage} onChange={handleLanguageChange}>
					{languages.map((lang) => (
						<option key={lang.code} value={lang.code}>
							{lang.name}
						</option>
					))}
				</select>
			</div>

			<div className="book-selection">
				<select value={selectedBook} onChange={handleBookChange}>
					<option value="">Select a Book</option>
					{BIBLE_BOOKS.map((book) => (
						<option key={book.id} value={book.id}>
							{book.name}
						</option>
					))}
				</select>

				{selectedBook && (
					<select value={selectedChapter} onChange={handleChapterChange}>
						<option value="">Select Chapter</option>
						{[...Array(selectedBookData.chapters)].map((_, i) => (
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
						onChange={handleVerseChange}
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

			<div className="results-section">
				{searchResults.map((verse, index) => (
					<div
						key={index}
						className="verse-result"
						onClick={() => selectVerse(verse.reference)}
					>
						<strong>{verse.reference}</strong>
						<p>{verse.text}</p>
					</div>
				))}
			</div>

			{selectedVerse && (
				<div className="selected-verse">
					<h3>{selectedVerse.reference}</h3>
					<p>{selectedVerse.text}</p>
				</div>
			)}

			<div className="history-section">
				<h4>History</h4>
				{history.map((item, index) => (
					<div
						key={index}
						className="history-item"
						onClick={() => selectVerse(item.reference)}
					>
						{item.reference} ({item.language})
					</div>
				))}
			</div>
		</div>
	);
};

export default BibleController;
