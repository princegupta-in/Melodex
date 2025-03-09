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
            origin: "*", // In production, restrict this to your domain
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        console.log("👻 New client connected:", socket.id);

        // When a client joins a room, add them to that room.
        socket.on("joinRoom", (roomId) => {
            socket.join(roomId);
            console.log(`🚀 Socket ${socket.id} joined room ${roomId}`);
            // Note: Do not broadcast participant info here yet.
        });

        // Listen for participantJoined event.
        // The client should emit this after they've joined (i.e. after entering their name).
        socket.on("participantJoined", (data) => {
            // Data should be: { roomId, participant: { id, name, avatarUrl, ... } }
            console.log("👋 Participant joined:", data);
            // Broadcast to everyone in the room (including the joining socket if needed)
            io.to(data.roomId).emit("participantJoined", data);
        });

        // Listen for newSong event
        socket.on("newSong", (data) => {
            console.log(`🎵 New song in room ${data.roomId}:`, data.song);
            io.to(data.roomId).emit("songAdded", data);
        });

        // Listen for voteUpdate event
        socket.on("voteUpdate", (data) => {
            console.log(`🔄 Vote update in room ${data.roomId} for stream ${data.streamId}:`, data);
            io.to(data.roomId).emit("voteUpdated", data);
        });

        socket.on("disconnect", () => {
            console.log("💀 Client disconnected:", socket.id);
        });
    });

    expressApp.all("*", (req, res) => {
        return handle(req, res);
    });

    httpServer.listen(port, (err) => {
        if (err) throw err;
        console.log(`> Ready on http://localhost:${port}`);
    });
});
