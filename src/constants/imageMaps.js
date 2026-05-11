// Portrait images shown inside DialogBox for each character id
export const NPC_PORTRAIT_MAP = {
  fox: require('../assets/images/fox.png'),
  wolf: require('../assets/images/wolf.png'),
  hare: require('../assets/images/hare.png'),
  dude_image: require('../assets/sprites/Dude_Monster/Dude_Monster.png'),
  pink_image: require('../assets/sprites/Pink_Monster/Pink_Monster.png'),
  owlet_image: require('../assets/sprites/Owlet_Monster/Owlet_Monster.png'),
  mechanic_image: require('../assets/sprites/Mechanic/PNG Sequences/Idle/Wraith_02_Idle_001.png'),
  Mechanic: require('../assets/sprites/Mechanic/PNG Sequences/Idle/Wraith_02_Idle_001.png'),
  wraith_01_image: require('../assets/sprites/Wraith_01/PNG Sequences/Idle/Wraith_01_Idle_001.png'),
  wraith_01: require('../assets/sprites/Wraith_01/PNG Sequences/Idle/Wraith_01_Idle_001.png'),
  wraith_03_image: require('../assets/sprites/Wraith_03/PNG Sequences/Idle/Wraith_03_Idle_001.png'),
  wraith_03: require('../assets/sprites/Wraith_03/PNG Sequences/Idle/Wraith_03_Idle_001.png'),
};

// Static images used by world objects and colliders that declare an image filename key
export const OBJECT_IMAGE_MAP = {
  'fox.png': require('../assets/images/fox.png'),
  'hare.png': require('../assets/images/hare.png'),
  'wolf.png': require('../assets/images/wolf.png'),
  'Building 05.png': require('../assets/images/Building 05.png'),
  'Building 06.png': require('../assets/images/Building 06.png'),
  'Building 07.png': require('../assets/images/Building 07.png'),
  'KeyPurple.png': require('../assets/sprites/Gear/KeyPurple.png'),
  'purple_gear_sheet.png': require('../assets/sprites/Gear/purple_gear_sheet.png'),
  'cat.gif': require('../assets/images/cat.gif'),
};

// Individual PNG frames for the Mechanic's casting animation; fed to FrameSequenceSprite
// Add ship_burn entry here once src/assets/sprites/Ship/ship_burn.png is saved:
// ship_burn: { source: require('../assets/sprites/Ship/ship_burn.png'), totalFrames: 18, firstFrame: 2, lastFrame: 6, speedMs: 250 }
export const MECHANIC_CAST_FRAMES = [
  require('../assets/sprites/Mechanic/PNG Sequences/Casting Spells/Wraith_02_Casting Spells_000.png'),
  require('../assets/sprites/Mechanic/PNG Sequences/Casting Spells/Wraith_02_Casting Spells_001.png'),
  require('../assets/sprites/Mechanic/PNG Sequences/Casting Spells/Wraith_02_Casting Spells_002.png'),
  require('../assets/sprites/Mechanic/PNG Sequences/Casting Spells/Wraith_02_Casting Spells_003.png'),
  require('../assets/sprites/Mechanic/PNG Sequences/Casting Spells/Wraith_02_Casting Spells_004.png'),
  require('../assets/sprites/Mechanic/PNG Sequences/Casting Spells/Wraith_02_Casting Spells_005.png'),
  require('../assets/sprites/Mechanic/PNG Sequences/Casting Spells/Wraith_02_Casting Spells_006.png'),
  require('../assets/sprites/Mechanic/PNG Sequences/Casting Spells/Wraith_02_Casting Spells_007.png'),
  require('../assets/sprites/Mechanic/PNG Sequences/Casting Spells/Wraith_02_Casting Spells_008.png'),
  require('../assets/sprites/Mechanic/PNG Sequences/Casting Spells/Wraith_02_Casting Spells_009.png'),
  require('../assets/sprites/Mechanic/PNG Sequences/Casting Spells/Wraith_02_Casting Spells_010.png'),
  require('../assets/sprites/Mechanic/PNG Sequences/Casting Spells/Wraith_02_Casting Spells_011.png'),
  require('../assets/sprites/Mechanic/PNG Sequences/Casting Spells/Wraith_02_Casting Spells_012.png'),
  require('../assets/sprites/Mechanic/PNG Sequences/Casting Spells/Wraith_02_Casting Spells_013.png'),
  require('../assets/sprites/Mechanic/PNG Sequences/Casting Spells/Wraith_02_Casting Spells_014.png'),
  require('../assets/sprites/Mechanic/PNG Sequences/Casting Spells/Wraith_02_Casting Spells_015.png'),
  require('../assets/sprites/Mechanic/PNG Sequences/Casting Spells/Wraith_02_Casting Spells_016.png'),
  require('../assets/sprites/Mechanic/PNG Sequences/Casting Spells/Wraith_02_Casting Spells_017.png'),
];

export const SPELLS_EFFECT = require('../assets/sprites/Mechanic/Vector Parts/Spells Effect.png');

// Sprite-sheet animations for world objects; each entry is consumed by AnimatedSprite
export const ANIMATED_OBJECT_MAP = {
  ship_burn: { source: require('../assets/sprites/Ship/ship_burn.png'), totalFrames: 18, firstFrame: 2, lastFrame: 6, speedMs: 250 },
  ship_repaired: { source: require('../assets/sprites/Ship/ship_burn.png'), totalFrames: 18, firstFrame: 0, lastFrame: 0, speedMs: 250 },
  coin: {
    source: require('../assets/sprites/Gear/Coin.png'),
    totalFrames: 4,
    speedMs: 120,
  },
  chest_closed: {
    source: require('../assets/sprites/Gear/Chests.png'),
    totalFrames: 2,
    rowCount: 1,
    row: 0,
    firstFrame: 0,
    lastFrame: 0,
    speedMs: 200,
  },
  chest_open: {
    source: require('../assets/sprites/Gear/Chests.png'),
    totalFrames: 2,
    rowCount: 1,
    row: 0,
    firstFrame: 1,
    lastFrame: 1,
    speedMs: 200,
  },
  crate_intact: {
    source: require('../assets/sprites/Gear/DestroyableObjects.png'),
    totalFrames: 7,
    rowCount: 13,
    row: 2,
    firstFrame: 0,
    lastFrame: 2,
    speedMs: 400,
  },
  crate_explode: {
    source: require('../assets/sprites/Gear/DestroyableObjects.png'),
    totalFrames: 7,
    rowCount: 13,
    row: 3,
    firstFrame: 3,
    lastFrame: 6,
    speedMs: 100,
  },
};
