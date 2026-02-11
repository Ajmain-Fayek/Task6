# 🎮 Tic Tac Toe — Real-Time Session Based Game

A lightweight, real-time Tic Tac Toe game built for instant fun. No accounts. No database. Just create a session, invite your friends, and start playing.

---

## Live: [Tic Tac Toe](https://task6-navy.vercel.app)

---

## 🚀 Features

- ✅ No Account Required
  - Start playing instantly without registration or login.

- 😎 Choose Your Code Name
  - Enter a unique and fun nickname before joining a session.

  - 🔐 Create Public or Private Sessions

  - Public: Anyone can join

  - Private: Invite-only with session ID

- 👥 Invite Friends Easily
  - Share the session link or ID to start playing together.

- 💬 Unrestricted & Encrypted Chat
  -Secure, real-time communication inside each session.

- 🧠 No Database
  - The application runs entirely without persistent storage.

- ⚡ In-Memory Sessions
  - Sessions are stored in memory for ultra-fast gameplay.

- 🔄 Automatic Reconnection
  - Reloading the page reconnects you to your existing session.

- 🎸 Rock and Roll Experience
  - Minimal, fast, and focused on gameplay.

---

## 🏗️ How It Works

- Enter a code name.

- Create or join a session.

- Share the session with your friend.

- Play Tic Tac Toe in real time.

- Chat securely during the match.

- Refresh the page — automatically reconnect.

---

## 📦 Architecture Overview

- Real-time communication (WebSocket-based)

- In-memory session management

- No persistent storage

- Session-based room handling

- Client-side reconnection logic

---

## ⚠️ Important Notes

- Since sessions are stored in memory:
  - Restarting the server clears all sessions.

  - Sessions are temporary and not permanently stored.

- Designed for simplicity and speed rather than long-term persistence.

---

## 🛠️ Setup & Run

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Or start production server
npm start
```
