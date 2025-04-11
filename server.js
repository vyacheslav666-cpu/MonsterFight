const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const Player = require('./classes/Player');
const Enemy = require('./classes/Enemy');

const PORT = 3000;
app.use(express.static('public'));

const players = {};
const enemies = [];
let bullets = []; // ← раньше здесь было const
const ENEMY_SPEED = 1;
const BULLET_SPEED = 10;

// Спавн врага
function spawnEnemy() {
  const x = Math.random() * 800;
  const y = Math.random() * 600;
  enemies.push(new Enemy(x, y));
}

io.on('connection', socket => {
  console.log(`Игрок подключился: ${socket.id}`);
  players[socket.id] = new Player(socket.id);

  const snapshot = {};
  for (let id in players) {
    snapshot[id] = players[id].getData();
  }

  socket.emit('init', { id: socket.id, players: snapshot });
  socket.broadcast.emit('newPlayer', players[socket.id].getData());

  socket.on('move', data => {
    if (players[socket.id]) {
      players[socket.id].move(data.x, data.y);
      socket.broadcast.emit('playerMoved', { id: socket.id, x: data.x, y: data.y });
    }
  });

  socket.on('shoot', ({ targetX, targetY }) => {
    const shooter = players[socket.id];
    if (!shooter) return;

    const dx = targetX - shooter.x;
    const dy = targetY - shooter.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const vx = (dx / dist) * BULLET_SPEED;
    const vy = (dy / dist) * BULLET_SPEED;

    bullets.push({
      id: Date.now() + Math.random(),
      x: shooter.x,
      y: shooter.y,
      vx,
      vy,
      ownerId: socket.id,
    });
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    socket.broadcast.emit('playerDisconnected', socket.id);
    console.log(`Игрок отключился: ${socket.id}`);
  });
});

setInterval(() => {
  // Двигаем врагов к ближайшему игроку
  enemies.forEach(enemy => {
    let closestPlayer = null;
    let minDist = Infinity;

    for (let id in players) {
      const p = players[id];
      const dist = enemy.distanceTo(p);
      if (dist < minDist) {
        minDist = dist;
        closestPlayer = p;
      }
    }

    if (closestPlayer) {
      enemy.moveToward(closestPlayer, ENEMY_SPEED);

      if (closestPlayer && enemy.distanceTo(closestPlayer) < 20) {
  closestPlayer.respawn();

  io.to(closestPlayer.id).emit('playerMoved', {
    id: closestPlayer.id,
    x: closestPlayer.x,
    y: closestPlayer.y
  });

  io.emit('playerMoved', {
    id: closestPlayer.id,
    x: closestPlayer.x,
    y: closestPlayer.y
  });
}

    }
  });

  // Обновление пуль
  bullets.forEach(b => {
    b.x += b.vx;
    b.y += b.vy;
  });

  bullets = bullets.filter(b =>
    b.x >= 0 && b.x <= 800 &&
    b.y >= 0 && b.y <= 600 &&
    !b.hit
  );

  // Проверка попаданий по врагам
  bullets.forEach(bullet => {
    enemies.forEach((enemy, i) => {
      if (enemy.distanceTo(bullet) < 15) {
        enemies.splice(i, 1);
        bullet.hit = true;
      }
    });
  });

  if (Math.random() < 0.02) spawnEnemy();

  io.emit('updateEnemies', enemies);
  io.emit('updateBullets', bullets);
}, 1000 / 30);

http.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
