import React from "react";
import { Link } from "react-router-dom";
import { FaDesktop, FaMobileAlt } from "react-icons/fa";

const Home = () => {
	return (
		<div className="bg-gray-50 min-h-screen">
			<div className="home-container py-12 px-4 sm:px-6 lg:px-8">
				<div className="text-center">
					<h1 className="app-title text-4xl font-extrabold text-blue-600 tracking-tight sm:text-5xl">
						Lyrics Teleprompter
					</h1>
					<p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
						A reliable lyrics display solution for live performances
					</p>
				</div>

				<div className="mode-selection mt-16 max-w-4xl mx-auto">
					<div className="mode-card flex flex-col items-center p-8 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
						<div className="bg-blue-100 p-4 rounded-full mb-4">
							<FaMobileAlt className="text-blue-600 text-3xl" />
						</div>
						<h2 className="mode-title text-2xl font-bold mb-2">Controller</h2>
						<p className="mode-description text-gray-600 text-center mb-6">
							Control song selection and scrolling speed from your mobile device
						</p>
						<Link to="/controller" className="w-full">
							<button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md w-full transition-colors duration-200">
								Launch Controller
							</button>
						</Link>
					</div>

					<div className="mode-card flex flex-col items-center p-8 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
						<div className="bg-blue-100 p-4 rounded-full mb-4">
							<FaDesktop className="text-blue-600 text-3xl" />
						</div>
						<h2 className="mode-title text-2xl font-bold mb-2">Display</h2>
						<p className="mode-description text-gray-600 text-center mb-6">
							Show lyrics on a screen visible to performers
						</p>
						<Link to="/display" className="w-full">
							<button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md w-full transition-colors duration-200">
								Launch Display
							</button>
						</Link>
					</div>
				</div>

				<div className="mt-16 text-center">
					<p className="text-sm text-gray-500">
						Connect controllers and displays using the same session ID
					</p>
				</div>
			</div>
		</div>
	);
};

export default Home;
