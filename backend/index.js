const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");
const CryptoJS = require("crypto-js");

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:3000", // Replace with your React app URL
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// In-memory storage (replace with a database in production)
const rooms = new Map(); // Stores room information
const activeUsers = new Map(); // Stores user socket mappings

// Helper function to hash password
const hashPassword = (password) => {
  return CryptoJS.SHA256(password).toString();
};

// Middleware to check room password
const authenticateRoom = (roomId, password) => {
  const room = rooms.get(roomId);
  if (!room) return false;
  return room.password === hashPassword(password);
};

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("leaveRoom", ({ roomId, username }) => {
    const room = rooms.get(roomId);
    if (room) {
      room.users.delete(username);
      io.to(roomId).emit("userLeft", { username });
      socket.leave(roomId);
      activeUsers.delete(socket.id);
    }
  });
  // Handle room creation
  socket.on("createRoom", ({ roomId, password, username }) => {
    try {
      if (rooms.has(roomId)) {
        socket.emit("error", "Room already exists");
        return;
      }

      const hashedPassword = hashPassword(password);
      rooms.set(roomId, {
        password: hashedPassword,
        users: new Set(),
        messages: [],
      });

      socket.emit("roomCreated", { roomId });
      console.log(`Room created: ${roomId}`);
    } catch (error) {
      socket.emit("error", "Error creating room");
    }
  });

  // Handle joining room
  socket.on("joinRoom", ({ roomId, password, username }) => {
    try {
      const isAuthenticated = authenticateRoom(roomId, password);
      if (!isAuthenticated) {
        socket.emit("error", "Invalid room or password");
        return;
      }

      const room = rooms.get(roomId);

      // Leave previous room if any
      const previousRoom = [...socket.rooms].find((room) => room !== socket.id);
      if (previousRoom) {
        socket.leave(previousRoom);
        const prevRoom = rooms.get(previousRoom);
        if (prevRoom) {
          prevRoom.users.delete(username);
          io.to(previousRoom).emit("userLeft", { username });
        }
      }

      // Join new room
      socket.join(roomId);
      room.users.add(username);
      activeUsers.set(socket.id, { username, roomId });

      // Send room history and user list
      socket.emit("roomJoined", {
        messages: room.messages,
        users: Array.from(room.users),
      });

      // Notify others
      io.to(roomId).emit("userJoined", { username });
      console.log(`${username} joined room: ${roomId}`);
    } catch (error) {
      socket.emit("error", "Error joining room");
    }
  });

  // Handle messages
  socket.on("sendMessage", ({ roomId, message }) => {
    const user = activeUsers.get(socket.id);
    if (!user || !rooms.has(roomId)) return;
    console.log("dispatch message");

    const messageObject = {
      id: Date.now(),
      user: user.username,
      text: message,
      time: new Date().toLocaleTimeString(),
    };

    const room = rooms.get(roomId);
    room.messages.push(messageObject);

    // Broadcast to room
    io.to(roomId).emit("newMessage", messageObject);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    const user = activeUsers.get(socket.id);
    if (user) {
      const room = rooms.get(user.roomId);
      if (room) {
        room.users.delete(user.username);
        io.to(user.roomId).emit("userLeft", { username: user.username });
      }
      activeUsers.delete(socket.id);
    }
    console.log("Client disconnected");
  });
});

// API Routes
app.get("/api/rooms", (req, res) => {
  const roomList = Array.from(rooms.keys());
  res.json({ rooms: roomList });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

const PORT = process.env.PORT || 5050;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
