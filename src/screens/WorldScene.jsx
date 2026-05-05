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
import scene1Story from '../storyData/scene1.json';
import scene2Story from '../storyData/scene2.json';
import scene3Story from '../storyData/scene3.json';
import scene4Story from '../storyData/scene4.json';
import scene1World from '../worldData/scene1World.json';
import scene2World from '../worldData/scene2World.json';
import scene4World from '../worldData/scene4World.json';
import { getMovementVector, getFacingFromVector } from '../systems/PlayerController';
import { getCameraPosition } from '../systems/CameraController';
import { applyCollision } from '../systems/CollisionSystem';
import { getNearbyNpc, getNearbyObject, getTouchedExit } from '../systems/InteractionSystem';
import { SCENE_BACKGROUND_MAP } from '../constants/backgroundConfigs';
import { PLAYER_ANIMATION_SET, SIDEKICK_ANIMATION_SET, OWLET_ANIMATION_SET, NPC_ANIMATION_MAP } from '../constants/animationSets';
import { NPC_PORTRAIT_MAP, OBJECT_IMAGE_MAP, ANIMATED_OBJECT_MAP } from '../constants/imageMaps';
import AnimatedSprite from '../components/AnimatedSprite';

const PLAYER_SIZE = 64;
const MOVE_SPEED = 4;
const LEADER_SPEED = 2.4;
const SAVE_DEBOUNCE_MS = 350;

const storyMap = {
  scene1: scene1Story,
  scene2: scene2Story,
  scene3: scene3Story,
  scene4: scene4Story,
};

const worldMap = {
  scene1: scene1World,
  scene2: scene2World,
  scene3: scene1World,
  scene4: scene4World,
};

// scene config here!
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
    subtitle: 'The side character takes off. Follow with WASD while the world scrolls full screen.',
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
  scene4: {
    layout: 'gameplay',
    startNode: null,
    topLabel: 'SCENE 4',
    title: 'The Clearing',
    subtitle: 'Explore the mysterious clearing and uncover its secrets.',
    hint: 'Use W A S D to move. Press E or tap to interact with objects.',
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
};

const createDefaultLeaderState = (sceneId) => ({
  active: sceneId === 'scene2',
  finished: false,
});

const WorldScene = ({ sceneId, profileId, mode, onGoToMenu, onChangeScene }) => {
  const normalizedSceneId = sceneId?.toLowerCase();
  const storyData = storyMap[normalizedSceneId];
  const worldData = worldMap[normalizedSceneId];
  const sceneConfig = sceneConfigMap[normalizedSceneId] || sceneConfigMap.scene2;
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const [ready, setReady] = useState(false);
  const [currentNode, setCurrentNode] = useState(null);
  const [history, setHistory] = useState([]);
  const [claimedRewards, setClaimedRewards] = useState([]);
  const [playerPos, setPlayerPos] = useState(worldData?.spawn || { x: 100, y: 100 });
  const [npcPositions, setNpcPositions] = useState(worldData?.npcs || []);
  const [leaderState, setLeaderState] = useState(createDefaultLeaderState(normalizedSceneId));
  const [leaderGoalId, setLeaderGoalId] = useState(sceneConfig.leaderGoalId);
  const [cameraPos, setCameraPos] = useState({ x: 0, y: 0 });
  const [facing, setFacing] = useState('down');
  const [flashVisible, setFlashVisible] = useState(false);
  const [interactionTarget, setInteractionTarget] = useState(null);
  const [profileName, setProfileName] = useState('Player');

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const autoAdvanceTimeout = useRef(null);
  const animationFrameRef = useRef(null);
  const leaderFrameRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const flashTimeoutRef = useRef(null);
  const shakeTimeoutRef = useRef(null);
  const shakeLoopRef = useRef(null);
  const keysPressed = useRef({ w: false, a: false, s: false, d: false });

  const worldWidth = worldData?.world?.width || 1400;
  const worldHeight = worldData?.world?.height || 900;

  const viewportWidth = sceneConfig.layout === 'vn' ? Math.min(screenWidth - 28, 760) : screenWidth;
  const viewportHeight = sceneConfig.layout === 'vn' ? Math.min(screenHeight * 0.34, 320) : screenHeight;

  const activeNode = currentNode ? storyData?.[currentNode] : null;
  const canMove = ready && sceneConfig.layout !== 'vn' && !currentNode;

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
      animationSet: NPC_ANIMATION_MAP[npc.id] || SIDEKICK_ANIMATION_SET,
      portraitSource: NPC_PORTRAIT_MAP[npc.id] || null,
    }));
  }, [npcPositions]);

  const beginNpcInteraction = useCallback(() => {
    if (!interactionTarget || currentNode) return;
    setCurrentNode(interactionTarget.interactionNode || 'start');
  }, [interactionTarget, currentNode]);

  useEffect(() => {
    const setup = async () => {
  if (!storyData || !worldData) {
    setReady(true);
    return;
  }

  const defaultSpawn = worldData.spawn || { x: 100, y: 100 };
  const defaultNpcs = worldData.npcs || [];

  let nextProfileName = 'Player';

  if (profileId) {
    const profile = await getProfileById(profileId);
    nextProfileName = profile?.name?.trim() || 'Player';
  }

  let nextNode = sceneConfig.startNode ?? null;
  let nextHistory = [];
  let nextClaimedRewards = [];
  let nextPlayerPos = defaultSpawn;
  let nextNpcPositions = defaultNpcs;
  let nextLeaderState = createDefaultLeaderState(normalizedSceneId);

  if (mode === 'load' && profileId) {
    const savedGame = await loadGameForProfile(profileId);

    if (savedGame?.sceneId === normalizedSceneId) {
      nextNode = savedGame.currentNode ?? nextNode;
      nextHistory = savedGame.history || [];
      nextClaimedRewards = savedGame.claimedRewards || [];
      nextPlayerPos = savedGame.playerPos || defaultSpawn;
      nextNpcPositions = savedGame.npcPositions || defaultNpcs;
      nextLeaderState = savedGame.leaderState || nextLeaderState;
    }
  }

  setProfileName(nextProfileName);
  setCurrentNode(nextNode);
  setHistory(nextHistory);
  setClaimedRewards(nextClaimedRewards);
  setPlayerPos(nextPlayerPos);
  setNpcPositions(nextNpcPositions);
  setLeaderState(nextLeaderState);
  setReady(true);
};

    setup();
  }, [normalizedSceneId, profileId, mode, storyData, worldData, sceneConfig.startNode]);

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

          const finalPos = collided || prev;
          const nextFacing = getFacingFromVector(dx, dy, facing);
          setFacing(nextFacing);

          return finalPos;
        });
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [ready, canMove, worldData, worldWidth, worldHeight, facing]);

  useEffect(() => {
    if (!ready || !sceneConfig.leaderNpcId || !leaderGoalId) return undefined;
    if (!leaderState.active || currentNode) return undefined;

    const goal = (worldData?.objects || []).find((item) => item.id === leaderGoalId);
    if (!goal) return undefined;

    const tickLeader = () => {
      let reachedGoal = false;

      setNpcPositions((prev) =>
        prev.map((npc) => {
          if (npc.id !== sceneConfig.leaderNpcId) return npc;

          const targetX = goal.x;
          const targetY = goal.y;
          const dx = targetX - npc.x;
          const dy = targetY - npc.y;
          const distance = Math.hypot(dx, dy);

          if (distance <= LEADER_SPEED || distance === 0) {
            reachedGoal = true;
            return {
              ...npc,
              x: targetX,
              y: targetY,
            };
          }

          return {
            ...npc,
            x: npc.x + (dx / distance) * LEADER_SPEED,
            y: npc.y + (dy / distance) * LEADER_SPEED,
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
      objects: worldData?.objects || [],
    });

    setInteractionTarget(nearbyObject || nearbyNpc || null);

    const touchedExit = getTouchedExit({
      playerPos,
      playerSize: PLAYER_SIZE,
      exits: worldData?.exits || [],
    });

    if (touchedExit && !currentNode) {
      onChangeScene?.(touchedExit.targetScene);
    }
  }, [playerPos, currentNode, npcPositions, worldData, worldWidth, worldHeight, viewportWidth, viewportHeight, onChangeScene]);

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
    };
  }, [activeNode, shakeAnim]);

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

      await saveGameForProfile(profileId, {
        sceneId: normalizedSceneId,
        currentNode,
        history,
        claimedRewards: updatedClaimedRewards,
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
  }, [ready, profileId, normalizedSceneId, currentNode, activeNode, history, claimedRewards, playerPos, npcPositions, leaderState]);

  const handleSelect = async (nextNodeID, choiceLabel = null, cost = 0) => {
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

{(worldData.objects || []).filter((item) => item.visible !== false).map((item) => (
          <View
            key={item.id}
            style={[
              styles.objectVisual,
              {
                left: item.x,
                top: item.y,
                width: item.width,
                height: item.height,
                backgroundColor: (item.image || item.animationKey) ? 'transparent' : worldThemeStyle.object,
              },
            ]}
          >
            {item.animationKey && ANIMATED_OBJECT_MAP?.[item.animationKey] ? (
              <AnimatedSprite
                source={ANIMATED_OBJECT_MAP[item.animationKey].source}
                totalFrames={ANIMATED_OBJECT_MAP[item.animationKey].totalFrames}
                firstFrame={ANIMATED_OBJECT_MAP[item.animationKey].firstFrame}
                lastFrame={ANIMATED_OBJECT_MAP[item.animationKey].lastFrame}
                speedMs={ANIMATED_OBJECT_MAP[item.animationKey].speedMs}
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
          </View>
        ))}

        {npcViews.map((npc) => {
          const npcState =
            !currentNode && leaderState.active && npc.id === sceneConfig.leaderNpcId
              ? 'run'
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
              <PlayerSprite
                x={0}
                y={0}
                size={64}
                animationSet={npc.animationSet}
                state={npcState}
                facing="right"
                zIndex={16}
                speedMs={130}
              />
              <Text style={styles.npcLabel}>
                {dialogueCharacters[npc.id]?.name || npc.id}
              </Text>
            </View>
          );
        })}

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

        <PlayerSprite
          x={playerPos.x}
          y={playerPos.y}
          size={PLAYER_SIZE}
          animationSet={PLAYER_ANIMATION_SET}
          state={isPlayerMoving ? 'walk' : 'idle'}
          facing={facing}
          zIndex={20}
          speedMs={140}
        />
      </View>
    </View>
  );

  if (!ready || !storyData || !worldData) {
    return <View style={styles.root} />;
  }

  const speakerLabel = interactionTarget
    ? interactionTarget.label || dialogueCharacters[interactionTarget.id]?.name || interactionTarget.id
    : 'someone';

  const interactButtonLabel = interactionTarget?.type === 'object' ? 'Inspect' : 'Talk';

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
              },
            ]}
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
              continueHint={activeNode && !activeNode.autoAdvance ? 'Tap to advance' : null}
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

          </View>
        </Animated.View>

        {flashVisible && <View pointerEvents="none" style={styles.flashOverlay} />}
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: sceneConfig.palette.background }]}>
      <Animated.View style={[styles.gameplayContainer, { transform: [{ translateX: shakeAnim }] }]}>
        {renderWorld()}

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
              visible={!!interactionTarget}
              text={`Press E or tap ${interactButtonLabel} to ${
                interactionTarget?.type === 'object' ? 'examine' : 'speak with'
              } ${speakerLabel}.`}
            />
          </View>
        ) : null}

        {!activeNode && interactionTarget ? (
          <TouchableOpacity style={styles.interactButton} onPress={beginNpcInteraction}>
            <Text style={styles.interactButtonText}>{interactButtonLabel}</Text>
          </TouchableOpacity>
        ) : null}

        {activeNode ? (
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
              txt={activeNode ? activeNode.txt : ''}
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
      </Animated.View>

      {flashVisible && <View pointerEvents="none" style={styles.flashOverlay} />}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
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
    justifyContent: 'space-between',
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