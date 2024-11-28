const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

let adminSocketId = null;

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Admin bergabung
  socket.on("join-admin", () => {
    adminSocketId = socket.id;
    console.log(`Admin joined: ${adminSocketId}`);
  });

  // Klien bergabung
  socket.on("join-client", () => {
    console.log(`Client joined: ${socket.id}`);
    if (adminSocketId) {
      io.to(adminSocketId).emit("new-client", { clientId: socket.id });
      // Kirim adminSocketId ke klien
      socket.emit("adminId", adminSocketId);
    } else {
      console.log(`No admin connected. Notifying client: ${socket.id}`);
      socket.emit("no-admin");
    }
  });

  // Signaling data
  socket.on("signal", (data) => {
    console.log(`Signal received from ${socket.id}:`, data);
    const { to, ...payload } = data;
    io.to(to).emit("signal", { from: socket.id, ...payload });
  });

  // User disconnect
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    if (socket.id === adminSocketId) {
      console.log("Admin disconnected. Clearing adminSocketId.");
      adminSocketId = null;
    }
    io.emit("user-disconnected", { userId: socket.id });
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
