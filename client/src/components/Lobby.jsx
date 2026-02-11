import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

const Lobby = ({ onJoinGame }) => {
  const socket = useSocket();
  const [name, setName] = useState(localStorage.getItem('playerName') || '');
  const [rooms, setRooms] = useState([]);
  const [isInLobby, setIsInLobby] = useState(false);


  const [isPrivate, setIsPrivate] = useState(false);
  const [createCode, setCreateCode] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    if (!socket) return;

    socket.on('rooms_update', (updatedRooms) => {
      setRooms(updatedRooms);
    });

    socket.on('room_joined', (room) => {
      onJoinGame(room);
    });

    socket.on('game_start', (room) => {
      onJoinGame(room);
    });

    socket.on('join_error', ({ message }) => {
      setJoinError(message);

      if (!showJoinModal) {
        alert(message);
      }
    });

    return () => {
      socket.off('rooms_update');
      socket.off('room_joined');
      socket.off('game_start');
      socket.off('join_error');
    };
  }, [socket, onJoinGame]);

  useEffect(() => {
    const storedName = localStorage.getItem('playerName');
    if (storedName && socket) {
      setName(storedName);
      socket.emit('join_lobby', storedName);
      setIsInLobby(true);
    }
  }, [socket]);

  const handleEnterLobby = (e) => {
    e.preventDefault();
    if (name.trim() && socket) {
      localStorage.setItem('playerName', name);
      socket.emit('join_lobby', name);
      setIsInLobby(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('playerName');
    setIsInLobby(false);
    setName('');
  };

  const createRoom = () => {
    if (socket) {
      if (isPrivate && createCode.length !== 4) {
        alert("Please enter a 4-digit code for private session.");
        return;
      }
      socket.emit('create_room', 'tictactoe', { isPrivate, code: createCode });
    }
  };

  const joinRoom = (roomId, isPrivateRoom) => {
    if (isPrivateRoom) {
      setSelectedRoomId(roomId);
      setJoinCode('');
      setJoinError('');
      setShowJoinModal(true);
    } else {
      if (socket) {
        socket.emit('join_room', { roomId });
      }
    }
  }

  const handleJoinPrivate = (e) => {
    e.preventDefault();
    if (socket && selectedRoomId) {
      socket.emit('join_room', { roomId: selectedRoomId, code: joinCode });
    }
  }

  if (!isInLobby) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none"></div>

        <div className="glass-panel p-10 rounded-none clip-path-polygon border-l-4 border-cyan-500 shadow-[0_0_50px_rgba(6,182,212,0.2)] w-full max-w-md relative z-10">
          <div className="absolute top-0 right-0 p-2 opacity-50 text-[10px] text-cyan-500 font-mono">SYS.LOGIN.V.1.0</div>

          <h1 className="text-5xl font-black text-center mb-2 text-white text-glow tracking-widest uppercase">
            Tic<span className="text-cyan-500">Tac</span>Toe
          </h1>
          <p className="text-center text-cyan-400/60 mb-10 font-mono text-sm tracking-widest">MULTIPLAYER TACTICAL INTERFACE</p>

          <form onSubmit={handleEnterLobby} className="space-y-8">
            <div className="relative group">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-4 bg-black/40 border border-slate-700/50 focus:border-cyan-500 text-white placeholder-slate-600 outline-none transition-all duration-300 font-mono text-lg peer"
                placeholder=" "
                required
              />
              <label className="absolute left-4 top-4 text-slate-500 transition-all duration-300 pointer-events-none peer-focus:-top-3 peer-focus:text-xs peer-focus:text-cyan-500 peer-not-placeholder-shown:-top-3 peer-not-placeholder-shown:text-xs bg-[#0a0a0f] px-1">
                OPERATOR NAME
              </label>
              <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-cyan-500 transition-all duration-300 peer-focus:w-full"></div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/50 text-cyan-400 font-bold tracking-widest uppercase transition-all duration-300 hover:text-white hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] relative overflow-hidden group"
            >
              <span className="relative z-10">Initialize Link</span>
              <div className="absolute inset-0 bg-cyan-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 -z-0 opacity-10"></div>
            </button>
          </form>
        </div>

        <div className="absolute bottom-10 text-slate-600 font-mono text-xs">
          SECURE CONNECTION ESTABLISHED // SYSTEM READY
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#050508] text-white p-4 font-sans relative">
      <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none"></div>

      {/* Header HUD */}
      <header className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center py-6 mb-8 border-b border-white/10 relative z-10 gap-4 md:gap-0">
        <div className="flex items-center gap-4 w-full md:w-auto justify-center md:justify-start">
          <div className="w-12 h-12 bg-cyan-900/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xl rounded clip-corner">
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-[10px] text-slate-400 tracking-widest">OPERATOR</div>
            <h1 className="text-2xl font-bold text-white tracking-wide flex items-center gap-3">
              {name}
              <button
                onClick={handleLogout}
                className="text-[10px] text-red-400 hover:text-red-300 border border-red-500/30 hover:bg-red-500/10 px-2 py-1 uppercase tracking-widest transition-colors rounded hover:shadow-[0_0_10px_rgba(239,68,68,0.2)]"
              >
                Logout
              </button>
            </h1>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-800/50 p-2 rounded border border-slate-700 w-full sm:w-auto justify-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="form-checkbox h-4 w-4 text-cyan-500 rounded border-slate-600 bg-slate-900 focus:ring-offset-0 focus:ring-1 focus:ring-cyan-500"
              />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Private</span>
            </label>

            <div className={`transition-all duration-300 overflow-hidden ${isPrivate ? 'w-24 opacity-100 ml-2' : 'w-0 opacity-0'}`}>
              <input
                type="text"
                value={createCode}
                onChange={(e) => setCreateCode(e.target.value.slice(0, 4))}
                placeholder="CODE"
                maxLength={4}
                className="w-full bg-black/50 border border-slate-600 text-white text-center text-xs px-2 py-1 outline-none focus:border-cyan-500 font-mono tracking-widest placeholder-slate-700"
              />
            </div>
          </div>

          <button
            onClick={createRoom}
            className={`w-full sm:w-auto px-6 py-3 border font-bold tracking-wider transition-all uppercase text-sm clip-corner ${isPrivate && createCode.length !== 4
              ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-400'
              }`}
            disabled={isPrivate && createCode.length !== 4}
          >
            {isPrivate ? '+ Secure Session' : '+ Public Session'}
          </button>
        </div>
      </header>

      {/* Server Browser */}
      <div className="w-full max-w-6xl relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-300 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_cyan]"></span>
            LIVE SECTORS <span className="text-slate-600 text-sm font-normal">({rooms.length})</span>
          </h2>
          <div className="flex gap-2">
            <span className="h-1 w-20 bg-cyan-500/20"></span>
            <span className="h-1 w-10 bg-cyan-500/20"></span>
          </div>
        </div>

        {rooms.length === 0 ? (
          <div className="text-center py-32 px-4 border border-dashed border-slate-800 bg-slate-900/30 rounded-lg">
            <div className="inline-block p-4 rounded-full bg-slate-800/50 mb-4 text-slate-600">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            </div>
            <p className="text-slate-400 text-lg font-display tracking-wide">NO ACTIVE SECTORS DETECTED</p>
            <p className="text-slate-600 font-mono text-sm mt-2">INITIATE A NEW GAME SESSION TO BEGIN</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map(([id, room]) => (
              <div key={id} className="group bg-[#0f111a] border border-slate-800 hover:border-cyan-500/50 p-0 transition-all duration-300 relative overflow-hidden">
                {/* Status Bar */}
                <div className={`h-1 w-full ${room.status === 'waiting' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>

                <div className="p-6 relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="text-[10px] text-slate-500 font-mono mb-1">SECTOR ID</div>
                      <div className="text-lg font-mono text-slate-300 group-hover:text-cyan-400 transition-colors flex items-center gap-2">
                        #{id.slice(0, 4).toUpperCase()}
                        {room.isPrivate && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest border ${room.status === 'waiting'
                      ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                      : 'border-amber-500/30 text-amber-400 bg-amber-500/10'
                      }`}>
                      {room.status === 'waiting' ? (room.isPrivate ? 'SECURE' : 'OPEN') : 'LOCKED'}
                    </div>
                  </div>

                  <div className="space-y-3 mb-8">
                    <div className="flex justify-between items-center group/player">
                      <span className="text-xs text-slate-500">PLAYER 1</span>
                      <span className="font-bold text-slate-300 group-hover/player:text-white transition-colors">{room.players[0]?.name}</span>
                    </div>
                    <div className="w-full h-[1px] bg-slate-800"></div>
                    <div className="flex justify-between items-center group/player">
                      <span className="text-xs text-slate-500">PLAYER 2</span>
                      <span className={`font-bold transition-colors ${room.players[1] ? 'text-slate-300' : 'text-slate-600 italic'}`}>
                        {room.players[1]?.name || 'SEARCHING...'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => joinRoom(id, room.isPrivate)}
                    disabled={room.status !== 'waiting'}
                    className={`w-full py-3 font-bold uppercase tracking-wider text-sm transition-all clip-corner ${room.status === 'waiting'
                      ? 'bg-cyan-600/10 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500 hover:text-black hover:border-cyan-500'
                      : 'bg-slate-800/50 border border-slate-700 text-slate-600 cursor-not-allowed'
                      }`}
                  >
                    {room.status === 'waiting' ? (room.isPrivate ? 'ENTER CODE' : 'CONNECT') : 'IN PROGRESS'}
                  </button>
                </div>

                {/* Decorative background elements */}
                <div className="absolute bottom-0 right-0 p-4 opacity-5 pointer-events-none">
                  <svg width="60" height="60" viewBox="0 0 100 100" fill="currentColor" className="text-white">
                    <path d="M0 0 L20 0 L20 100 L0 100 Z" />
                    <path d="M40 0 L60 0 L60 100 L40 100 Z" />
                    <path d="M80 0 L100 0 L100 100 L80 100 Z" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Join Code Modal */}
        {showJoinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0f111a] border border-cyan-500/50 p-8 shadow-[0_0_50px_rgba(6,182,212,0.2)] max-w-sm w-full clip-corner relative">
              <button
                onClick={() => setShowJoinModal(false)}
                className="absolute top-2 right-2 text-slate-500 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>

              <h3 className="text-xl font-bold text-white mb-1 uppercase tracking-wider">Security Check</h3>
              <p className="text-xs text-cyan-500/70 font-mono mb-6">RESTRICTED SECTOR // AUTH REQUIRED</p>

              <form onSubmit={handleJoinPrivate}>
                <div className="mb-6">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => {
                      setJoinCode(e.target.value.slice(0, 4));
                      setJoinError('');
                    }}
                    placeholder="ENTER 4-DIGIT CODE"
                    maxLength={4}
                    className="w-full bg-black/50 border border-slate-700 focus:border-cyan-500 text-white text-center text-2xl tracking-[0.5em] py-4 outline-none font-mono placeholder:text-slate-800"
                    autoFocus
                  />
                  {joinError && <p className="text-red-500 text-xs mt-2 font-mono text-center">{joinError}</p>}
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-cyan-600/20 border border-cyan-500/50 text-cyan-400 font-bold tracking-widest uppercase hover:bg-cyan-500 hover:text-black hover:border-cyan-500 transition-all"
                >
                  ACCESS SECTOR
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Lobby;
