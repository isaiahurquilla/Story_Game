import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Animated,
  Platform,
  Image,
  Alert,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import DialogBox from '../components/DialogBox';
import PlayerChoice from '../components/PlayerChoice';
import PlayerSprite from '../components/PlayerSprite';
import InteractPrompt from '../components/InteractPrompt';
import {
  loadGameForProfile,
  saveGameForProfile,
  addCurrency,
  spendCurrency,
  getProfileById,
} from '../services/profileService';
import characters from '../assets/characters.json';
import storyMap from '../constants/storyMap';
import scene1World from '../worldData/scene1World.json';
import scene2World from '../worldData/scene2World.json';
import scene4World from '../worldData/scene4World.json';
import scene6World from '../worldData/scene6World.json';
import scene8World from '../worldData/scene8World.json';
import { getMovementVector, getFacingFromVector } from '../systems/PlayerController';
import { getCameraPosition } from '../systems/CameraController';
import { applyCollision } from '../systems/CollisionSystem';
import { getNearbyNpc, getNearbyObject, getTouchedExit, isNearTarget } from '../systems/InteractionSystem';
import { SCENE_BACKGROUND_MAP } from '../constants/backgroundConfigs';
import { PLAYER_ANIMATION_SET, SIDEKICK_ANIMATION_SET, OWLET_ANIMATION_SET, NPC_ANIMATION_MAP } from '../constants/animationSets';
import { NPC_PORTRAIT_MAP, OBJECT_IMAGE_MAP, ANIMATED_OBJECT_MAP, MECHANIC_CAST_FRAMES, SPELLS_EFFECT } from '../constants/imageMaps';
import AnimatedSprite from '../components/AnimatedSprite';
import FrameSequenceSprite from '../components/FrameSequenceSprite';

// --- Game constants ---
const PLAYER_SIZE = 64;
const MOVE_SPEED = 4;
const LEADER_SPEED = 2.4;
const SAVE_DEBOUNCE_MS = 350;

// Maps scene id → world layout JSON (multiple VN scenes share scene1World as a placeholder)
const worldMap = {
  scene1: scene1World,
  scene2: scene2World,
  scene3: scene1World,
  scene4: scene4World,
  scene5: scene1World,
  scene6: scene6World,
  scene7: scene1World,
  scene8: scene8World,
};

// Per-scene UI config: layout type ('vn' or 'gameplay'), start dialogue node, leader NPC, and color palette
const sceneConfigMap = {
  scene1: {
    layout: 'vn',
    startNode: 'flashIntro',
    topLabel: 'SCENE 1',
    title: 'Did it work?',
    subtitle: 'A portrait-heavy opening scene with choices, a flash, and a long shake.',
    hint: 'Tap the dialogue box to advance.',
    palette: {
      background: '#120c1e',
      panel: '#1d1230',
      accent: '#d3b7ff',
      accentSoft: 'rgba(152, 105, 255, 0.18)',
      cardBorder: 'rgba(216, 196, 255, 0.42)',
      overlayOne: 'rgba(255, 122, 89, 0.18)',
      overlayTwo: 'rgba(119, 77, 255, 0.22)',
    },
  },
  scene2: {
    layout: 'gameplay',
    startNode: null,
    leaderNpcId: 'pink',
    leaderGoalId: 'middlePoint',
    arrivalNode: null,
    topLabel: 'SCENE 2',
    title: 'Run',
    hint: 'Use W A S D to follow. Press E or tap Talk near the side character.',
    palette: {
      background: '#08131b',
      panel: 'rgba(10, 16, 24, 0.76)',
      accent: '#bfefff',
      accentSoft: 'rgba(99, 214, 255, 0.18)',
      cardBorder: 'rgba(176, 233, 255, 0.34)',
      overlayOne: 'rgba(72, 161, 120, 0.18)',
      overlayTwo: 'rgba(58, 94, 176, 0.16)',
    },
  },
  scene3: {
    layout: 'vn',
    startNode: 'start', 
    topLabel: 'SCENE 3',
    title: 'blank title',
    subtitle: 'blank subtitle',
    hint: '',
    palette: {
      background: '#120c1e',
      panel: '#1d1230',
      accent: '#d3b7ff',
      accentSoft: 'rgba(152, 105, 255, 0.18)',
      cardBorder: 'rgba(216, 196, 255, 0.42)',
      overlayOne: 'rgba(255, 122, 89, 0.18)',
      overlayTwo: 'rgba(119, 77, 255, 0.22)',
    },
  },
  scene4: {
    layout: 'gameplay',
    startNode: null,
    topLabel: 'SCENE 4',
    title: 'The Clearing',
    subtitle: 'Explore the mysterious clearing and uncover its secrets.',
    hint: 'Find a way to meet the mechanic.',
    palette: {
      background: '#0a1a0f',
      panel: 'rgba(15, 25, 20, 0.76)',
      accent: '#90ff90',
      accentSoft: 'rgba(144, 255, 144, 0.18)',
      cardBorder: 'rgba(176, 255, 176, 0.34)',
      overlayOne: 'rgba(72, 161, 120, 0.18)',
      overlayTwo: 'rgba(58, 176, 94, 0.16)',
    },
  },
   scene5: {
    layout: 'vn',
    startNode: 'start',
    topLabel: 'SCENE 5',
    title: 'Inside',
    subtitle: '',
    hint: '',
    palette: {
      background: '#120c1e',
      panel: '#1d1230',
      accent: '#d3b7ff',
      accentSoft: 'rgba(152, 105, 255, 0.18)',
      cardBorder: 'rgba(216, 196, 255, 0.42)',
      overlayOne: 'rgba(255, 122, 89, 0.18)',
      overlayTwo: 'rgba(119, 77, 255, 0.22)',
    },
  },
  scene6: {
    layout: 'gameplay',
    startNode: null,
    topLabel: 'SCENE 6',
    title: 'CryptTown',
    subtitle: '',
    hint: 'Press E to interact with objects and NPCs',
    palette: {
      background: '#08131b',
      panel: 'rgba(10, 16, 24, 0.76)',
      accent: '#bfefff',
      accentSoft: 'rgba(99, 214, 255, 0.18)',
      cardBorder: 'rgba(176, 233, 255, 0.34)',
      overlayOne: 'rgba(72, 161, 120, 0.18)',
      overlayTwo: 'rgba(58, 94, 176, 0.16)',
    },
  },
  scene7: {
    layout: 'vn',
    startNode: 'start',
    topLabel: 'SCENE 7',
    title: 'blank title',
    subtitle: 'blank subtitle',
    hint: '',
    palette: {
      background: '#120c1e',
      panel: '#1d1230',
      accent: '#d3b7ff',
      accentSoft: 'rgba(152, 105, 255, 0.18)',
      cardBorder: 'rgba(216, 196, 255, 0.42)',
      overlayOne: 'rgba(255, 122, 89, 0.18)',
      overlayTwo: 'rgba(119, 77, 255, 0.22)',
    },
  },
  scene8: {
    layout: 'gameplay',
    startNode: null,
    leaderNpcId: 'pink',
    leaderGoalId: 'shipGoal',
    arrivalNode: null,
    topLabel: 'SCENE 8',
    title: 'Back to the Ship',
    hint: '',
    palette: {
      background: '#0a1a0f',
      panel: 'rgba(15, 25, 20, 0.76)',
      accent: '#90ff90',
      accentSoft: 'rgba(144, 255, 144, 0.18)',
      cardBorder: 'rgba(176, 255, 176, 0.34)',
      overlayOne: 'rgba(72, 161, 120, 0.18)',
      overlayTwo: 'rgba(58, 176, 94, 0.16)',
    },
  },
}

// Leader NPCs start active only in scenes that open with them already moving (scene2, scene8)
const createDefaultLeaderState = (sceneId) => ({
  active: sceneId === 'scene2' || sceneId === 'scene8',
  finished: false,
});

const WorldScene = ({ sceneId, profileId, mode, onGoToMenu, onChangeScene }) => {
  const normalizedSceneId = sceneId?.toLowerCase();
  const storyData = storyMap[normalizedSceneId];
  const worldData = worldMap[normalizedSceneId];
  const sceneConfig = sceneConfigMap[normalizedSceneId] || sceneConfigMap.scene2;
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // --- Scene state ---
  const [ready, setReady] = useState(false);
  const [currentNode, setCurrentNode] = useState(null);
  const [history, setHistory] = useState([]);
  const [claimedRewards, setClaimedRewards] = useState([]);
  const [playerPos, setPlayerPos] = useState(worldData?.spawn || { x: 100, y: 100 });
  const [npcPositions, setNpcPositions] = useState(worldData?.npcs || []);
  const [openedChests, setOpenedChests] = useState([]);
  const [leaderState, setLeaderState] = useState(createDefaultLeaderState(normalizedSceneId));
  const [leaderGoalId, setLeaderGoalId] = useState(sceneConfig.leaderGoalId);
  const [cameraPos, setCameraPos] = useState({ x: 0, y: 0 });
  const [facing, setFacing] = useState('down');
  const [flashVisible, setFlashVisible] = useState(false);
  const [interactionTarget, setInteractionTarget] = useState(null);
  const [profileName, setProfileName] = useState('Player');
  const [currentCurrency, setCurrentCurrency] = useState(0);

  const [playerState, setPlayerState] = useState('idle');
  const [explodingCrates, setExplodingCrates] = useState([]);
  const [spawnedGear, setSpawnedGear] = useState(null);
  const [catGif, setCatGif] = useState(null);
  const [mechanicCasting, setMechanicCasting] = useState(false);
  const [spellVisible, setSpellVisible] = useState(false);
  const [shipRepaired, setShipRepaired] = useState(false);
  const [boardingShip, setBoardingShip] = useState(false);
  const [hiddenPlayer, setHiddenPlayer] = useState(false);
  const [hiddenPink, setHiddenPink] = useState(false);
  const boardingFrameRef = useRef(null);
  const [gameEnded, setGameEnded] = useState(false);
  const shipFlyAnim = useRef(new Animated.Value(0)).current;

  // --- Refs for animation frames, timers, and WASD key state (not React state to avoid re-renders) ---
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const throwAnim = useRef(new Animated.Value(0)).current;
  const [isThrowingKey, setIsThrowingKey] = useState(false);
  const attackTimeoutRef = useRef(null);
  const crateExplodeTimeoutRef = useRef(null);
  const mechanicCastTimeoutRef = useRef(null);
  const keyThrowTargetRef = useRef({ x: 0, y: 0 });
  const autoAdvanceTimeout = useRef(null);
  const animationFrameRef = useRef(null);
  const leaderFrameRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const flashTimeoutRef = useRef(null);
  const shakeTimeoutRef = useRef(null);
  const shakeLoopRef = useRef(null);
  const keysPressed = useRef({ w: false, a: false, s: false, d: false });
  const facingRef = useRef('down');

  // --- Derived values ---
  const worldWidth = worldData?.world?.width || 1400;
  const worldHeight = worldData?.world?.height || 900;

  const viewportWidth = sceneConfig.layout === 'vn' ? Math.min(screenWidth - 28, 760) : screenWidth;
  const viewportHeight = sceneConfig.layout === 'vn' ? Math.min(screenHeight * 0.34, 320) : screenHeight;

  const activeNode = currentNode ? storyData?.[currentNode] : null;
  const canMove = ready && sceneConfig.layout !== 'vn' && !currentNode && playerState === 'idle';

  const isPlayerMoving =
    canMove &&
    (keysPressed.current.w ||
      keysPressed.current.a ||
      keysPressed.current.s ||
      keysPressed.current.d);

const dialogueCharacters = useMemo(
  () => ({
    ...characters,
    player: {
      ...characters.player,
      name: profileName || characters.player.name,
    },
    system: {
      name: ' ',
      portrait: null,
    },
  }),
  [profileName]
);

  const activeSpeakerId = activeNode?.character || null;
  const speakerPortrait = activeSpeakerId ? NPC_PORTRAIT_MAP[activeSpeakerId] || null : null;

  const npcViews = useMemo(() => {
    return npcPositions.map((npc) => ({
      ...npc,
      animationSet: NPC_ANIMATION_MAP[npc.id] || null,
      portraitSource: NPC_PORTRAIT_MAP[npc.id] || null,
    }));
  }, [npcPositions]);

  // Called on E/Enter or the on-screen button — starts a crate smash, key-throw, or dialogue based on what's nearby
  const beginNpcInteraction = useCallback(() => {
    if (!interactionTarget || currentNode || playerState === 'attack') return;

    if (interactionTarget.type === 'crate') {
      if (openedChests.includes(interactionTarget.id) || claimedRewards.includes(interactionTarget.id)) return;
      const { id: crateId, x: crateX, y: crateY } = interactionTarget;
      setPlayerState('attack');
      attackTimeoutRef.current = setTimeout(() => {
        setPlayerState('idle');
        setOpenedChests((prev) => [...prev, crateId]);
        crateExplodeTimeoutRef.current = setTimeout(() => {
          setClaimedRewards((prev) => [...prev, crateId]);
          if (crateId === 'crate_5') {
            const GIF_SIZE = PLAYER_SIZE * 3;
            setCatGif({
              x: crateX + 64 - GIF_SIZE / 2,
              y: crateY - GIF_SIZE - 16,
            });
            setCurrentNode('foundCat');
          } else {
            setSpawnedGear({ x: crateX, y: crateY });
            setCurrentNode('foundGear');
          }
        }, 4 * 100 + 150);
      }, 4 * 140 + 50);
      return;
    }

    if (
      interactionTarget.requiredItem &&
      interactionTarget.keyInteractionNode &&
      claimedRewards.includes(interactionTarget.requiredItem)
    ) {
      keyThrowTargetRef.current = {
        x: interactionTarget.x + (interactionTarget.width || 0) / 2,
        y: interactionTarget.y + (interactionTarget.height || 0) / 2,
      };
      setCurrentNode(interactionTarget.keyInteractionNode);
      return;
    }

    setCurrentNode(interactionTarget.interactionNode || 'start');
  }, [interactionTarget, currentNode, playerState, claimedRewards, openedChests]);

  // One-time setup: load profile + saved game state, then initialize all scene state
  useEffect(() => {
    const setup = async () => {
  if (!storyData || !worldData) {
    setReady(true);
    return;
  }

  const defaultSpawn = worldData.spawn || { x: 100, y: 100 };
  const defaultNpcs = worldData.npcs || [];

  let nextProfileName = 'Player';
  let nextCurrency = 0; // ⚙️ 1. Initialize a temporary variable

  if (profileId) {
    const profile = await getProfileById(profileId);
    nextProfileName = profile?.name?.trim() || 'Player';
    nextCurrency = profile?.currency || 0; // ⚙️ 2. Pull the saved value from the profile
  }

  let nextNode = sceneConfig.startNode ?? null;
  let nextHistory = [];
  let nextClaimedRewards = [];
  let nextOpenedChests = [];
  let nextPlayerPos = defaultSpawn;
  let nextNpcPositions = defaultNpcs;
  let nextLeaderState = createDefaultLeaderState(normalizedSceneId);

  if (mode === 'load' && profileId) {
    const savedGame = await loadGameForProfile(profileId);

    if (savedGame?.sceneId === normalizedSceneId) {
      nextNode = savedGame.currentNode ?? nextNode;
      nextHistory = savedGame.history || [];
      nextClaimedRewards = savedGame.claimedRewards || [];
      nextOpenedChests = savedGame.openedChests || [];
      nextPlayerPos = savedGame.playerPos || defaultSpawn;
      nextNpcPositions = savedGame.npcPositions || defaultNpcs;
      nextLeaderState = savedGame.leaderState || nextLeaderState;
    }
  }

 // 🔄 This makes gears respawn while keeping story progress safe
  nextClaimedRewards = nextClaimedRewards.filter(id => !id.toString().startsWith('gear_'));

  setProfileName(nextProfileName);
  setCurrentCurrency(nextCurrency); // ⚙️ 3. Apply the currency to the HUD state
  setCurrentNode(nextNode);
  setHistory(nextHistory);
  setClaimedRewards(nextClaimedRewards);
  setOpenedChests(nextOpenedChests);
  setPlayerPos(nextPlayerPos);
  setNpcPositions(nextNpcPositions);
  setLeaderState(nextLeaderState);
  setReady(true);
};

    setup();
  }, [normalizedSceneId, profileId, mode, storyData, worldData, sceneConfig.startNode]);

  // Web keyboard input: WASD for movement, E/Enter to interact, Space to advance dialogue
  useEffect(() => {
    if (!ready) return undefined;

    const handleKeyDown = (event) => {
      const key = event.key?.toLowerCase();

      if (['w', 'a', 's', 'd'].includes(key)) {
        keysPressed.current[key] = true;
      }

      if ((key === 'e' || key === 'enter') && !currentNode) {
        beginNpcInteraction();
      }

      if (key === ' ' && currentNode && activeNode && !activeNode.choices && activeNode.next) {
        event.preventDefault();
        handleSelect(activeNode.next);
      }
    };

    const handleKeyUp = (event) => {
      const key = event.key?.toLowerCase();

      if (['w', 'a', 's', 'd'].includes(key)) {
        keysPressed.current[key] = false;
      }
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
      };
    }

    return undefined;
  }, [ready, currentNode, beginNpcInteraction]);

  // rAF loop: moves the player each frame from held WASD keys, applying collision and world-bounds clamping
  useEffect(() => {
    if (!ready) return undefined;

    const tick = () => {
      if (canMove) {
        const { dx, dy } = getMovementVector(keysPressed.current, MOVE_SPEED);

        setPlayerPos((prev) => {
          const attempted = {
            x: prev.x + dx,
            y: prev.y + dy,
          };

          const collided = applyCollision({
            nextPos: attempted,
            playerSize: PLAYER_SIZE,
            colliders: worldData.colliders || [],
            worldWidth,
            worldHeight,
          });

          return collided || prev;
        });

        const nextFacing = getFacingFromVector(dx, dy, facingRef.current);
        if (nextFacing !== facingRef.current) {
          facingRef.current = nextFacing;
          setFacing(nextFacing);
        }
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [ready, canMove, worldData, worldWidth, worldHeight]);

  // rAF loop: interpolates the leader NPC toward leaderGoalId; auto-advances dialogue on arrival
  useEffect(() => {
    if (!ready || !sceneConfig.leaderNpcId || !leaderGoalId) return undefined;
    if (!leaderState.active || currentNode) return undefined;

    const goal = (worldData?.objects || []).find((item) => item.id === leaderGoalId);
    if (!goal) return undefined;

    const leaderNpcIds = Array.isArray(sceneConfig.leaderNpcId)
      ? sceneConfig.leaderNpcId
      : [sceneConfig.leaderNpcId];

    const tickLeader = () => {
      let reachedGoal = false;

      setNpcPositions((prev) =>
        prev.map((npc) => {
          if (!leaderNpcIds.includes(npc.id)) return npc;

          const targetX = goal.x;
          const targetY = goal.y;
          const dx = targetX - npc.x;
          const dy = targetY - npc.y;
          const distance = Math.hypot(dx, dy);
          const nextFacing = getFacingFromVector(dx, dy, npc.facing || 'right');

          if (distance <= LEADER_SPEED || distance === 0) {
            reachedGoal = true;
            return {
              ...npc,
              x: targetX,
              y: targetY,
              facing: nextFacing,
            };
          }

          return {
            ...npc,
            x: npc.x + (dx / distance) * LEADER_SPEED,
            y: npc.y + (dy / distance) * LEADER_SPEED,
            facing: nextFacing,
          };
        })
      );

      if (reachedGoal) {
        setLeaderState({ active: false, finished: true });
        if (activeNode?.nextLeaderGoal && activeNode?.next) {
          handleSelect(activeNode.next);
        } else if (sceneConfig.arrivalNode && storyData?.[sceneConfig.arrivalNode]) {
          setCurrentNode(sceneConfig.arrivalNode);
        }
        return;
      }

      leaderFrameRef.current = requestAnimationFrame(tickLeader);
    };

    leaderFrameRef.current = requestAnimationFrame(tickLeader);

    return () => {
      if (leaderFrameRef.current) {
        cancelAnimationFrame(leaderFrameRef.current);
      }
    };
  }, [ready, currentNode, leaderState.active, leaderGoalId, worldData, storyData, sceneConfig.leaderNpcId, sceneConfig.arrivalNode, activeNode]);

  // Scene 8 ending: sets boardingShip=true once the player claims the 'board_ship' reward
  useEffect(() => {
    if (normalizedSceneId !== 'scene8') return;
    if (!claimedRewards.includes('board_ship')) return;
    if (boardingShip || hiddenPlayer || gameEnded) return;
    setBoardingShip(true);
  }, [claimedRewards, normalizedSceneId, boardingShip, hiddenPlayer, gameEnded]);

  // Moves both the player and Pink to boardGoal, then triggers the ship-fly animation
  useEffect(() => {
    if (!boardingShip) return undefined;

    const boardGoal = (worldData?.objects || []).find((o) => o.id === 'boardGoal');
    if (!boardGoal) return undefined;

    let playerReached = false;
    let pinkReached = false;

    const tick = () => {
      if (!playerReached) {
        setPlayerPos((prev) => {
          const dx = boardGoal.x - prev.x;
          const dy = boardGoal.y - prev.y;
          const dist = Math.hypot(dx, dy);
          if (dist <= MOVE_SPEED) {
            playerReached = true;
            return { x: boardGoal.x, y: boardGoal.y };
          }
          return {
            x: prev.x + (dx / dist) * MOVE_SPEED,
            y: prev.y + (dy / dist) * MOVE_SPEED,
          };
        });
      }

      if (!pinkReached) {
        setNpcPositions((prev) =>
          prev.map((npc) => {
            if (npc.id !== 'pink') return npc;
            const dx = boardGoal.x - npc.x;
            const dy = boardGoal.y - npc.y;
            const dist = Math.hypot(dx, dy);
            const nextFacing = getFacingFromVector(dx, dy, npc.facing || 'right');
            if (dist <= LEADER_SPEED) {
              pinkReached = true;
              return { ...npc, x: boardGoal.x, y: boardGoal.y, facing: nextFacing };
            }
            return {
              ...npc,
              x: npc.x + (dx / dist) * LEADER_SPEED,
              y: npc.y + (dy / dist) * LEADER_SPEED,
              facing: nextFacing,
            };
          })
        );
      }

      if (playerReached && pinkReached) {
        setHiddenPlayer(true);
        setHiddenPink(true);
        setBoardingShip(false);
        shipFlyAnim.setValue(0);
        Animated.timing(shipFlyAnim, {
          toValue: -1200,
          duration: 2000,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) setGameEnded(true);
        });
        return;
      }

      boardingFrameRef.current = requestAnimationFrame(tick);
    };

    boardingFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (boardingFrameRef.current) cancelAnimationFrame(boardingFrameRef.current);
    };
  }, [boardingShip, worldData]);

  // Returns to the main menu 5 seconds after the ship-fly animation completes
  useEffect(() => {
    if (!gameEnded) return;
    const t = setTimeout(() => onGoToMenu?.(), 5000);
    return () => clearTimeout(t);
  }, [gameEnded, onGoToMenu]);

  // Runs every time playerPos changes: update camera, detect nearby NPC/object, collect currency, trigger exits
  useEffect(() => {
    setCameraPos(
      getCameraPosition({
        playerPos,
        playerSize: PLAYER_SIZE,
        viewportWidth,
        viewportHeight,
        worldWidth,
        worldHeight,
      })
    );

    const nearbyNpc = getNearbyNpc({
      playerPos,
      playerSize: PLAYER_SIZE,
      npcs: npcPositions,
    });

    const nearbyObject = getNearbyObject({
      playerPos,
      playerSize: PLAYER_SIZE,
      objects: (worldData?.objects || []).filter(
        (obj) => {
          if (obj.type === 'chest' && openedChests.includes(obj.id)) return false;
          if (obj.showAfter && !claimedRewards.includes(obj.showAfter)) return false;
          if (obj.showAfterAll && !obj.showAfterAll.every((id) => claimedRewards.includes(id))) return false;
          return true;
        }
      ),
    });

    setInteractionTarget(nearbyObject || nearbyNpc || null);

    // --- ⚙️ CURRENCY COLLECTION LOGIC ---
const nearbyCurrency = (worldData?.objects || []).find((item) => {
  if (item.type !== 'currency' || claimedRewards.includes(item.id)) return false;
  
  // Reuse your circle-based radius check
  return isNearTarget(playerPos, PLAYER_SIZE, item.x + (item.width/2), item.y + (item.height/2), 60);
});

if (nearbyCurrency && !currentNode) {
  // 1. Mark as collected immediately to make it disappear
  setClaimedRewards((prev) => [...prev, nearbyCurrency.id]);
  
  // 2. Update the actual wallet AND the on-screen HUD
  addCurrency(profileId, nearbyCurrency.amount || 10).then(async () => {
    // This fetches the new total from the profile service
    const updatedProfile = await getProfileById(profileId);
    if (updatedProfile) {
      setCurrentCurrency(updatedProfile.currency); // This updates the number on your screen
    }
  });
  
shakeAnim.setValue(0);
Animated.sequence([
  Animated.timing(shakeAnim, { toValue: 4, duration: 50, useNativeDriver: true }),
  Animated.timing(shakeAnim, { toValue: -4, duration: 50, useNativeDriver: true }),
  Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
]).start();
}

    const touchedExit = getTouchedExit({
      playerPos,
      playerSize: PLAYER_SIZE,
      exits: worldData?.exits || [],
    });

    if (touchedExit && !currentNode) {
      onChangeScene?.(touchedExit.targetScene);
    }
  }, [playerPos, currentNode, npcPositions, openedChests, worldData, worldWidth, worldHeight, viewportWidth, viewportHeight, onChangeScene]);

  // Fires when the active dialogue node changes: runs flash/shake/mechanic_cast effects, triggers leader movement, auto-advances timed nodes
  useEffect(() => {
    if (!activeNode) return undefined;

    if (autoAdvanceTimeout.current) {
      clearTimeout(autoAdvanceTimeout.current);
      autoAdvanceTimeout.current = null;
    }

    if (flashTimeoutRef.current) {
      clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = null;
    }

    if (shakeTimeoutRef.current) {
      clearTimeout(shakeTimeoutRef.current);
      shakeTimeoutRef.current = null;
    }

    if (shakeLoopRef.current) {
      shakeLoopRef.current.stop();
      shakeLoopRef.current = null;
      shakeAnim.setValue(0);
    }

    const effectDuration = activeNode.durationMs ?? (activeNode.effect ? 1600 : 700);

    if (activeNode.effect === 'flash') {
      setFlashVisible(true);
      flashTimeoutRef.current = setTimeout(() => setFlashVisible(false), effectDuration);
    }

    if (activeNode.effect === 'shake') {
      shakeAnim.setValue(0);
      shakeLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 8, duration: 80, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -8, duration: 80, useNativeDriver: true }),
        ])
      );
      shakeLoopRef.current.start();
      shakeTimeoutRef.current = setTimeout(() => {
        if (shakeLoopRef.current) {
          shakeLoopRef.current.stop();
          shakeLoopRef.current = null;
        }
        shakeAnim.setValue(0);
      }, effectDuration);
    }

    if (activeNode.nextLeaderGoal) {
      setLeaderGoalId(activeNode.nextLeaderGoal);
      setLeaderState({ active: true, finished: false });
    }

    if (activeNode.openChest) {
      setOpenedChests((prev) =>
        prev.includes(activeNode.openChest) ? prev : [...prev, activeNode.openChest]
      );
    }

    if (activeNode.throwKey) {
      setIsThrowingKey(true);
      throwAnim.setValue(0);
      Animated.timing(throwAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: false,
      }).start(() => {
        setIsThrowingKey(false);
        setCurrentNode(null);
        setTimeout(() => onChangeScene?.('scene5'), 200);
      });
    }

    if (activeNode.effect === 'mechanic_cast') {
      setMechanicCasting(true);
      setSpellVisible(true);
      mechanicCastTimeoutRef.current = setTimeout(() => {
        setMechanicCasting(false);
        setSpellVisible(false);
        setShipRepaired(true);
      }, effectDuration);
    }

    if (activeNode.autoAdvance && activeNode.next && !activeNode.nextLeaderGoal) {
      autoAdvanceTimeout.current = setTimeout(() => {
        handleSelect(activeNode.next);
      }, effectDuration);
    }

    return () => {
      if (autoAdvanceTimeout.current) {
        clearTimeout(autoAdvanceTimeout.current);
        autoAdvanceTimeout.current = null;
      }
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
        flashTimeoutRef.current = null;
      }
      if (shakeTimeoutRef.current) {
        clearTimeout(shakeTimeoutRef.current);
        shakeTimeoutRef.current = null;
      }
      if (shakeLoopRef.current) {
        shakeLoopRef.current.stop();
        shakeLoopRef.current = null;
        shakeAnim.setValue(0);
      }
      if (attackTimeoutRef.current) {
        clearTimeout(attackTimeoutRef.current);
        attackTimeoutRef.current = null;
      }
      if (crateExplodeTimeoutRef.current) {
        clearTimeout(crateExplodeTimeoutRef.current);
        crateExplodeTimeoutRef.current = null;
      }
      if (mechanicCastTimeoutRef.current) {
        clearTimeout(mechanicCastTimeoutRef.current);
        mechanicCastTimeoutRef.current = null;
      }
      setMechanicCasting(false);
      setSpellVisible(false);
    };
  }, [activeNode, shakeAnim, throwAnim, onChangeScene]);

  // Debounced auto-save: writes full game state to AsyncStorage 350ms after any trackable change
  useEffect(() => {
    if (!ready || !profileId) return undefined;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      let updatedClaimedRewards = claimedRewards;

      if (activeNode?.reward && currentNode && !claimedRewards.includes(currentNode)) {
        await addCurrency(profileId, activeNode.reward);
        updatedClaimedRewards = [...claimedRewards, currentNode];
        setClaimedRewards(updatedClaimedRewards);
      }

      if (activeNode?.claimItem && !claimedRewards.includes(activeNode.claimItem)) {
        updatedClaimedRewards = [...updatedClaimedRewards, activeNode.claimItem];
        setClaimedRewards(updatedClaimedRewards);
      }

      await saveGameForProfile(profileId, {
        sceneId: normalizedSceneId,
        currentNode,
        history,
        claimedRewards: updatedClaimedRewards,
        openedChests,
        playerPos,
        npcPositions,
        leaderState,
      });
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [ready, profileId, normalizedSceneId, currentNode, activeNode, history, claimedRewards, openedChests, playerPos, npcPositions, leaderState]);

  // Clear the gear drop visual once dialogue closes
  useEffect(() => {
    if (currentNode === null && spawnedGear !== null) {
      setSpawnedGear(null);
    }
  }, [currentNode, spawnedGear]);

  // Advance the dialogue graph: handle currency costs, record choice history, detect scene transitions
  const handleSelect = async (nextNodeID, choiceLabel = null, cost = 0) => {
    const leavingNode = storyData?.[currentNode];
    if (leavingNode?.claimItem && !claimedRewards.includes(leavingNode.claimItem)) {
      setClaimedRewards((prev) => [...prev, leavingNode.claimItem]);
    }

    if (!nextNodeID) {
      setCurrentNode(null);
      return;
    }

    if (cost > 0) {
      const canAfford = await spendCurrency(profileId, cost);
      if (!canAfford) {
        Alert.alert('Insufficient Currency', "You don't have enough to make this choice.");
        return;
      }
    }

    if (choiceLabel) {
      setHistory((prev) => [...prev, choiceLabel]);
    }

    if (storyData?.[nextNodeID]) {
      setCurrentNode(nextNodeID);
      return;
    }

    if (storyMap[nextNodeID]) {
      await addCurrency(profileId, 100);
      onChangeScene?.(nextNodeID);
      return;
    }

    if (nextNodeID === 'end') {
      setCurrentNode(null);
    }
  };

  // Color tokens for the procedural world renderer, derived from the world JSON's theme field
  const worldThemeStyle = useMemo(() => {
    const theme = worldData?.world?.theme;

    if (theme === 'forest_escape') {
      return {
        sky: '#84d7ff',
        ground: '#97d2a3',
        path: '#cfbc8a',
        pathSecondary: '#b7ab7c',
        collider: '#547c4c',
        exit: 'rgba(255,255,255,0.16)',
        object: 'rgba(94, 63, 24, 0.95)',
        objectAccent: 'rgba(255, 236, 168, 0.95)',
      };
    }

    return {
      sky: '#bbe7ff',
      ground: '#d7f0c8',
      path: '#dcc290',
      pathSecondary: '#ccb081',
      collider: '#4d9a58',
      exit: 'rgba(122,79,224,0.08)',
      object: 'rgba(94, 63, 24, 0.95)',
      objectAccent: 'rgba(255, 236, 168, 0.95)',
    };
  }, [worldData]);

  // Renders the scrollable game world: background → colliders → objects → NPCs → player
  const renderWorld = () => (
    <View
      style={[
        styles.viewport,
        sceneConfig.layout !== 'vn' && styles.viewportFull,
        {
          width: viewportWidth,
          height: viewportHeight,
          backgroundColor: worldThemeStyle.sky,
        },
      ]}
    >

      
      <View
        style={[
          styles.world,
          {
            width: worldWidth,
            height: worldHeight,
            transform: [{ translateX: -cameraPos.x }, { translateY: -cameraPos.y }],
          },
        ]}
      >
        {SCENE_BACKGROUND_MAP[normalizedSceneId] ? (
          <Image
            source={SCENE_BACKGROUND_MAP[normalizedSceneId]}
            style={styles.sceneBackground}
            resizeMode="cover"
          />
        ) : (
          <>
            <View style={[styles.grass, { backgroundColor: worldThemeStyle.ground }]} />
            <View style={[styles.pathOne, { backgroundColor: worldThemeStyle.path }]} />
            <View style={[styles.pathTwo, { backgroundColor: worldThemeStyle.pathSecondary }]} />
          </>
        )}

        {(worldData.colliders || [])
          .filter((collider) => collider.visible !== false)
          .map((collider) => (
            <View
              key={collider.id}
              style={[
                styles.colliderVisual,
                {
                  left: collider.x,
                  top: collider.y,
                  width: collider.width,
                  height: collider.height,
                  backgroundColor: collider.image ? 'transparent' : worldThemeStyle.collider,
                  justifyContent: collider.image ? 'flex-end' : 'center',
                  alignItems: collider.image ? 'center' : 'stretch',
                  overflow: collider.image ? 'hidden' : 'visible',
                },
              ]}
            >
              {collider.image ? (
                <Image
                  source={OBJECT_IMAGE_MAP[collider.image]}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                />
              ) : null}
            </View>
          ))}

{(worldData.objects || [])
  .filter((item) => {
    if (item.visible === false) return false;
    if (claimedRewards.includes(item.id)) return false;
    if (item.type === 'chestKey' && !openedChests.includes(item.chestId)) return false;
    if (item.showAfter && !claimedRewards.includes(item.showAfter)) return false;
    if (item.showAfterAll && !item.showAfterAll.every((id) => claimedRewards.includes(id))) return false;
    return true;
  })
  .map((item) => {
    const animKey =
      item.id === 'ship' && shipRepaired ? 'ship_repaired' :
      item.type === 'chest' && openedChests.includes(item.id) ? item.openAnimationKey :
      item.type === 'crate' && openedChests.includes(item.id) ? 'crate_explode' :
      item.animationKey;
    const animEntry = animKey ? ANIMATED_OBJECT_MAP?.[animKey] : null;
    const isShip = item.id === 'ship';
    const ObjectContainer = isShip ? Animated.View : View;
    return (
      <ObjectContainer
        key={item.id}
        style={[
          styles.objectVisual,
          {
            left: item.x,
            top: item.y,
            width: item.width,
            height: item.height,
            backgroundColor: (item.image || animKey) ? 'transparent' : worldThemeStyle.object,
            borderWidth: (item.image || animKey) ? 0 : 2,
            borderRadius: (item.image || animKey) ? 0 : 18,
            overflow: 'hidden',
          },
          isShip && { transform: [{ translateY: shipFlyAnim }] },
        ]}
      >
        {animEntry ? (
          <AnimatedSprite
            source={animEntry.source}
            totalFrames={animEntry.totalFrames}
            rowCount={animEntry.rowCount}
            row={animEntry.row}
            firstFrame={animEntry.firstFrame}
            lastFrame={animEntry.lastFrame}
            speedMs={animEntry.speedMs}
            displayWidth={item.width}
            displayHeight={item.height}
          />
        ) : item.image ? (
          <Image
            source={OBJECT_IMAGE_MAP[item.image]}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          />
        ) : (
          <Text style={[styles.objectLabel, { color: worldThemeStyle.objectAccent }]}>
            {item.label || item.id}
          </Text>
        )}
      </ObjectContainer>
    );
  })}

        {catGif && (
          <Image
            source={OBJECT_IMAGE_MAP['cat.gif']}
            style={{
              position: 'absolute',
              left: catGif.x,
              top: catGif.y,
              width: PLAYER_SIZE * 3,
              height: PLAYER_SIZE * 3,
              zIndex: 19,
            }}
            resizeMode="contain"
          />
        )}

        {spawnedGear && (
          <Image
            source={OBJECT_IMAGE_MAP['purple_gear_sheet.png']}
            style={{
              position: 'absolute',
              left: spawnedGear.x - 8,
              top: spawnedGear.y - 32,
              width: 80,
              height: 80,
              zIndex: 18,
            }}
            resizeMode="contain"
          />
        )}

        {npcViews.filter((npc) => !(npc.id === 'pink' && hiddenPink)).map((npc) => {
          const _leaderIds = Array.isArray(sceneConfig.leaderNpcId)
            ? sceneConfig.leaderNpcId
            : sceneConfig.leaderNpcId ? [sceneConfig.leaderNpcId] : [];
          const npcState =
            !currentNode && leaderState.active && _leaderIds.includes(npc.id)
              ? 'run'
              : boardingShip && npc.id === 'pink'
              ? 'walk'
              : 'idle';

          return (
            <View
              key={npc.id}
              style={[
                styles.npcWrap,
                {
                  left: npc.x,
                  top: npc.y,
                },
              ]}
            >
              {npc.id === 'Mechanic' && mechanicCasting ? (
                <FrameSequenceSprite
                  frames={MECHANIC_CAST_FRAMES}
                  speedMs={100}
                  style={{ width: 92, height: 92 }}
                />
              ) : (
                <PlayerSprite
                  x={0}
                  y={0}
                  size={npc.animationSet ? 64 : 92}
                  animationSet={npc.animationSet}
                  spriteSource={npc.animationSet ? null : npc.portraitSource}
                  state={npcState}
                  facing={npc.facing || 'right'}
                  zIndex={16}
                  speedMs={130}
                />
              )}
              <Text style={styles.npcLabel}>
                {dialogueCharacters[npc.id]?.name || npc.id}
              </Text>
            </View>
          );
        })}

        {spellVisible && (() => {
          const ship = (worldData?.objects || []).find((o) => o.id === 'ship');
          if (!ship) return null;
          return (
            <Image
              key="spells-effect"
              source={SPELLS_EFFECT}
              style={{
                position: 'absolute',
                left: ship.x - cameraPos.x + ship.width / 2 - 64,
                top: ship.y - cameraPos.y + ship.height / 2 - 64,
                width: 128,
                height: 128,
                zIndex: 25,
              }}
              resizeMode="contain"
            />
          );
        })()}

        {(worldData.exits || []).map((exit) => (
          <View
            key={exit.id}
            style={[
              styles.exitVisual,
              {
                left: exit.x,
                top: exit.y,
                width: exit.width,
                height: exit.height,
                backgroundColor: worldThemeStyle.exit,
              },
            ]}
          />
        ))}

        {!hiddenPlayer && (
          <PlayerSprite
            x={playerPos.x}
            y={playerPos.y}
            size={PLAYER_SIZE}
            animationSet={PLAYER_ANIMATION_SET}
            state={boardingShip ? 'walk' : playerState !== 'idle' ? playerState : isPlayerMoving ? 'walk' : 'idle'}
            facing={boardingShip ? 'left' : facing}
            zIndex={20}
            speedMs={140}
          />
        )}
      </View>
    </View>
  );

  if (!ready || !storyData || !worldData) {
    return <View style={styles.root} />;
  }

  const speakerLabel = interactionTarget
    ? interactionTarget.label || dialogueCharacters[interactionTarget.id]?.name || interactionTarget.id
    : 'someone';

  const interactButtonLabel =
    interactionTarget?.type === 'crate' ? 'Smash' :
    interactionTarget?.type === 'object' ? 'Inspect' :
    'Talk';

  // --- VN layout: full-screen background with a scrollable dialogue/choice panel ---
  if (sceneConfig.layout === 'vn') {
    return (
      <View style={[styles.root, { backgroundColor: sceneConfig.palette.background }]}>
        
        {/* Background image */}
        {SCENE_BACKGROUND_MAP[normalizedSceneId] && (
          <Image
            source={SCENE_BACKGROUND_MAP[normalizedSceneId]}
            style={styles.vnFullscreenBackground} // Makes it cover the whole screen
            resizeMode="cover"
          />
        )}
        
        <Animated.View style={[styles.vnContainer, { transform: [{ translateX: shakeAnim }] }]}>
          <TouchableOpacity style={styles.topMenuButton} onPress={onGoToMenu}>
            <Text style={styles.topMenuButtonText}>Exit</Text>
          </TouchableOpacity>

          <View
            style={[
              styles.vnDialoguePanel,
              {
                borderColor: sceneConfig.palette.cardBorder,
                backgroundColor: 'rgba(10, 8, 19, 0.84)',
                maxHeight: screenHeight * 0.9,
              },
            ]}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 8 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* hint */}
              <Text style={[styles.vnHintLabel, { color: sceneConfig.palette.accent }]}>
                {sceneConfig.hint}
              </Text>

              {/* dialog */}
              <DialogBox
                variant="vn"
                showPortrait={activeNode?.character !== 'system'}
                characterId={activeNode?.character || 'system'}
                characterData={dialogueCharacters}
                txt={activeNode ? activeNode.txt : ''}
                portraitOverride={speakerPortrait}
                continueHint={null}
                onPress={
                  activeNode && !activeNode.choices && !activeNode.autoAdvance && activeNode.next
                    ? () => handleSelect(activeNode.next)
                    : null
                }
              />

              {/* choices go here */}
              {activeNode?.choices ? (
                <PlayerChoice
                  variant="vn"
                  choices={activeNode.choices}
                  onSelect={(id, label, cost) => handleSelect(id, label, cost)}
                />
              ) : null}
            </ScrollView>
          </View>
        </Animated.View>

        {flashVisible && <View pointerEvents="none" style={styles.flashOverlay} />}
      </View>
    );
  }

  // --- Gameplay layout: world viewport + HUD overlay + dialogue popup at the bottom ---
  return (
    <View style={[styles.root, { backgroundColor: sceneConfig.palette.background }]}>
      <Animated.View style={[styles.gameplayContainer, { transform: [{ translateX: shakeAnim }] }]}>
        {renderWorld()}

        {/* 💰 PASTE YOUR LIVE CURRENCY HUD HERE */}
        <View style={styles.currencyHud}>
          <Text style={styles.currencyHudText}>
            ⚙️ {profileName === 'Player' ? '0' : currentCurrency}
          </Text>
        </View>

        <TouchableOpacity style={styles.topMenuButton} onPress={onGoToMenu}>
          <Text style={styles.topMenuButtonText}>Exit</Text>
        </TouchableOpacity>

        <View
          style={[
            styles.gameplayHud,
            {
              backgroundColor: sceneConfig.palette.panel,
              borderColor: sceneConfig.palette.cardBorder,
            },
          ]}
        >
          <Text style={[styles.sceneOverline, { color: sceneConfig.palette.accent }]}>
            {sceneConfig.topLabel}
          </Text>
          <Text style={styles.gameplayHudTitle}>{sceneConfig.title}</Text>
          <Text style={styles.gameplayHudText}>{sceneConfig.hint}</Text>
        </View>

        {!activeNode ? (
          <View style={styles.gameplayBottomOverlay}>
            <InteractPrompt
              visible={!!interactionTarget && interactionTarget.type !== 'crate'}
              text={`Press E or tap ${interactButtonLabel} to ${
                interactionTarget?.type === 'object' ? 'examine' : 'speak with'
              } ${speakerLabel}.`}
            />
          </View>
        ) : null}

        {!activeNode && interactionTarget &&
          !(interactionTarget.type === 'crate' && (openedChests.includes(interactionTarget.id) || claimedRewards.includes(interactionTarget.id))) ? (
          <TouchableOpacity style={styles.interactButton} onPress={beginNpcInteraction}>
            <Text style={styles.interactButtonText}>{interactButtonLabel}</Text>
          </TouchableOpacity>
        ) : null}

        {activeNode && (activeNode.txt || activeNode.choices) ? (
          <View style={styles.gameplayDialogueWrap}>
            {activeNode?.choices ? (
              <PlayerChoice
                variant="overlay"
                choices={activeNode.choices}
                onSelect={(id, label, cost) => handleSelect(id, label, cost)}
              />
            ) : null}

            <DialogBox
              variant="overlay"
              showPortrait={activeNode?.character !== 'system'}
              characterId={activeNode?.character || 'system'}
              characterData={dialogueCharacters}
              txt={activeNode.txt}
              portraitOverride={speakerPortrait}
              continueHint={activeNode && !activeNode.autoAdvance ? 'Tap to continue' : null}
              onPress={
                activeNode && !activeNode.choices && !activeNode.autoAdvance && activeNode.next
                  ? () => handleSelect(activeNode.next)
                  : null
              }
            />
          </View>
        ) : null}

        {isThrowingKey && (() => {
          const fromX = playerPos.x - cameraPos.x;
          const fromY = playerPos.y - cameraPos.y;
          const toX = keyThrowTargetRef.current.x - cameraPos.x;
          const toY = keyThrowTargetRef.current.y - cameraPos.y;
          return (
            <Animated.Image
              source={OBJECT_IMAGE_MAP['KeyPurple.png']}
              style={{
                position: 'absolute',
                zIndex: 200,
                width: 44,
                height: 44,
                left: throwAnim.interpolate({ inputRange: [0, 1], outputRange: [fromX, toX] }),
                top: throwAnim.interpolate({ inputRange: [0, 1], outputRange: [fromY, toY] }),
              }}
              resizeMode="contain"
            />
          );
        })()}
      </Animated.View>

      {flashVisible && <View pointerEvents="none" style={styles.flashOverlay} />}

      {gameEnded && (
        <View style={styles.gameEndOverlay}>
          <Text style={styles.gameEndText}>THE END</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  gameEndOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  gameEndText: {
    color: '#ffffff',
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: 10,
  },
  topMenuButton: {
    position: 'absolute',
    top: 16,
    right: 20,
    zIndex: 50,
    backgroundColor: 'rgba(21, 21, 33, 0.84)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  topMenuButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  sceneOverline: {
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '800',
    marginBottom: 6,
  },
  vnContainer: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 16,
    justifyContent: 'flex-start',
  },
  vnDialoguePanel: {
    marginTop: 14,
    borderRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
  },
  vnHintLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
  },
  gameplayContainer: {
    flex: 1,
  },
  viewport: {
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#89b9d6',
  },
  viewportFull: {
    alignSelf: 'stretch',
    borderRadius: 0,
    borderWidth: 0,
  },
  world: {
    position: 'relative',
  },
  sceneBackground: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
  },
  grass: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
  pathOne: {
    position: 'absolute',
    left: 120,
    top: 160,
    width: 1200,
    height: 120,
    borderRadius: 60,
  },
  pathTwo: {
    position: 'absolute',
    left: 900,
    top: 120,
    width: 160,
    height: 560,
    borderRadius: 80,
  },
  colliderVisual: {
    position: 'absolute',
    //borderRadius: 999,
    zIndex: 8,
  },
  objectVisual: {
    position: 'absolute',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  objectLabel: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  npcWrap: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 16,
  },
  npcLabel: {
    marginTop: 2,
    fontWeight: '700',
    color: '#102330',
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },
  exitVisual: {
    position: 'absolute',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#7a4fe0',
  },
  gameplayHud: {
    position: 'absolute',
    left: 16,
    top: 16,
    maxWidth: 260,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  gameplayHudTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
  },
  gameplayHudText: {
    color: '#d7eef8',
    fontSize: 13,
    lineHeight: 18,
  },
  gameplayBottomOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  interactButton: {
    position: 'absolute',
    right: 18,
    bottom: 22,
    backgroundColor: 'rgba(14, 23, 34, 0.92)',
    borderColor: 'rgba(176, 233, 255, 0.34)',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  interactButtonText: {
    color: '#f0fbff',
    fontWeight: '900',
    fontSize: 15,
  },
  gameplayDialogueWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    gap: 10,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'white',
    opacity: 0.95,
  },

  currencyHud: {
    position: 'absolute',
    top: 16,               // Distance from the top
    alignSelf: 'center',    // ⚙️ This centers it horizontally
    backgroundColor: 'rgba(27, 19, 40, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,      // More rounded for a centered look
    zIndex: 100,
    borderWidth: 1,
    borderColor: '#8b5cf6',
    flexDirection: 'row',  // Keeps icon and text in a line
    alignItems: 'center',
  },
  currencyHudText: {
    color: '#f2cf66',
    fontWeight: '800',
    fontSize: 20,          // Slightly larger for better visibility
  },

  vnFullscreenBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
},
});

export default WorldScene;