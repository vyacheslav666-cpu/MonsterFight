const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = 3000;
app.use(express.static('public'));

let players = {};

io.on('connection', socket => {
  console.log(`Игрок подключился: ${socket.id}`);
  players[socket.id] = { x: 100, y: 100 };

  socket.emit('init', { id: socket.id, players });
  socket.broadcast.emit('newPlayer', { id: socket.id, x: 100, y: 100 });

  socket.on('move', data => {
    if (players[socket.id]) {
      players[socket.id] = data;
      socket.broadcast.emit('playerMoved', { id: socket.id, ...data });
    }
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    socket.broadcast.emit('playerDisconnected', socket.id);
    console.log(`Игрок отключился: ${socket.id}`);
  });
});

http.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
