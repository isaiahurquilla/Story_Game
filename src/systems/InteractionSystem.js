// Euclidean distance check — true if the player's center is within radius pixels of a target point
export const isNearTarget = (playerPos, playerSize, targetX, targetY, radius = 90) => {
  const playerCenterX = playerPos.x + playerSize / 2;
  const playerCenterY = playerPos.y + playerSize / 2;

  const dx = playerCenterX - targetX;
  const dy = playerCenterY - targetY;

  return Math.sqrt(dx * dx + dy * dy) <= radius;
};

// Returns the first NPC within 110px of the player
export const getNearbyNpc = ({ playerPos, playerSize, npcs }) => {
  return npcs.find((npc) => isNearTarget(playerPos, playerSize, npc.x, npc.y, 110)) || null;
};

// Returns the first interactable object (has interactionNode or is a crate) within 110px
export const getNearbyObject = ({ playerPos, playerSize, objects }) => {
  const found = objects.find((item) => {
    if (!item.interactionNode && item.type !== 'crate') return false;

    const targetX = item.x + (item.width || 0) / 2;
    const targetY = item.y + (item.height || 0) / 2;
    return isNearTarget(playerPos, playerSize, targetX, targetY, 110);
  });

  return found ? { ...found, type: found.type || 'object' } : null;
};

// Returns the first exit zone whose rect overlaps the player rect, triggering a scene change
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