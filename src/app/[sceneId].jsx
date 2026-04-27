import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DialogBox from '../components/DialogBox';
import PlayerChoice from '../components/PlayerChoice';
import PlayerSprite from '../components/PlayerSprite';
import SceneHotspots, { isColliding } from '../components/SceneHotspots';
import {
  loadGameForProfile,
  saveGameForProfile,
  addCurrency,
  spendCurrency,
} from '../services/profileService';
import characterList from '../assets/characters.json';

const DEFAULT_NODE = 'start';
const PLAYER_SIZE = 56;
const MOVE_SPEED = 4;

const VIEWPORT_WIDTH = 360;
const VIEWPORT_HEIGHT = 260;

const WORLD_WIDTH = 1200;
const WORLD_HEIGHT = 900;

const sceneMap = {
  scene1: require('../assets/scene1.json'),
  scene2: require('../assets/scene2.json'),
};

const sceneHotspotMap = {
  scene1: [
    { id: 'fox-zone', x: 420, y: 260, width: 100, height: 100, actionType: 'node', target: 'start', once: true },
    { id: 'exit-door', x: 980, y: 340, width: 80, height: 120, actionType: 'scene', target: 'scene2' },
  ],
  scene2: [],
};

const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

const SceneTemplate = () => {
  const router = useRouter();
  const { profileId, mode, sceneId } = useLocalSearchParams();
  const selectedProfileId = Array.isArray(profileId) ? profileId[0] : profileId;
  const normalizedSceneId = sceneId?.toLowerCase();

  const currentSceneData = sceneMap[normalizedSceneId];
  const hotspots = sceneHotspotMap[normalizedSceneId] || [];

  const [currentNode, setCurrentNode] = useState(DEFAULT_NODE);
  const [ready, setReady] = useState(false);
  const [history, setHistory] = useState([]);
  const [claimedRewards, setClaimedRewards] = useState([]);
  const [triggeredHotspots, setTriggeredHotspots] = useState([]);
  const [flashVisible, setFlashVisible] = useState(false);

  const [playerPos, setPlayerPos] = useState({ x: 120, y: 220 });
  const [cameraPos, setCameraPos] = useState({ x: 0, y: 0 });
  const [facing, setFacing] = useState('down');

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const autoAdvanceTimeout = useRef(null);
  const animationFrameRef = useRef(null);

  const keysPressed = useRef({
    w: false,
    a: false,
    s: false,
    d: false,
  });

  const goToMainMenu = () => {
    router.replace({ pathname: '/menu', params: { profileId: selectedProfileId } });
  };

  useEffect(() => {
    const setupScene = async () => {
      if (!currentSceneData) {
        setReady(true);
        return;
      }

      if (mode === 'load' && selectedProfileId) {
        const savedGame = await loadGameForProfile(selectedProfileId);

        if (savedGame?.sceneId === sceneId && currentSceneData[savedGame.currentNode]) {
          setCurrentNode(savedGame.currentNode);
          setHistory(savedGame.history || []);
          setClaimedRewards(savedGame.claimedRewards || []);
          setTriggeredHotspots(savedGame.triggeredHotspots || []);
          setPlayerPos(savedGame.playerPos || { x: 120, y: 220 });
        }
      }

      setReady(true);
    };

    setupScene();
  }, [sceneId, selectedProfileId, mode, currentSceneData]);

  useEffect(() => {
    if (!ready || !selectedProfileId || !currentSceneData?.[currentNode]) return;

    const syncScene = async () => {
      const nodeData = currentSceneData[currentNode];
      let updatedClaimedRewards = claimedRewards;

      if (nodeData.reward && !claimedRewards.includes(currentNode)) {
        await addCurrency(selectedProfileId, nodeData.reward);
        updatedClaimedRewards = [...claimedRewards, currentNode];
        setClaimedRewards(updatedClaimedRewards);
      }

      await saveGameForProfile(selectedProfileId, {
        sceneId,
        currentNode,
        history,
        claimedRewards: updatedClaimedRewards,
        triggeredHotspots,
        playerPos,
      });
    };

    syncScene();
  }, [currentNode, ready, history, claimedRewards, triggeredHotspots, playerPos, selectedProfileId, sceneId, currentSceneData]);

  useEffect(() => {
    if (!ready || !currentSceneData?.[currentNode]) return;

    const node = currentSceneData[currentNode];

    if (autoAdvanceTimeout.current) {
      clearTimeout(autoAdvanceTimeout.current);
      autoAdvanceTimeout.current = null;
    }

    if (node.effect === 'flash') {
      setFlashVisible(true);
      setTimeout(() => setFlashVisible(false), 2000);
    }

    if (node.effect === 'shake') {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
      ]).start();
    }

    if (node.autoAdvance && node.next) {
      const delay = node.effect === 'flash' || node.effect === 'shake' ? 2000 : 600;
      autoAdvanceTimeout.current = setTimeout(() => {
        handleSelect(node.next);
      }, delay);
    }

    return () => {
      if (autoAdvanceTimeout.current) clearTimeout(autoAdvanceTimeout.current);
    };
  }, [currentNode, ready, currentSceneData]);

  const handleSelect = async (nextNodeID, choiceLabel = null, cost = 0) => {
    if (!nextNodeID) return;

    if (cost > 0) {
      const canAfford = await spendCurrency(selectedProfileId, cost);
      if (!canAfford) {
        Alert.alert('Insufficient Currency', "You don't have enough to make this choice.");
        return;
      }
    }

    if (choiceLabel) {
      setHistory((prev) => [...prev, choiceLabel]);
    }

    if (currentSceneData?.[nextNodeID]) {
      setCurrentNode(nextNodeID);
    } else if (sceneMap[nextNodeID]) {
      await addCurrency(selectedProfileId, 100);
      router.push({
        pathname: `/${nextNodeID}`,
        params: { profileId: selectedProfileId, mode: 'new' },
      });
    }
  };

  const handleHotspotAction = async (hotspot) => {
    if (!hotspot) return;
    if (hotspot.once && triggeredHotspots.includes(hotspot.id)) return;

    if (hotspot.once) {
      setTriggeredHotspots((prev) => [...prev, hotspot.id]);
    }

    if (hotspot.actionType === 'node') {
      handleSelect(hotspot.target);
      return;
    }

    if (hotspot.actionType === 'scene') {
      await addCurrency(selectedProfileId, 100);
      router.push({
        pathname: `/${hotspot.target}`,
        params: { profileId: selectedProfileId, mode: 'new' },
      });
    }
  };

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    const tick = () => {
      setPlayerPos((prev) => {
        let dx = 0;
        let dy = 0;

        if (keysPressed.current.w) dy -= MOVE_SPEED;
        if (keysPressed.current.s) dy += MOVE_SPEED;
        if (keysPressed.current.a) dx -= MOVE_SPEED;
        if (keysPressed.current.d) dx += MOVE_SPEED;

        if (dx === 0 && dy === 0) return prev;

        if (Math.abs(dx) > Math.abs(dy)) {
          setFacing(dx > 0 ? 'right' : 'left');
        } else {
          setFacing(dy > 0 ? 'down' : 'up');
        }

        const next = {
          x: clamp(prev.x + dx, 0, WORLD_WIDTH - PLAYER_SIZE),
          y: clamp(prev.y + dy, 0, WORLD_HEIGHT - PLAYER_SIZE),
        };

        return next;
      });

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  useEffect(() => {
  const targetCameraX = clamp(
    playerPos.x - VIEWPORT_WIDTH / 2 + PLAYER_SIZE / 2,
    0,
    WORLD_WIDTH - VIEWPORT_WIDTH
  );

  const targetCameraY = clamp(
    playerPos.y - VIEWPORT_HEIGHT * 0.65,
    0,
    WORLD_HEIGHT - VIEWPORT_HEIGHT
  );

  setCameraPos({
    x: targetCameraX,
    y: targetCameraY,
  });
}, [playerPos]);

  useEffect(() => {
    const playerBounds = {
      x: playerPos.x,
      y: playerPos.y,
      width: PLAYER_SIZE,
      height: PLAYER_SIZE,
    };

    for (const hotspot of hotspots) {
      if (hotspot.once && triggeredHotspots.includes(hotspot.id)) continue;

      if (isColliding(playerBounds, hotspot)) {
        handleHotspotAction(hotspot);
        break;
      }
    }
  }, [playerPos, hotspots, triggeredHotspots]);

  if (!ready || !currentSceneData) {
    return <View style={styles.container} />;
  }

  const data = currentSceneData[currentNode];

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.container, { transform: [{ translateX: shakeAnim }] }]}>
        <View style={styles.viewport}>
          <View
            style={[
              styles.world,
              {
                width: WORLD_WIDTH,
                height: WORLD_HEIGHT,
                transform: [
                  { translateX: -cameraPos.x },
                  { translateY: -cameraPos.y },
                ],
              },
            ]}
          >
            <View style={styles.backgroundLayer} />

            <SceneHotspots
              hotspots={hotspots}
              onHotspotPress={handleHotspotAction}
              debug={false}
            />

             <View
               style={[
                 styles.npcBox,
                 { left: 430, top: 250 },
               ]}
              >
              <Text style={styles.npcText}>Fox</Text>
            </View>

            <PlayerSprite
            x={playerPos.x}
            y={playerPos.y}
            size={PLAYER_SIZE}
            facing={facing}
            />
          </View>
        </View>

        <Text style={styles.hint}>Use W A S D to move</Text>

        <View style={styles.choiceArea}>
          {data.choices && (
            <PlayerChoice
              choices={data.choices}
              onSelect={(id, label, cost) => handleSelect(id, label, cost)}
            />
          )}
        </View>

        <DialogBox
          characterId={data.character || 'system'}
          characterData={characterList}
          txt={data.txt}
          onPress={!data.choices && !data.autoAdvance && data.next ? () => handleSelect(data.next) : null}
        />

        {!data.choices && !data.next && (
          <TouchableOpacity style={styles.menuButton} onPress={goToMainMenu}>
            <Text style={styles.menuButtonText}>Finish & Exit</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {flashVisible && <View pointerEvents="none" style={styles.flashOverlay} />}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    backgroundColor: '#fff',
  },
  viewport: {
    width: VIEWPORT_WIDTH,
    height: VIEWPORT_HEIGHT,
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#89b9d6',
    backgroundColor: '#cfeeff',
    marginBottom: 12,
  },
  world: {
    position: 'relative',
  },
  backgroundLayer: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#cfeeff',
  },
  npcBox: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 14,
    backgroundColor: '#f5a623',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 12,
  },
  npcText: {
    fontWeight: '700',
  },
  hint: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  choiceArea: {
    minHeight: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'white',
    opacity: 0.95,
  },
  menuButton: {
    padding: 15,
    backgroundColor: '#7a4fe0',
    borderRadius: 8,
    marginTop: 20,
  },
  menuButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default SceneTemplate;