const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sanitizeHtml = require('sanitize-html'); // Add this line

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

const users = new Set();

io.on('connection', (socket) => {
  socket.on('userJoined', (userName) => {
    socket.userName = userName;
    users.add(userName);
    io.emit('onlineUsers', Array.from(users));
  });

  socket.on('chatMessage', (data) => {
    data.message = sanitizeHtml(data.message, { allowedTags: [], allowedAttributes: {} }); // Sanitize message
    data.timestamp = Date.now();
    io.emit('message', data);
  });

  socket.on('messageSeen', ({ messageId, viewer }) => {
    io.emit('messageSeen', { messageId, viewer });
  });

  socket.on('typing', (userName) => {
    socket.broadcast.emit('typing', userName);
  });

  socket.on('stopTyping', (userName) => {
    socket.broadcast.emit('stopTyping', userName);
  });

  socket.on('disconnect', () => {
    if (socket.userName) {
      users.delete(socket.userName);
      io.emit('onlineUsers', Array.from(users));
      console.log('User disconnected:', socket.userName);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
