import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DialogBox from '../components/DialogBox';
import PlayerChoice from '../components/PlayerChoice'; 
import { loadGameForProfile, saveGameForProfile, addCurrency, spendCurrency } from '../services/profileService';
import characterList from '../assets/characters.json';

const DEFAULT_NODE = 'start';
const sceneMap = {
  scene1: require('../assets/scene1.json'),
  scene2: require('../assets/scene2.json'),
};

const SceneTemplate = () => {
  const router = useRouter();
  const { profileId, mode, sceneId } = useLocalSearchParams();
  const selectedProfileId = Array.isArray(profileId) ? profileId[0] : profileId;

  const currentSceneData = sceneMap[sceneId?.toLowerCase()];
  const [currentNode, setCurrentNode] = useState(DEFAULT_NODE);
  const [ready, setReady] = useState(false);
  const [history, setHistory] = useState([]);

  // Added async and currency reward for finishing the scene
  const goToMainMenu = async () => {
    if (selectedProfileId) {
      await addCurrency(selectedProfileId, 100);
    }
    router.replace({ pathname: '/menu', params: { profileId: selectedProfileId } });
  };

  useEffect(() => {
    const setupScene = async () => {
      if (!currentSceneData) { setReady(true); return; }

      if (mode === 'load' && selectedProfileId) {
        const savedGame = await loadGameForProfile(selectedProfileId);
        if (savedGame?.sceneId === sceneId && currentSceneData[savedGame.currentNode]) {
          setCurrentNode(savedGame.currentNode);
          setHistory(savedGame.history || []);
        }
      }
      setReady(true);
    };
    setupScene();
  }, [sceneId, selectedProfileId]);

  useEffect(() => {
    if (!ready || !selectedProfileId || !currentSceneData?.[currentNode]) return;

    saveGameForProfile(selectedProfileId, {
      sceneId: sceneId,
      currentNode,
      history: history,
    });

    const nodeData = currentSceneData[currentNode];
    if (nodeData.reward) {
      addCurrency(selectedProfileId, nodeData.reward);
    }
  }, [currentNode, ready, history]);

  const handleSelect = async (nextNodeID, choiceLabel = null, cost = 0) => {
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
      // Reward for transitioning from one scene file to another
      await addCurrency(selectedProfileId, 100);
      
      router.push({
        pathname: `/${nextNodeID}`,
        params: { profileId: selectedProfileId, mode: 'new' }
      });
    }
  };

  if (!ready || !currentSceneData) return <View style={styles.container} />;

  const data = currentSceneData[currentNode];

  return (
    <View style={styles.container}>
      <View style={{ height: 180, justifyContent: 'center', alignItems: 'center' }}>
      {data.choices && (
        <PlayerChoice 
          choices={data.choices} 
          onSelect={(id, label, cost) => handleSelect(id, label, cost)} 
        />
      )}
     </View>

     <DialogBox 
        characterId={data.character || "system"} 
        characterData={characterList}
        txt={data.txt} 
        onPress={!data.choices ? () => handleSelect(data.next) : null} 
      />
      
      {( !data.choices && !data.next) && (
        <TouchableOpacity style={styles.menuButton} onPress={goToMainMenu}>
          <Text style={styles.menuButtonText}>Finish & Exit (+100 💰)</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    padding: 20, 
    justifyContent: 'flex-end',
    paddingBottom: 50, 
    backgroundColor: '#fff' 
  },
  menuButton: {
    padding: 15,
    backgroundColor: '#7a4fe0',
    borderRadius: 8, 
    marginTop: 20 
  },
  menuButtonText: { 
    color: 'white', 
    textAlign: 'center', 
    fontWeight: 'bold' 
  }
});

export default SceneTemplate;

