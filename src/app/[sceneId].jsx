import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DialogBox from '../components/DialogBox';
import PlayerChoice from '../components/PlayerChoice'; 
import { loadGameForProfile, saveGameForProfile } from '../services/profileService';
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
  
  // 📜 This stores the list of choices
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
          setHistory(savedGame.history || []); // Load existing history
        }
      }
      setReady(true);
    };
    setupScene();
  }, [sceneId, selectedProfileId]);

  // ☁️ Automatically syncs to MongoDB whenever currentNode or history changes
  useEffect(() => {
    if (!ready || !selectedProfileId || !currentSceneData?.[currentNode]) return;

    saveGameForProfile(selectedProfileId, {
      sceneId: sceneId,
      currentNode,
      history: history, // This sends the array to Atlas
    });
  }, [currentNode, ready, history]);

  const handleSelect = (nextNodeID, choiceLabel = null) => {
    // 📝 If a button was clicked, add its text to history
    if (choiceLabel) {
      setHistory(prev => [...prev, choiceLabel]);
    }

    if (currentSceneData[nextNodeID]) {
      setCurrentNode(nextNodeID);
    } else if (sceneMap[nextNodeID]) {
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
      <DialogBox 
        characterId={data.character || "system"} 
        characterData={characterList}
        txt={data.txt} 
        onPress={!data.choices ? () => handleSelect(data.next) : null} 
      />

      {data.choices && (
        <PlayerChoice 
          choices={data.choices} 
          // 📢 Pass BOTH id and label back to handleSelect
          onSelect={(id, label) => handleSelect(id, label)} 
        />
      )}
      
      {( !data.choices && !data.next) && (
        <TouchableOpacity style={styles.menuButton} onPress={goToMainMenu}>
          <Text style={styles.menuButtonText}>Go to Main Menu</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#fff' },
  menuButton: { padding: 15, backgroundColor: '#7a4fe0', borderRadius: 8, marginTop: 20 },
  menuButtonText: { color: 'white', textAlign: 'center', fontWeight: 'bold' }
});

export default SceneTemplate;

