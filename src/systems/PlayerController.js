// Constrains a value between min and max
export const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

// Converts WASD key state into a dx/dy velocity vector; normalizes diagonals to keep consistent speed
export const getMovementVector = (keysPressed, speed) => {
  let dx = 0;
  let dy = 0;

  if (keysPressed.w) dy -= speed;
  if (keysPressed.s) dy += speed;
  if (keysPressed.a) dx -= speed;
  if (keysPressed.d) dx += speed;

  if (dx !== 0 && dy !== 0) {
    const normalized = speed / Math.sqrt(2);
    dx = dx > 0 ? normalized : -normalized;
    dy = dy > 0 ? normalized : -normalized;
  }

  return { dx, dy };
};

// Returns 'left'|'right'|'up'|'down' from a movement vector; holds the previous direction when idle
export const getFacingFromVector = (dx, dy, previousFacing = 'down') => {
  if (dx === 0 && dy === 0) return previousFacing;

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left';
  }

  return dy > 0 ? 'down' : 'up';
};