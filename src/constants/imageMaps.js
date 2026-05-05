export const NPC_PORTRAIT_MAP = {
  fox: require('../assets/images/fox.png'),
  wolf: require('../assets/images/wolf.png'),
  hare: require('../assets/images/hare.png'),
  dude_image: require('../assets/sprites/Dude_Monster/Dude_Monster.png'),
  pink_image: require('../assets/sprites/Pink_Monster/Pink_Monster.png'),
  owlet_image: require('../assets/sprites/Owlet_Monster/Owlet_Monster.png'),
};

export const OBJECT_IMAGE_MAP = {
  'fox.png': require('../assets/images/fox.png'),
  'hare.png': require('../assets/images/hare.png'),
  'wolf.png': require('../assets/images/wolf.png'),
  'Building 05.png': require('../assets/images/Building 05.png'),
  'Building 06.png': require('../assets/images/Building 06.png'),
  'Building 07.png': require('../assets/images/Building 07.png'),
};

// Add ship_burn entry here once src/assets/sprites/Ship/ship_burn.png is saved:
// ship_burn: { source: require('../assets/sprites/Ship/ship_burn.png'), totalFrames: 18, firstFrame: 2, lastFrame: 6, speedMs: 250 }
export const ANIMATED_OBJECT_MAP = {
  ship_burn: { source: require('../assets/sprites/Ship/ship_burn.png'), totalFrames: 18, firstFrame: 2, lastFrame: 6, speedMs: 250 },
};
