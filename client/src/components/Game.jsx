import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import confetti from 'canvas-confetti';
import Chat from './Chat';

const Game = ({ room, onLeave }) => {
  const socket = useSocket();
  const [board, setBoard] = useState(room.board || Array(9).fill(null));
  const [status, setStatus] = useState(room.status);
  const [turn, setTurn] = useState(room.turn);
  const [players, setPlayers] = useState(room.players);
  const [winner, setWinner] = useState(null);
  const [winnerName, setWinnerName] = useState(null);
  const [myPlayer, setMyPlayer] = useState(null);
  const [opponentLeft, setOpponentLeft] = useState(false);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const me = room.players.find(p => p.id === socket.id);
    setMyPlayer(me);

    socket.on('update_game', (updatedRoom) => {
      setBoard(updatedRoom.board);
      setTurn(updatedRoom.turn);
    });

    socket.on('game_start', (updatedRoom) => {
      setStatus('playing');
      setBoard(updatedRoom.board);
      setTurn(updatedRoom.turn);
      setPlayers(updatedRoom.players);

      const me = updatedRoom.players.find(p => p.id === socket.id);
      setMyPlayer(me);
    });

    socket.on('game_over', ({ winner, winnerName, board }) => {
      setBoard(board);
      setWinner(winner);
      setWinnerName(winnerName);
      setStatus('finished');

      if (winner === me.symbol) {
        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#10b981', '#ffffff']
        });
      }
    });

    socket.on('game_reset', (updatedRoom) => {
      setBoard(updatedRoom.board);
      setTurn(updatedRoom.turn);
      setStatus('playing');
      setWinner(null);
      setWinnerName(null);
    });

    socket.on('player_left', () => {
      setOpponentLeft(true);
      setOpponentDisconnected(false);
    });

    socket.on('player_disconnected_temporary', () => {
      setOpponentDisconnected(true);
    });

    socket.on('player_reconnected', () => {
      setOpponentDisconnected(false);
      setOpponentLeft(false);
    });

    return () => {
      socket.off('update_game');
      socket.off('game_over');
      socket.off('game_reset');
      socket.off('player_left');
      socket.off('game_start');
      socket.off('player_disconnected_temporary');
      socket.off('player_reconnected');
    };
  }, [socket, room, onLeave]);

  const handleCellClick = (index) => {
    if (board[index] || status !== 'playing' || turn !== socket.id) return;
    socket.emit('make_move', { roomId: room.id, index });
  };

  const handlePlayAgain = () => {
    socket.emit('play_again', room.id);
  }

  const getStatusMessage = () => {
    if (status === 'waiting') return "WAITING FOR OPPONENT";
    if (status === 'finished') {
      if (winner === 'draw') return "DRAW DETECTED";
      return `${winnerName} WINS`;
    }
    if (turn === socket.id) return "YOUR TURN";
    return "OPPONENT'S TURN";
  };

  const isMyTurn = turn === socket.id && status === 'playing';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden bg-[#050508]">
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>

      {/* Top Bar / HUD */}
      <div className="w-full max-w-7xl mx-auto p-6 flex justify-between items-center absolute top-0 left-0 z-20">
        <div className="flex items-center gap-3">
          <div className="text-cyan-500 font-bold border border-cyan-500/30 px-3 py-1 text-xs tracking-widest bg-cyan-900/10">
            SECTOR: {room.id.slice(0, 4).toUpperCase()}
          </div>
        </div>
        <button
          onClick={() => {
            socket.emit('leave_room');
            onLeave();
          }}
          className="text-xs text-red-400 hover:text-red-300 font-mono tracking-wider flex items-center gap-2 px-4 py-2 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/30"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          ABORT MISSION
        </button>
      </div>

      <div className="z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 px-4 mt-20 lg:mt-16 h-auto lg:h-[80vh] pb-8 lg:pb-0">

        {/* Main Game Area */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center relative">

          {/* Score/Status Header */}
          <div className="w-full flex justify-between items-end mb-8 relative">
            <div className={`transition-all duration-300 ${turn === players[0]?.id && status === 'playing' ? 'opacity-100 scale-105' : 'opacity-60 scale-100'}`}>
              <div className="text-[8px] sm:text-[10px] text-cyan-500 tracking-widest mb-1">PLAYER X</div>
              <div className="text-xl sm:text-2xl font-bold text-white uppercase">{players[0]?.name}</div>
              <div className={`h-1 bg-cyan-500 mt-2 transition-all duration-300 ${turn === players[0]?.id && status === 'playing' ? 'w-full shadow-[0_0_10px_cyan]' : 'w-0'}`}></div>
            </div>

            <div className="absolute left-1/2 -translate-x-1/2 bottom-2 text-center w-full">
              <div className={`px-4 py-1 sm:px-6 sm:py-2 border backdrop-blur-md text-[10px] sm:text-sm font-bold tracking-widest clip-corner inline-block ${status === 'playing' ?
                isMyTurn ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)] animate-pulse' : 'bg-rose-500/10 border-rose-500 text-rose-400'
                : 'bg-slate-800/80 border-slate-600 text-slate-400'
                }`}>
                {getStatusMessage()}
              </div>
            </div>

            <div className={`transition-all duration-300 text-right ${turn === players[1]?.id && status === 'playing' ? 'opacity-100 scale-105' : 'opacity-60 scale-100'}`}>
              <div className="text-[8px] sm:text-[10px] text-rose-500 tracking-widest mb-1">PLAYER O</div>
              <div className="text-xl sm:text-2xl font-bold text-white uppercase">{players[1]?.name || '...'}</div>
              <div className={`h-1 bg-rose-500 mt-2 ml-auto transition-all duration-300 ${turn === players[1]?.id && status === 'playing' ? 'w-full shadow-[0_0_10px_#f43f5e]' : 'w-0'}`}></div>
            </div>
          </div>

          {/* Unique Board Layout */}
          <div className="relative p-1">
            <div className="app-container">
              <h1>Welcome to Tic Tac Toe Game</h1>

              {/* Decorative Corners */}
              <div className="absolute -top-4 -left-4 w-8 h-8 border-t-2 border-l-2 border-cyan-500/50"></div>
              <div className="absolute -top-4 -right-4 w-8 h-8 border-t-2 border-r-2 border-cyan-500/50"></div>
              <div className="absolute -bottom-4 -left-4 w-8 h-8 border-b-2 border-l-2 border-cyan-500/50"></div>
              <div className="absolute -bottom-4 -right-4 w-8 h-8 border-b-2 border-r-2 border-cyan-500/50"></div>

              <div className="grid grid-cols-3 gap-0 bg-slate-800/50 p-1 border border-slate-700 backdrop-blur-sm">
                {board.map((cell, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCellClick(idx)}
                    disabled={!!cell || turn !== socket.id || status !== 'playing'}
                    className={`w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 flex items-center justify-center text-5xl sm:text-6xl md:text-7xl font-black transition-all duration-200 border border-slate-700 relative overflow-hidden group hover:bg-white/5 ${!cell && isMyTurn ? 'cursor-pointer' : 'cursor-default'
                      }`}
                  >
                    {/* Hover effect when it's your turn and cell is empty */}
                    {!cell && isMyTurn && (
                      <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    )}

                    <span className={`relative z-10 transform transition-all duration-300 ${cell ? 'scale-100 opacity-100' : 'scale-50 opacity-0'} ${cell === 'X' ? 'text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]' : 'text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.6)]'
                      }`}>
                      {cell}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {status === 'finished' && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="bg-[#0f111a] border border-cyan-500 p-8 text-center shadow-[0_0_50px_rgba(6,182,212,0.3)] max-w-sm w-full clip-corner animate-in zoom-in-90 duration-300">
                <h3 className={`text-3xl font-black italic mb-2 uppercase ${winner === 'draw' ? 'text-white' : (winner === myPlayer?.symbol ? 'text-emerald-400' : 'text-rose-500')}`}>
                  {winner === 'draw' ? 'STALEMATE' : (winner === myPlayer?.symbol ? 'VICTORY' : 'DEFEAT')}
                </h3>
                <p className={`mb-8 font-mono tracking-wide ${winner === 'draw' ? 'text-slate-400' : (winner === myPlayer?.symbol ? 'text-emerald-500/80' : 'text-rose-500/80')}`}>
                  {winner === 'draw' ? 'MATCH DRAW' : `${winnerName} ${winner === myPlayer?.symbol ? 'DOMINATED' : 'ELIMINATED YOU'}`}
                </p>

                <button
                  onClick={handlePlayAgain}
                  className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold tracking-widest uppercase hover:scale-105 transition-transform shadow-lg shadow-cyan-500/25"
                >
                  Re-Match
                </button>
              </div>
            </div>
          )}

          {opponentLeft && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
              <div className="bg-[#0f111a] border border-amber-500/50 p-8 text-center shadow-[0_0_50px_rgba(245,158,11,0.2)] max-w-sm w-full clip-corner animate-in zoom-in-90 duration-300">
                <h3 className="text-2xl font-black text-amber-500 italic mb-2 uppercase">
                  CONNECTION LOST
                </h3>
                <p className="text-slate-400 mb-8 font-mono tracking-wide text-sm">
                  OPPONENT DISCONNECTED FROM SECTOR
                </p>

                <button
                  onClick={onLeave}
                  className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold tracking-widest uppercase hover:scale-105 transition-transform shadow-lg shadow-amber-500/20"
                >
                  Return to Lobby
                </button>
              </div>
            </div>
          )}

          {opponentDisconnected && !opponentLeft && (
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 bg-amber-500/20 border border-amber-500/50 px-6 py-2 rounded shadow-[0_0_20px_rgba(245,158,11,0.2)] animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></div>
                <span className="text-amber-400 font-bold text-xs tracking-widest">SIGNAL LOST: WAITING FOR RECONNECT...</span>
              </div>
            </div>
          )}
        </div>

        {/* Chat */}
        <div className="lg:col-span-4 h-[300px] lg:h-full flex flex-col pt-8 lg:pt-0">
          <div className="flex-1 bg-[#0f111a]/80 border-l border-t border-r border-slate-800 relative flex flex-col h-full rounded-t-lg backdrop-blur-md">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-500"></div>
            <Chat roomId={room.id} playerName={myPlayer?.name || 'You'} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;
