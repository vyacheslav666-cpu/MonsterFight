class Player {
  constructor(id) {
    this.id = id;
    this.x = 100;
    this.y = 100;
    this.alive = true;
  }

  move(newX, newY) {
    this.x = newX;
    this.y = newY;
  }

  respawn() {
    this.x = Math.random() * 800;
    this.y = Math.random() * 600;
  }

  getData() {
    return {
      id: this.id,
      x: this.x,
      y: this.y
    };
  }
}

module.exports = Player;
