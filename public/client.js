const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');


// массивы врагов и игроков
let playerId = null;
let players = {};
let enemies = [];
const speed = 2;

// пули
let bullets = [];

// обработка от сервера (?)
socket.on('updateEnemies', data => {
  enemies = data;
});


// получение пуль от сервера
socket.on('updateBullets', data => {
  bullets = data;
});


socket.on('init', data => {
  playerId = data.id;
  players = data.players;
});

socket.on('newPlayer', data => {
  players[data.id] = { x: data.x, y: data.y };
});

socket.on('playerMoved', data => {
  if (players[data.id]) {
    players[data.id].x = data.x;
    players[data.id].y = data.y;
  }
});

socket.on('playerDisconnected', id => {
  delete players[id];
});

let keys = {};

document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

function gameLoop() {
  if (!playerId) return requestAnimationFrame(gameLoop);

  const me = players[playerId];
  if (!me) return;

  // Движение
  if (keys['w']) me.y -= speed;
  if (keys['s']) me.y += speed;
  if (keys['a']) me.x -= speed;
  if (keys['d']) me.x += speed;

  socket.emit('move', { x: me.x, y: me.y });

  // Рендер
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let id in players) {
    const p = players[id];
    ctx.fillStyle = id === playerId ? 'blue' : 'red';
    ctx.fillRect(p.x, p.y, 20, 20);
  }

// Враги
enemies.forEach(e => {
  ctx.fillStyle = 'green';
  ctx.beginPath();
  ctx.arc(e.x, e.y, 15, 0, Math.PI * 2);
  ctx.fill();
});

// отрисовка пуль
bullets.forEach(b => {
  ctx.fillStyle = 'yellow';
  ctx.beginPath();
  ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
  ctx.fill();
});


  requestAnimationFrame(gameLoop);
}

// отправка выстрела по клику
canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const targetX = e.clientX - rect.left;
  const targetY = e.clientY - rect.top;

  socket.emit('shoot', { targetX, targetY });
});


gameLoop();
