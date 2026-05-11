// Player character (Dude_Monster) sprite sheets keyed by action state
export const PLAYER_ANIMATION_SET = {
  idle: require('../assets/sprites/Dude_Monster/Dude_Monster_Idle_4.png'),
  walk: require('../assets/sprites/Dude_Monster/Dude_Monster_Walk_6.png'),
  run: require('../assets/sprites/Dude_Monster/Dude_Monster_Run_6.png'),
  attack: require('../assets/sprites/Dude_Monster/Dude_Monster_Attack1_4.png'),
  frameWidth: 32,
  frameHeight: 32,
  frameCounts: {
    idle: 4,
    walk: 6,
    run: 6,
    attack: 4,
  },
};

// Pink Monster companion sprite sheets
export const SIDEKICK_ANIMATION_SET = {
  idle: require('../assets/sprites/Pink_Monster/Pink_Monster_Idle_4.png'),
  walk: require('../assets/sprites/Pink_Monster/Pink_Monster_Walk_6.png'),
  run: require('../assets/sprites/Pink_Monster/Pink_Monster_Run_6.png'),
  frameWidth: 32,
  frameHeight: 32,
  frameCounts: {
    idle: 4,
    walk: 6,
    run: 6,
  },
};

// Owlet Monster NPC sprite sheets
export const OWLET_ANIMATION_SET = {
  idle: require('../assets/sprites/Owlet_Monster/Owlet_Monster_Idle_4.png'),
  walk: require('../assets/sprites/Owlet_Monster/Owlet_Monster_Walk_6.png'),
  run: require('../assets/sprites/Owlet_Monster/Owlet_Monster_Run_6.png'),
  frameWidth: 32,
  frameHeight: 32,
  frameCounts: {
    idle: 4,
    walk: 6,
    run: 6,
  },
};

// Maps NPC id → animation set; used by WorldScene to drive each NPC's PlayerSprite
export const NPC_ANIMATION_MAP = {
  pink: SIDEKICK_ANIMATION_SET,
  owlet: OWLET_ANIMATION_SET,
};
