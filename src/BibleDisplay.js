import React, { useState, useEffect } from "react";
import "./BibleDisplay.css";

const BibleDisplay = ({ ws, roomId }) => {
	const [currentVerse, setCurrentVerse] = useState(null);
	const [languages, setLanguages] = useState([
		{ code: "en", name: "English" },
		{ code: "kn", name: "Kannada" },
		{ code: "te", name: "Telugu" },
	]);
	const [verseTexts, setVerseTexts] = useState({});

	useEffect(() => {
		if (ws) {
			ws.onmessage = (event) => {
				const data = JSON.parse(event.data);
				if (data.type === "bible") {
					setCurrentVerse(data.state.currentReference);
					// Fetch verse in all languages
					fetchVerseInAllLanguages(data.state.currentReference);
				}
			};
		}
	}, [ws]);

	const fetchVerseInAllLanguages = async (reference) => {
		const newVerseTexts = {};
		for (const lang of languages) {
			try {
				const response = await fetch(
					`/api/bible/verse?reference=${encodeURIComponent(
						reference
					)}&language=${lang.code}`
				);
				const data = await response.json();
				newVerseTexts[lang.code] = data.text;
			} catch (error) {
				console.error(`Error fetching verse in ${lang.name}:`, error);
				newVerseTexts[lang.code] = "Error loading verse";
			}
		}
		setVerseTexts(newVerseTexts);
	};

	return (
		<div className="bible-display">
			{currentVerse ? (
				<>
					<div className="verse-reference">
						<h2>{currentVerse}</h2>
					</div>
					<div className="verse-texts">
						{languages.map((lang) => (
							<div key={lang.code} className="verse-text">
								<h3>{lang.name}</h3>
								<p>{verseTexts[lang.code] || "Loading..."}</p>
							</div>
						))}
					</div>
				</>
			) : (
				<div className="no-verse-selected">
					<h2>No verse selected</h2>
					<p>Select a verse from the controller to display it here</p>
				</div>
			)}
		</div>
	);
};

export default BibleDisplay;
