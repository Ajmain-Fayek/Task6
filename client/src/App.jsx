import React, { useState } from 'react';
import { SocketProvider } from './context/SocketContext';
import Lobby from './components/Lobby';
import Game from './components/Game';

function App() {
  const [currentRoom, setCurrentRoom] = useState(null);

  const handleJoinGame = (room) => {
    setCurrentRoom(room);
  };

  const handleLeaveGame = () => {
    setCurrentRoom(null);
  };

  return (
    <SocketProvider>
      {currentRoom ? (
        <Game room={currentRoom} onLeave={handleLeaveGame} />
      ) : (
        <Lobby onJoinGame={handleJoinGame} />
      )}
    </SocketProvider>
  );
}

export default App;
