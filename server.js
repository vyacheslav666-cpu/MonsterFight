const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = 3000;
app.use(express.static('public'));

// массивы игроков и врагов


let enemies = [];
const ENEMY_SPEED = 1;

let players = {};


// пули
let bullets = [];
const BULLET_SPEED = 10;


// спавн врагов
function spawnEnemy() {
  const x = Math.random() * 800;
  const y = Math.random() * 600;
  enemies.push({ id: Date.now(), x, y });
}


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

// обработка пуль
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
      const dx = p.x - enemy.x;
      const dy = p.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < minDist) {
        minDist = dist;
        closestPlayer = p;
      }
    }

    if (closestPlayer) {
      const dx = closestPlayer.x - enemy.x;
      const dy = closestPlayer.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0) {
        enemy.x += (dx / dist) * ENEMY_SPEED;
        enemy.y += (dy / dist) * ENEMY_SPEED;
      }
    }
  });

// Обновление пуль
bullets.forEach(bullet => {
  bullet.x += bullet.vx;
  bullet.y += bullet.vy;
});

// Удаление старых пуль (вышли за границы)
bullets = bullets.filter(b =>
  b.x >= 0 && b.x <= 800 && b.y >= 0 && b.y <= 600
);


// Проверка попаданий пуль по врагам
bullets.forEach(bullet => {
  enemies.forEach((enemy, index) => {
    const dx = bullet.x - enemy.x;
    const dy = bullet.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 15) {
      // Убрать врага и пулю
      enemies.splice(index, 1);
      bullet.hit = true;
    }
  });
});

// Удаляем пули, которые попали
bullets = bullets.filter(b => !b.hit);


// Проверка столкновений врагов с игроками
for (let id in players) {
  const player = players[id];

   enemies.forEach(enemy => {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 20) {
      // Телепортируем игрока
      player.x = Math.random() * 800;
      player.y = Math.random() * 600;

      // Отправим новое положение игрока
      io.emit('playerMoved', { id, x: player.x, y: player.y });
    }
  });
}

// Отправка клиентам
io.emit('updateBullets', bullets);


  // Каждую секунду спавним врага
  if (Math.random() < 0.02) spawnEnemy();

  io.emit('updateEnemies', enemies);
}, 1000 / 30); // 30 FPS


http.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
