import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

const Chat = ({ roomId, playerName }) => {
  const socket = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('chat_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off('chat_message');
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && socket) {
      const messageData = {
        roomId,
        sender: playerName,
        text: newMessage.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      // Optimistically add message
      setMessages((prev) => [...prev, messageData]);
      socket.emit('send_message', messageData);
      setNewMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-transparent overflow-hidden">
      <div className="p-4 bg-white/5 font-bold text-xs tracking-widest text-slate-300 flex items-center justify-between border-b border-white/5">
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          COMMS_CHANNEL
        </span>
        <span className="text-[10px] text-slate-600 font-mono">ENCRYPTED</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-slate-600 text-xs mb-2 tracking-widest">NO SIGNAL</div>
              <div className="text-[10px] text-slate-700 font-mono">START TRANSMISSION...</div>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.sender === playerName ? 'items-end' : 'items-start'} max-w-full animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className="mb-1 flex items-center gap-2">
                <span className={`text-[10px] font-bold tracking-wider ${msg.sender === playerName ? 'text-cyan-500' : 'text-rose-500'}`}>
                  {msg.sender === playerName ? 'YOU' : msg.sender.toUpperCase()}
                </span>
                <span className="text-[9px] text-slate-600 font-mono">{msg.time}</span>
              </div>

              <div className={`max-w-[90%] px-3 py-2 text-sm break-words relative group ${msg.sender === playerName
                  ? 'bg-cyan-900/20 border border-cyan-500/30 text-cyan-100 rounded-bl-lg rounded-tl-lg rounded-br-none border-r-2 border-r-cyan-500'
                  : 'bg-rose-900/10 border border-rose-500/20 text-slate-200 rounded-br-lg rounded-tr-lg rounded-bl-none border-l-2 border-l-rose-500'
                }`}>
                {msg.text}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-3 border-t border-slate-800 bg-[#0a0a0f]">
        <div className="flex gap-0 relative group">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="TRANSMIT MESSAGE..."
            className="flex-1 bg-slate-900/50 border border-slate-700 px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:bg-slate-900 transition-all font-mono placeholder-slate-600"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-4 bg-cyan-900/20 border-t border-b border-r border-slate-700 text-cyan-500 hover:bg-cyan-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
