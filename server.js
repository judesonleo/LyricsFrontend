const express = require("express");
const path = require("path");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
});

// Serve static files from the React build directory
app.use(express.static(path.join(__dirname, "build")));

// Handle React routing, return all requests to React app
app.get("*", (req, res) => {
	res.sendFile(path.join(__dirname, "build", "index.html"));
});

// WebSocket connection handling
io.on("connection", (socket) => {
	console.log("A user connected");

	socket.on("disconnect", () => {
		console.log("User disconnected");
	});

	// Add your other socket event handlers here
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, "0.0.0.0", () => {
	console.log(`Server is running on port ${PORT}`);
});
