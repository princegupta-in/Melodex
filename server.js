const express = require("express");
const { createServer } = require("http");
const next = require("next");
const { Server: SocketIOServer } = require("socket.io");

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const expressApp = express();
    const httpServer = createServer(expressApp);

    // Initialize Socket.IO
    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: process.env.NODE_ENV === "production"
                ? ["https://melodex.tech", "https://www.melodex.tech", "https://melodex-two.vercel.app/"]
                : "*",
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        console.log("👻 New client connected:", socket.id);

        socket.on("joinRoom", (roomId) => {
            socket.join(roomId);
            console.log(`🚀 Socket ${socket.id} joined room ${roomId}`);
        });

        // When a client emits "participantJoined", broadcasting it to everyone else in the room.
        socket.on("participantJoined", (data) => {
            console.log("👋 participantJoined event received:", data);
            // Broadcasting to everyone in the room except the sender.
            socket.broadcast.to(data.roomId).emit("participantJoined", data);
        });

        // Other events:
        socket.on("newSong", (data) => {
            console.log(`🎵 New song in room ${data.roomId}:`, data.song);
            io.to(data.roomId).emit("songAdded", data);
        });

        socket.on("voteUpdate", (data) => {
            // data = { roomId, streamId, upvotes: [...] }
            console.log(`🔄 Vote update in room ${data.roomId} for stream ${data.streamId}:`, data);
            // Re-broadcast to all clients in the room
            io.to(data.roomId).emit("voteUpdated", data);
        });

        socket.on("disconnect", () => {
            console.log("💀 Client disconnected:", socket.id);
        });

        socket.on("playbackUpdate", (data) => {
            console.log("Received playbackUpdate from client:", data);
            io.to(data.roomId).emit("playbackUpdate", data);
        });

        socket.on("currentSongChanged", (data) => {
            console.log("Received currentSongChanged event from", socket.id, ":", data);
            io.to(data.roomId).emit("currentSongChanged", data);
        });
        socket.on("muteUpdate", (data) => {
            console.log("Received mute event from", socket.id, ":", data);
            io.to(data.roomId).emit("muteUpdate", data);
        });

    });

    // Let Next.js handle all other routes
    expressApp.all("*", (req, res) => handle(req, res));

    httpServer.listen(port, (err) => {
        if (err) throw err;
        console.log(`> Ready on http://localhost:${port}`);
    });
});
