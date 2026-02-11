const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const RoomManager = require("./managers/RoomManager");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const roomManager = new RoomManager(io);

io.on("connection", (socket) => {
  const sessionId = socket.handshake.query.sessionId;
  console.log("User connected:", socket.id, "Session:", sessionId);

  // Attempt reconnection
  const existingPlayer = roomManager.handleReconnection(socket.id, sessionId);
  if (existingPlayer) {
    console.log("Restoring session for:", existingPlayer.name);

    if (existingPlayer.roomId) {
      const room = roomManager.getRoom(existingPlayer.roomId);
      if (room) {
        socket.join(room.id);

        socket.emit("game_start", roomManager.getRoomState(room));

        socket.emit("update_game", roomManager.getRoomState(room));
      } else {
        socket.emit("lobby_joined");
      }
    } else {
      socket.emit("lobby_joined");
    }
    socket.emit("rooms_update", roomManager.getRooms());
  }

  // --- Lobby Events ---
  socket.on("join_lobby", (name) => {
    roomManager.registerPlayer(socket.id, name, sessionId);
    socket.emit("lobby_joined");
    socket.emit("rooms_update", roomManager.getRooms());
  });

  socket.on("create_room", (gameType = "tictactoe", options = {}) => {
    const room = roomManager.createRoom(socket.id, gameType, options);
    if (room) {
      socket.join(room.id);
      socket.emit("room_joined", roomManager.getRoomState(room));
      roomManager.broadcastRoomsUpdate();
    }
  });

  socket.on("join_room", ({ roomId, code }) => {
    const result = roomManager.joinRoom(socket.id, roomId, code);
    if (result.success) {
      const room = result.room;
      socket.join(roomId);
      const roomState = roomManager.getRoomState(room);
      io.to(roomId).emit("game_start", roomState);
      roomManager.broadcastRoomsUpdate();
    } else {
      socket.emit("join_error", { message: result.error, isPrivate: result.isPrivate });
    }
  });

  // --- Game Events ---
  socket.on("make_move", ({ roomId, index }) => {
    const output = roomManager.makeMove(socket.id, roomId, index);
    if (output) {
      const { room, player } = output;
      const roomState = roomManager.getRoomState(room);

      if (roomState.status === "finished") {
        io.to(roomId).emit("game_over", {
          winner: roomState.winner,
          winnerName: roomState.winnerName,
          board: roomState.board,
        });
      } else {
        io.to(roomId).emit("update_game", roomState);
      }
    }
  });

  socket.on("play_again", (roomId) => {
    const room = roomManager.resetGame(roomId);
    if (room) {
      io.to(roomId).emit("game_reset", roomManager.getRoomState(room));
      roomManager.broadcastRoomsUpdate();
    }
  });

  // --- Chat Events ---
  socket.on("send_message", (messageData) => {
    socket.to(messageData.roomId).emit("chat_message", messageData);
  });

  socket.on("leave_room", () => {
    roomManager.leaveRoom(socket.id);
  });

  // --- Disconnect ---
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    roomManager.handleDisconnect(socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
