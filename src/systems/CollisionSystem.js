export const rectsOverlap = (a, b) => {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
};

export const applyCollision = ({
  nextPos,
  playerSize,
  colliders,
  worldWidth,
  worldHeight,
}) => {
  const bounded = {
    x: Math.max(0, Math.min(nextPos.x, worldWidth - playerSize)),
    y: Math.max(0, Math.min(nextPos.y, worldHeight - playerSize)),
  };

  const playerRect = {
    x: bounded.x,
    y: bounded.y,
    width: playerSize,
    height: playerSize,
  };

  const hitsCollider = colliders.some((collider) =>
    rectsOverlap(playerRect, collider)
  );

  if (hitsCollider) return null;

  return bounded;
};