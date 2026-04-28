import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Animated,
  Platform,
  Image,
  Alert,
  ImageBackground,
} from 'react-native';
import DialogBox from '../components/DialogBox';
import PlayerChoice from '../components/PlayerChoice';
import PlayerSprite from '../components/PlayerSprite';
import {
  loadGameForProfile,
  saveGameForProfile,
  addCurrency,
  spendCurrency,
} from '../services/profileService';
import characters from '../assets/characters.json';
import scene1Story from '../storyData/scene1.json';
import scene2Story from '../storyData/scene2.json';
import scene1World from '../worldData/scene1World.json';
import scene2World from '../worldData/scene2World.json';
import { getMovementVector, getFacingFromVector } from '../systems/PlayerController';
import { getCameraPosition } from '../systems/CameraController';
import { applyCollision } from '../systems/CollisionSystem';
import { getNearbyNpc, getTouchedExit } from '../systems/InteractionSystem';
import { backgroundMap } from '../assets/backgrounds/backgroundMap';

const PLAYER_SIZE = 64;
const MOVE_SPEED = 4;
const VIEWPORT_WIDTH = 360;
const VIEWPORT_HEIGHT = 260;
const DEFAULT_NODE = 'start';

const PLAYER_SPRITE = require('../assets/images/hare.png');
const FOX_SPRITE = require('../assets/images/fox.png');
const WOLF_SPRITE = require('../assets/images/wolf.png');

const storyMap = {
  scene1: scene1Story,
  scene2: scene2Story,
};

const worldMap = {
  scene1: scene1World,
  scene2: scene2World,
};

const npcSpriteMap = {
  fox: FOX_SPRITE,
  wolf: WOLF_SPRITE,
};

const WorldScene = ({ sceneId, profileId, mode, onGoToMenu, onChangeScene }) => {
  const normalizedSceneId = sceneId?.toLowerCase();
  const storyData = storyMap[normalizedSceneId];
  const worldData = worldMap[normalizedSceneId];

  const [ready, setReady] = useState(false);
  const [currentNode, setCurrentNode] = useState(null);
  const [history, setHistory] = useState([]);
  const [claimedRewards, setClaimedRewards] = useState([]);
  const [playerPos, setPlayerPos] = useState(worldData?.spawn || { x: 100, y: 100 });
  const [cameraPos, setCameraPos] = useState({ x: 0, y: 0 });
  const [facing, setFacing] = useState('down');
  const [flashVisible, setFlashVisible] = useState(false);
  const [interactionTarget, setInteractionTarget] = useState(null);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const autoAdvanceTimeout = useRef(null);
  const animationFrameRef = useRef(null);
  const keysPressed = useRef({ w: false, a: false, s: false, d: false });

  const worldWidth = worldData?.world?.width || 1400;
  const worldHeight = worldData?.world?.height || 900;

  const activeNode = currentNode ? storyData?.[currentNode] : null;

  const npcViews = useMemo(() => {
    return (worldData?.npcs || []).map((npc) => ({
      ...npc,
      sprite: npcSpriteMap[npc.id],
    }));
  }, [worldData]);

  useEffect(() => {
    const setup = async () => {
      if (!storyData || !worldData) {
        setReady(true);
        return;
      }

      const defaultSpawn = worldData.spawn || { x: 100, y: 100 };
      let nextNode = DEFAULT_NODE;
      let nextHistory = [];
      let nextClaimedRewards = [];
      let nextPlayerPos = defaultSpawn;

      if (mode === 'load' && profileId) {
        const savedGame = await loadGameForProfile(profileId);
        if (savedGame?.sceneId === normalizedSceneId) {
          nextNode = savedGame.currentNode ?? nextNode;
          nextHistory = savedGame.history || [];
          nextClaimedRewards = savedGame.claimedRewards || [];
          nextPlayerPos = savedGame.playerPos || defaultSpawn;
        }
      }

      setCurrentNode(nextNode);
      setHistory(nextHistory);
      setClaimedRewards(nextClaimedRewards);
      setPlayerPos(nextPlayerPos);
      setReady(true);
    };

    setup();
  }, [normalizedSceneId, profileId, mode, storyData, worldData]);

  useEffect(() => {
    if (!ready) return;

    const handleKeyDown = (event) => {
      const key = event.key?.toLowerCase();

      if (['w', 'a', 's', 'd'].includes(key)) {
        keysPressed.current[key] = true;
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
  }, [ready]);

  useEffect(() => {
    if (!ready) return;

    const tick = () => {
      if (!currentNode) {
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
  }, [ready, currentNode, worldData, worldWidth, worldHeight, facing]);

  useEffect(() => {
    setCameraPos(
      getCameraPosition({
        playerPos,
        playerSize: PLAYER_SIZE,
        viewportWidth: VIEWPORT_WIDTH,
        viewportHeight: VIEWPORT_HEIGHT,
        worldWidth,
        worldHeight,
      })
    );

    const nearbyNpc = getNearbyNpc({
      playerPos,
      playerSize: PLAYER_SIZE,
      npcs: worldData?.npcs || [],
    });

    setInteractionTarget(nearbyNpc || null);

    const touchedExit = getTouchedExit({
      playerPos,
      playerSize: PLAYER_SIZE,
      exits: worldData?.exits || [],
    });

    if (touchedExit && !currentNode) {
      onChangeScene?.(touchedExit.targetScene);
    }
  }, [playerPos, currentNode, worldData, worldWidth, worldHeight, onChangeScene]);

  useEffect(() => {
    if (!activeNode) return;

    if (autoAdvanceTimeout.current) {
      clearTimeout(autoAdvanceTimeout.current);
      autoAdvanceTimeout.current = null;
    }

    if (activeNode.effect === 'flash') {
      setFlashVisible(true);
      setTimeout(() => setFlashVisible(false), 2000);
    }

    if (activeNode.effect === 'shake') {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
      ]).start();
    }

    if (activeNode.autoAdvance && activeNode.next) {
      const delay = activeNode.effect ? 1600 : 700;
      autoAdvanceTimeout.current = setTimeout(() => {
        handleSelect(activeNode.next);
      }, delay);
    }

    return () => {
      if (autoAdvanceTimeout.current) {
        clearTimeout(autoAdvanceTimeout.current);
        autoAdvanceTimeout.current = null;
      }
    };
  }, [activeNode]);

  useEffect(() => {
    const sync = async () => {
      if (!ready || !profileId) return;

      let updatedClaimedRewards = claimedRewards;

      if (activeNode?.reward && !claimedRewards.includes(currentNode)) {
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
      });
    };

    sync();
  }, [ready, profileId, normalizedSceneId, currentNode, activeNode, history, claimedRewards, playerPos]);

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

  if (!ready || !storyData || !worldData) {
    return <View style={styles.root} />;
  }

  const bgKey = storyData?.metadata?.background || 'default_bg';
  const selectedBg = backgroundMap[bgKey];

  return (
    <View style={styles.root}>
      <ImageBackground 
        source={selectedBg} 
        style={styles.backgroundImage} 
        resizeMode="cover"
      >
      <Animated.View style={[styles.container, { transform: [{ translateX: shakeAnim }] }]}>
        <TouchableOpacity style={styles.topMenuButton} onPress={onGoToMenu}>
          <Text style={styles.topMenuButtonText}>Exit</Text>
        </TouchableOpacity>

        <View style={styles.viewport}>
          <View
            style={[
              styles.world,
              {
                width: worldWidth,
                height: worldHeight,
                transform: [
                  { translateX: -cameraPos.x },
                  { translateY: -cameraPos.y },
                ],
              },
            ]}
          >
            <View style={styles.grass} />
            <View style={styles.pathOne} />
            <View style={styles.pathTwo} />

            {(worldData.colliders || []).map((collider) => (
              <View
                key={collider.id}
                style={[
                  styles.colliderVisual,
                  {
                    left: collider.x,
                    top: collider.y,
                    width: collider.width,
                    height: collider.height,
                  },
                ]}
              />
            ))}

            {npcViews.map((npc) => (
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
                <Image source={npc.sprite} style={styles.npcSprite} resizeMode="contain" />
                <Text style={styles.npcLabel}>{characters[npc.id]?.name || npc.id}</Text>
              </View>
            ))}

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
                  },
                ]}
              />
            ))}

            <PlayerSprite
              x={playerPos.x}
              y={playerPos.y}
              size={PLAYER_SIZE}
              spriteSource={PLAYER_SPRITE}
            />
          </View>
        </View>

        <Text style={styles.hint}>Use W A S D to move</Text>

        <View style={styles.choiceArea}>
          {activeNode?.choices && (
            <PlayerChoice
              choices={activeNode.choices}
              onSelect={(id, label, cost) => handleSelect(id, label, cost)}
            />
          )}
        </View>

        <DialogBox
          characterId={activeNode?.character || 'system'}
          characterData={characters}
          txt={activeNode ? activeNode.txt : ''}
          onPress={
            activeNode && !activeNode.choices && !activeNode.autoAdvance && activeNode.next
              ? () => handleSelect(activeNode.next)
              : null
          }
        />

        {!activeNode && (
          <TouchableOpacity style={styles.menuButton} onPress={onGoToMenu}>
            <Text style={styles.menuButtonText}>Return to Menu</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
      </ImageBackground>

      {flashVisible && <View pointerEvents="none" style={styles.flashOverlay} />}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1b1328',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    // last number is for transparency
    backgroundColor: 'rgba(27, 19, 40, 0.7)',
  },
  topMenuButton: {
    position: 'absolute',
    top: 16,
    right: 20,
    zIndex: 50,
    backgroundColor: '#8b5cf6', 
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#a78bfa',
  },
  topMenuButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  viewport: {
    width: VIEWPORT_WIDTH,
    height: VIEWPORT_HEIGHT,
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#4d3a69',
    backgroundColor: '#cfeeff',
    marginTop: 36,
    marginBottom: 12,
  },
  world: {
    position: 'relative',
  },
  grass: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#d7f0c8',
  },
  pathOne: {
    position: 'absolute',
    left: 120,
    top: 160,
    width: 800,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#d9c49a',
  },
  pathTwo: {
    position: 'absolute',
    left: 620,
    top: 100,
    width: 140,
    height: 500,
    borderRadius: 70,
    backgroundColor: '#d9c49a',
  },
  colliderVisual: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#4d9a58',
    zIndex: 8,
  },
  npcWrap: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 16,
  },
  npcSprite: {
    width: 70,
    height: 70,
  },
  npcLabel: {
    marginTop: 2,
    fontWeight: '700',
    color: '#2a1e3b',
  },
  exitVisual: {
    position: 'absolute',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#7a4fe0',
    backgroundColor: 'rgba(122,79,224,0.08)',
  },
  hint: {
    color: '#f6f0ff',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '700',
  },
  choiceArea: {
    minHeight: 95,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#a78bfa',
  },
  menuButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'white',
    opacity: 0.95,
  },
});
export default WorldScene;