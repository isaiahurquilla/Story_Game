import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DialogBox from '../components/DialogBox';
import PlayerChoice from '../components/PlayerChoice'; 
import { loadGameForProfile, saveGameForProfile, addCurrency, spendCurrency } from '../services/profileService'; // 💰 Added currency imports
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

  const goToMainMenu = () => {
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

    // 💰 REWARD CHECK: If the current node has a reward, give it to the player
    const nodeData = currentSceneData[currentNode];
    if (nodeData.reward) {
      addCurrency(selectedProfileId, nodeData.reward);
    }
  }, [currentNode, ready, history]);

  const handleSelect = async (nextNodeID, choiceLabel = null, cost = 0) => {
    // 💰 COST CHECK: If the choice costs money, try to spend it
    if (cost > 0) {
      const canAfford = await spendCurrency(selectedProfileId, cost);
      if (!canAfford) {
        Alert.alert("Insufficient Currency", "You don't have enough to make this choice.");
        return; // Stop the transition
      }
    }

    if (choiceLabel) {
      setHistory(prev => [...prev, choiceLabel]);
    }

    if (currentSceneData[nextNodeID]) {
      setCurrentNode(nextNodeID);
    } else if (sceneMap[nextNodeID]) {
      // 💰 SCENE COMPLETION REWARD: Give 100 currency for finishing a scene
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
      {/* 🪙 Optional: You could add your CurrencyDisplay component here too! */}
      
      <DialogBox 
        characterId={data.character || "system"} 
        characterData={characterList}
        txt={data.txt} 
        onPress={!data.choices ? () => handleSelect(data.next) : null} 
      />

      <View style={{ height: 180, justifyContent: 'center', alignItems: 'center', marginTop: 20 }}> 
      {data.choices && (
        <PlayerChoice 
          choices={data.choices} 
          // passing choice.cost if it exists in the JSON
          onSelect={(id, label, cost) => handleSelect(id, label, cost)} 
        />
      )}
     {/* </View> */}

      {( !data.choices && !data.next) && (
        <TouchableOpacity style={styles.menuButton} onPress={goToMainMenu}>
          <Text style={styles.menuButtonText}>Finish & Exit</Text>
        </TouchableOpacity>
      )}
      </View> 

    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    padding: 20, 
    justifyContent: 'flex-end',
    paddingBottom: 60, 
    backgroundColor: '#1b1328' 
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
