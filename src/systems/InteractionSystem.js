export const isNearTarget = (playerPos, playerSize, targetX, targetY, radius = 90) => {
  const playerCenterX = playerPos.x + playerSize / 2;
  const playerCenterY = playerPos.y + playerSize / 2;

  const dx = playerCenterX - targetX;
  const dy = playerCenterY - targetY;

  return Math.sqrt(dx * dx + dy * dy) <= radius;
};

export const getNearbyNpc = ({ playerPos, playerSize, npcs }) => {
  return npcs.find((npc) => isNearTarget(playerPos, playerSize, npc.x, npc.y, 110)) || null;
};

export const getNearbyObject = ({ playerPos, playerSize, objects }) => {
  const found = objects.find((item) => {
    if (!item.interactionNode) return false;

    const targetX = item.x + (item.width || 0) / 2;
    const targetY = item.y + (item.height || 0) / 2;
    return isNearTarget(playerPos, playerSize, targetX, targetY, 110);
  });

  return found ? { ...found, type: 'object' } : null;
};

export const getTouchedExit = ({ playerPos, playerSize, exits }) => {
  const playerRect = {
    x: playerPos.x,
    y: playerPos.y,
    width: playerSize,
    height: playerSize,
  };

  return (
    exits.find((exit) => {
      return (
        playerRect.x < exit.x + exit.width &&
        playerRect.x + playerRect.width > exit.x &&
        playerRect.y < exit.y + exit.height &&
        playerRect.y + playerRect.height > exit.y
      );
    }) || null
  );
};