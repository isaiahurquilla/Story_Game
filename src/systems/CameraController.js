import { clamp } from './PlayerController';

export const getCameraPosition = ({
  playerPos,
  playerSize,
  viewportWidth,
  viewportHeight,
  worldWidth,
  worldHeight,
}) => {
  const x = clamp(
    playerPos.x - viewportWidth / 2 + playerSize / 2,
    0,
    worldWidth - viewportWidth
  );

  const y = clamp(
    playerPos.y - viewportHeight * 0.65,
    0,
    worldHeight - viewportHeight
  );

  return { x, y };
};