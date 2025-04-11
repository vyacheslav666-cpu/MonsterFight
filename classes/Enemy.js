class Enemy {
  constructor(x, y) {
    this.id = Date.now() + Math.random();
    this.x = x;
    this.y = y;
  }

  moveToward(target, speed = 1) {
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0) {
      this.x += (dx / dist) * speed;
      this.y += (dy / dist) * speed;
    }
  }

  distanceTo(obj) {
    const dx = obj.x - this.x;
    const dy = obj.y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

module.exports = Enemy;

