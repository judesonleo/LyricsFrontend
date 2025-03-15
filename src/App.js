import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home";
import Controller from "./ControllerClient"; // Example
import Display from "./DisplayClient"; // Example
import "./App.css";
function App() {
	return (
		<Router>
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/controller" element={<Controller />} />
				<Route path="/display" element={<Display />} />
			</Routes>
		</Router>
	);
}

export default App;
