import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DialogBox from '../components/DialogBox';
import PlayerChoice from '../components/PlayerChoice'; 
import { loadGameForProfile, saveGameForProfile } from '../services/profileService';
import characterList from '../assets/characters.json';

const DEFAULT_NODE = 'start';
// ------------
// sceneMap, UPDATE WHEN ADDING MORE SCENES Registry of all scenes
// ------------
const sceneMap = {
  scene2: require('../assets/scene2.json'),
  scene3: require('../assets/scene3.json'),
};

const SceneTemplate = () => {
  const router = useRouter();
  const { profileId, mode, sceneId } = useLocalSearchParams();
  const selectedProfileId = Array.isArray(profileId) ? profileId[0] : profileId;

  // 1. Get the JSON data for the current scene
  const currentSceneData = sceneMap[sceneId?.toLowerCase()];

  const [currentNode, setCurrentNode] = useState(DEFAULT_NODE);
  const [ready, setReady] = useState(false);

  const goToMainMenu = () => {
    router.replace({
      pathname: '/menu',
      params: { profileId: selectedProfileId },
    });
  };

  useEffect(() => {
    const setupScene = async () => {
      if (!currentSceneData) {
        setReady(true);
        return;
      }

      if (mode === 'load' && selectedProfileId) {
        const savedGame = await loadGameForProfile(selectedProfileId);
        // Only load if the saved sceneId matches the one we are currently in
        if (savedGame?.sceneId === sceneId && currentSceneData[savedGame.currentNode]) {
          setCurrentNode(savedGame.currentNode);
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
    });
  }, [currentNode, ready]);


  // A. Check if the component is still loading state
  if (!ready) {
    return <View style={styles.container} />;
  }

  if (!currentSceneData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Scene "{sceneId}" not found.</Text>
        <TouchableOpacity onPress={goToMainMenu} style={styles.menuButton}>
          <Text style={styles.menuButtonText}>Return to Menu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const data = currentSceneData[currentNode];

  if (!data) {
    return (
      <View style={styles.container}>
        <DialogBox 
          characterId="error" 
          characterData={characterList}
          txt={`Node "${currentNode}" not found in ${sceneId}.`} 
          onPress={goToMainMenu} 
        />
      </View>
    );
  }

  const handleSelect = (nextNodeID) => {
  // 1. Check if the next node is in current file
    if (currentSceneData[nextNodeID]) {
      setCurrentNode(nextNodeID);
   } 
  // 2. If not, check if it's a key in sceneMap
    else if (sceneMap[nextNodeID]) {
      console.log(`Transitioning from ${sceneId} to ${nextNodeID}`);
    
      router.push({
        pathname: `/${nextNodeID}`, // Navigates 
        params: { 
          profileId: selectedProfileId, 
          mode: 'new' // Start the new scene from the 'start' node
        }
      });
    } 
    else {
      console.warn(`Path not found: ${nextNodeID}`);
    }
  };

  const isSceneOver = !data.choices && !data.next;

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
          onSelect={handleSelect} 
        />
      )}
      
      {isSceneOver && (
        <TouchableOpacity style={styles.menuButton} onPress={goToMainMenu}>
          <Text style={styles.menuButtonText}>Go to Main Menu</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff'
  },
  errorText: {
    textAlign: 'center',
    fontSize: 18,
    color: 'red',
    marginBottom: 20
  },
  menuButton: {
    padding: 15,
    backgroundColor: '#7a4fe0',
    borderRadius: 8,
  },
  menuButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold'
  }
});

export default SceneTemplate;