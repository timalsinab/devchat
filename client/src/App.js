import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

function App() {
  const [username, setUsername] = useState('');
  const [room, setRoom] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState('');
  const [joined, setJoined] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (!joined) return;

    socket.on('receive_message', (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on('user_joined', (msg) => {
      setMessages((prev) => [...prev, { user: 'System', text: msg }]);
    });

    socket.on('user_typing', (user) => {
      setTyping(`${user} is typing...`);
      setTimeout(() => setTyping(''), 2000);
    });

    socket.on('user_left', (msg) => {
      setMessages((prev) => [...prev, { user: 'System', text: msg }]);
    });

    return () => {
      socket.off('receive_message');
      socket.off('user_joined');
      socket.off('user_typing');
      socket.off('user_left');
    };
  }, [joined]);

  const joinRoom = () => {
    if (username && room) {
      socket.emit('join_room', { username, room });
      setJoined(true);
    }
  };

  const leaveRoom = () => {
    socket.emit('leave_room', { room, username });
    setMessages([]);
    setMessage('');
    setRoom('');
    setJoined(false);
  };

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit('send_message', { message, room, user: username });
      setMessage('');
    }
  };

  const handleTyping = () => {
    socket.emit('typing', { room, username });
  };

  return (
    <div className={`${dark ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col items-center p-4">
        <div className="flex justify-between w-full max-w-xl mb-4">
          <h1 className="text-3xl font-bold text-blue-700 dark:text-blue-300">DevChat 🚀</h1>
          <button
            className="text-sm px-3 py-1 border rounded border-gray-400 dark:border-gray-300"
            onClick={() => setDark(!dark)}
          >
            {dark ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>

        {!joined ? (
          <div className="mb-4 flex gap-2">
            <input
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800"
              placeholder="Username"
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800"
              placeholder="Room"
              onChange={(e) => setRoom(e.target.value)}
            />
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={joinRoom}
            >
              Join
            </button>
          </div>
        ) : (
          <div className="w-full max-w-xl bg-white dark:bg-gray-800 p-4 rounded shadow">
            <div className="flex gap-2 mb-4">
              <input
                className="flex-grow px-3 py-2 border rounded bg-white dark:bg-gray-700 dark:text-white"
                placeholder="Message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleTyping}
              />
              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={sendMessage}
              >
                Send
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={leaveRoom}
              >
                Exit
              </button>
            </div>

            {typing && <p className="text-sm text-gray-500 dark:text-gray-300 mb-2">{typing}</p>}

            <ul className="space-y-2 max-h-[400px] overflow-y-auto">
              {messages.map((msg, index) => (
                <li
                  key={index}
                  className="bg-gray-200 dark:bg-gray-700 px-3 py-2 rounded"
                >
                  <strong>{msg.user}:</strong> {msg.text}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
