const { v4: uuidv4 } = require("uuid");
const TicTacToe = require("../games/TicTacToe");

class RoomManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map();
    this.players = new Map();
    this.sessions = new Map();
    this.disconnectTimeouts = new Map();
  }

  // Player Management
  registerPlayer(socketId, name, sessionId) {
    let currentRoomId = null;
    if (this.sessions.has(sessionId)) {
      currentRoomId = this.sessions.get(sessionId).roomId;
    }

    this.sessions.set(sessionId, { name, roomId: currentRoomId, socketId });
    this.players.set(socketId, { name, roomId: currentRoomId, sessionId });

    if (this.disconnectTimeouts.has(sessionId)) {
      clearTimeout(this.disconnectTimeouts.get(sessionId));
      this.disconnectTimeouts.delete(sessionId);
    }
  }

  handleReconnection(socketId, sessionId) {
    if (this.sessions.has(sessionId)) {
      const session = this.sessions.get(sessionId);

      if (this.disconnectTimeouts.has(sessionId)) {
        clearTimeout(this.disconnectTimeouts.get(sessionId));
        this.disconnectTimeouts.delete(sessionId);
      }

      this.players.delete(session.socketId);
      session.socketId = socketId;
      this.players.set(socketId, { name: session.name, roomId: session.roomId, sessionId });
      this.sessions.set(sessionId, session);

      if (session.roomId) {
        const room = this.rooms.get(session.roomId);
        if (room) {
          const roomPlayer = room.players.find((p) => p.sessionId === sessionId);
          if (roomPlayer) {
            roomPlayer.id = socketId;
          }

          this.io.to(session.roomId).emit("player_reconnected", { playerId: socketId });
        }
      }

      return session;
    }
    return null;
  }

  getPlayer(socketId) {
    return this.players.get(socketId);
  }

  handleDisconnect(socketId) {
    const player = this.players.get(socketId);
    if (player) {
      const sessionId = player.sessionId;

      if (player.roomId) {
        this.io.to(player.roomId).emit("player_disconnected_temporary", { playerId: socketId });

        const timeoutId = setTimeout(() => {
          if (player.roomId) {
            this.handlePlayerLeave(sessionId, player.roomId);
          }

          if (this.sessions.get(sessionId)?.roomId === player.roomId) {
            const session = this.sessions.get(sessionId);
            if (session) session.roomId = null;
          }
          this.disconnectTimeouts.delete(sessionId);
        }, 15000);

        this.disconnectTimeouts.set(sessionId, timeoutId);
      } else {
        this.sessions.delete(sessionId);
      }

      this.players.delete(socketId);
    }
  }

  // Explicit leave (e.g. Abort Mission)
  leaveRoom(socketId) {
    const player = this.players.get(socketId);
    if (player && player.roomId) {
      this.handlePlayerLeave(player.sessionId, player.roomId);

      const session = this.sessions.get(player.sessionId);
      if (session) {
        session.roomId = null;
      }
    }

    if (player) player.roomId = null;
  }

  createRoom(hostSocketId, gameType = "tictactoe", options = {}) {
    const player = this.players.get(hostSocketId);
    if (!player) return null;

    const roomId = uuidv4();
    let gameInstance;

    if (gameType === "tictactoe") {
      gameInstance = new TicTacToe();
    } else {
      gameInstance = new TicTacToe();
    }

    const room = {
      id: roomId,
      gameType,
      players: [{ id: hostSocketId, name: player.name, symbol: "X", sessionId: player.sessionId }],
      game: gameInstance,
      status: "waiting",
      isPrivate: !!options.isPrivate,
      code: options.code || null,
    };

    this.rooms.set(roomId, room);
    player.roomId = roomId;

    const session = this.sessions.get(player.sessionId);
    if (session) session.roomId = roomId;

    return room;
  }

  joinRoom(socketId, roomId, code = null) {
    const room = this.rooms.get(roomId);
    const player = this.players.get(socketId);

    if (!room || !player) return { success: false, error: "Room or player not found" };
    if (room.status !== "waiting") return { success: false, error: "Room is already playing" };
    if (room.players.length >= 2) return { success: false, error: "Room is full" };

    if (room.isPrivate && room.code !== code) {
      return { success: false, error: "Invalid room code", isPrivate: true };
    }

    room.players.push({
      id: socketId,
      name: player.name,
      symbol: "O",
      sessionId: player.sessionId,
    });
    room.status = "playing";
    player.roomId = roomId;

    const session = this.sessions.get(player.sessionId);
    if (session) session.roomId = roomId;

    return { success: true, room };
  }

  handlePlayerLeave(sessionIdOrSocketId, roomId) {
    const room = this.rooms.get(roomId);
    if (room) {
      this.io.to(roomId).emit("player_left");
      this.rooms.delete(roomId);
      this.broadcastRoomsUpdate();
    }
  }

  // Game Actions
  makeMove(socketId, roomId, index) {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== "playing") return null;

    const player = room.players.find((p) => p.id === socketId);
    if (!player) return null;

    const success = room.game.makeMove(index, player.symbol);

    if (success) {
      return { room, player };
    }
    return null;
  }

  resetGame(roomId) {
    const room = this.rooms.get(roomId);
    if (room) {
      const startingSymbol = Math.random() < 0.5 ? "X" : "O";

      room.game.reset(startingSymbol);
    }
    return room;
  }

  getRoomState(room) {
    const gameState = room.game.getState();

    const turnPlayer = room.players.find((p) => p.symbol === gameState.turn);
    const winnerName =
      gameState.winner === "draw"
        ? null
        : room.players.find((p) => p.symbol === gameState.winner)?.name;

    return {
      id: room.id,
      players: room.players,
      board: gameState.board,
      turn: turnPlayer ? turnPlayer.id : null,
      status:
        room.status === "waiting"
          ? "waiting"
          : gameState.status === "playing"
            ? "playing"
            : "finished",
      winner: gameState.winner,
      status:
        room.status === "waiting"
          ? "waiting"
          : gameState.status === "playing"
            ? "playing"
            : "finished",
      winner: gameState.winner,
      winnerName: winnerName,
      isPrivate: room.isPrivate,
    };
  }

  broadcastRoomsUpdate() {
    const roomsArray = Array.from(this.rooms.values()).map((room) => {
      return [room.id, this.getRoomState(room)];
    });
    this.io.emit("rooms_update", roomsArray);
  }

  getRooms() {
    return Array.from(this.rooms.values()).map((room) => [room.id, this.getRoomState(room)]);
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }
}

module.exports = RoomManager;
