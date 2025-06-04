const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());

const PORT = process.env.PORT || 5000;

let users = {};

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join_room', ({ username, room }) => {
    socket.join(room);
    users[socket.id] = { username, room };
    socket.to(room).emit('user_joined', `${username} joined the room.`);
  });

  socket.on('send_message', ({ message, room }) => {
    const user = users[socket.id];
    if (user) {
      io.to(room).emit('receive_message', {
        user: user.username,
        text: message,
        time: new Date().toISOString()
      });
    }
  });

  socket.on('typing', ({ room }) => {
    const user = users[socket.id];
    if (user) {
      socket.to(room).emit('user_typing', user.username);
    }
  });

  // Handle a user leaving a room without disconnecting
  socket.on('leave_room', ({ room }) => {
    const user = users[socket.id];
    if (user) {
      socket.leave(room);
      socket.to(room).emit('user_left', `${user.username} left the room.`);
      delete users[socket.id];
    }
  });

  socket.on('disconnect', () => {
    const user = users[socket.id];
    if (user) {
      socket.to(user.room).emit('user_left', `${user.username} left the room.`);
    }
    delete users[socket.id];
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

