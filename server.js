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
            origin: "*", // Adjust in production
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        console.log("👻 New client connected:", socket.id);

        // When a client emits "joinRoom", just join the room
        socket.on("joinRoom", (roomId) => {
            socket.join(roomId);
            console.log(`🚀 Socket ${socket.id} joined room ${roomId}`);
        });

        // When a client emits "participantJoined" (with full participant data),
        // broadcast it to everyone else in the room.
        socket.on("participantJoined", (data) => {
            console.log("👋 participantJoined event received:", data);
            // Broadcasting to everyone in the room except the sender.
            socket.broadcast.to(data.roomId).emit("participantJoined", data);
            // Alternatively, if you want all clients (including the sender) to get the event, use:
            // io.to(data.roomId).emit("participantJoined", data);
        });

        // Other events:
        socket.on("newSong", (data) => {
            console.log(`🎵 New song in room ${data.roomId}:`, data.song);
            io.to(data.roomId).emit("songAdded", data);
        });

        socket.on("voteUpdate", (data) => {
            console.log(`🔄 Vote update in room ${data.roomId} for stream ${data.streamId}:`, data);
            io.to(data.roomId).emit("voteUpdated", data);
        });

        socket.on("disconnect", () => {
            console.log("💀 Client disconnected:", socket.id);
        });
    });

    // Let Next.js handle all other routes
    expressApp.all("*", (req, res) => handle(req, res));

    httpServer.listen(port, (err) => {
        if (err) throw err;
        console.log(`> Ready on http://localhost:${port}`);
    });
});
