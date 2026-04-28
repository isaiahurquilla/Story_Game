import React, { useEffect, useRef, useState } from 'react';
import { ImageBackground, View, StyleSheet, TouchableOpacity, Text, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DialogBox from '../components/DialogBox';
import PlayerChoice from '../components/PlayerChoice';
import PlayerSprite from '../components/PlayerSprite';
import { loadGameForProfile, saveGameForProfile, addCurrency, spendCurrency } from '../services/profileService';
import characterList from '../assets/characters.json';
import { backgroundMap } from '../assets/backgrounds';

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

const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

const SceneTemplate = () => {
  const router = useRouter();
  const { profileId, mode, sceneId } = useLocalSearchParams();
  const selectedProfileId = Array.isArray(profileId) ? profileId[0] : profileId;

  const currentSceneData = sceneMap[sceneId?.toLowerCase()];
  const [currentNode, setCurrentNode] = useState(DEFAULT_NODE);
  const [ready, setReady] = useState(false);
  const [history, setHistory] = useState([]);

  const [playerPos, setPlayerPos] = useState({ x: 120, y: 220 });
  const [cameraPos, setCameraPos] = useState({ x: 0, y: 0 });
  const [facing, setFacing] = useState('down');

  const keysPressed = useRef({ w: false, a: false, s: false, d: false });
  const animationFrameRef = useRef(null);

  const goToMainMenu = async () => {
    if (selectedProfileId) {
      await addCurrency(selectedProfileId, 100);
    }
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
          setPlayerPos(savedGame.playerPos || { x: 120, y: 220 });
        }
      }

      setReady(true);
    };

    setupScene();
  }, [sceneId, selectedProfileId, mode, currentSceneData]);

  useEffect(() => {
    if (!ready || !selectedProfileId || !currentSceneData?.[currentNode]) return;

    saveGameForProfile(selectedProfileId, {
      sceneId,
      currentNode,
      history,
      playerPos,
    });

    const nodeData = currentSceneData[currentNode];
    if (nodeData.reward) {
      addCurrency(selectedProfileId, nodeData.reward);
    }
  }, [currentNode, ready, history, playerPos, selectedProfileId, sceneId, currentSceneData]);

  const handleSelect = async (nextNodeID, choiceLabel = null, cost = 0) => {
    if (!nextNodeID) return;

    if (cost > 0) {
      const canAfford = await spendCurrency(selectedProfileId, cost);
      if (!canAfford) {
        Alert.alert("Insufficient Currency", "You don't have enough to make this choice.");
        return;
      }
    }

    if (choiceLabel) {
      setHistory(prev => [...prev, choiceLabel]);
    }

    if (currentSceneData[nextNodeID]) {
      setCurrentNode(nextNodeID);
    } else if (sceneMap[nextNodeID]) {
      await addCurrency(selectedProfileId, 100);

      router.push({
        pathname: `/${nextNodeID}`,
        params: { profileId: selectedProfileId, mode: 'new' }
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
      setPlayerPos(prev => {
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

        return {
          x: clamp(prev.x + dx, 0, WORLD_WIDTH - PLAYER_SIZE),
          y: clamp(prev.y + dy, 0, WORLD_HEIGHT - PLAYER_SIZE),
        };
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

  if (!ready || !currentSceneData) return <View style={styles.container} />;

  const data = currentSceneData[currentNode];

  //get the background image
  const bgKey = currentSceneData.metadata?.background || 'default_bg';
  const selectedBg = backgroundMap[bgKey];

  return (
    <ImageBackground source={selectedBg} 
      style={styles.background} // The background fills the container
      resizeMode="cover"
    >
    <View style={styles.overlay}>
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

          <PlayerSprite
            x={playerPos.x}
            y={playerPos.y}
            size={PLAYER_SIZE}
            facing={facing}
          />
        </View>
      </View>

      <Text style={styles.hint}>Use W A S D to move</Text>

      <View style={styles.choiceWrap}>
        {data.choices && (
          <PlayerChoice
            choices={data.choices}
            onSelect={(id, label, cost) => handleSelect(id, label, cost)}
          />
        )}

        {!data.choices && !data.next && (
          <TouchableOpacity style={styles.menuButton} onPress={goToMainMenu}>
            <Text style={styles.menuButtonText}>Finish & Exit (+100 💰)</Text>
          </TouchableOpacity>
        )}
      </View>

      <DialogBox
        characterId={data.character || "system"}
        characterData={characterList}
        txt={data.txt}
        onPress={!data.choices ? () => handleSelect(data.next) : null}
      />
    </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  //container: {
    //flex: 1,
    //padding: 20,
    //paddingBottom: 60,
    //backgroundColor: '#1b1328',
  //},
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    padding: 20,
    paddingBottom: 60,
    backgroundColor: 'rgba(27, 19, 40, 0.7)', // Deep purple tint
    justifyContent: 'flex-end',
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
    marginTop: 20,
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
  hint: {
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },
  choiceWrap: {
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
  }
});

export default SceneTemplate;