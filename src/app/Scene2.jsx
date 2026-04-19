import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DialogBox from '../components/DialogBox';
import PlayerChoice from '../components/PlayerChoice'; 
import scene2 from '../assets/scene2.json';
import { loadGameForProfile, saveGameForProfile } from '../services/profileService';
import characterList from '../assets/characters.json';

const DEFAULT_NODE = 'start';

const Scene2 = () => {
  const router = useRouter();
  const { profileId, mode } = useLocalSearchParams();
  const selectedProfileId = Array.isArray(profileId) ? profileId[0] : profileId;

  const [currentNode, setCurrentNode] = useState(DEFAULT_NODE);
  const [ready, setReady] = useState(false);

    useEffect(() => {
    const setupScene = async () => {
      if (!selectedProfileId) {
        setReady(true);
        return;
      }

      if (mode === 'load') {
        const savedGame = await loadGameForProfile(selectedProfileId);

        if (savedGame?.sceneId === 'Scene2' && scene2[savedGame.currentNode]) {
          setCurrentNode(savedGame.currentNode);
        } else {
          setCurrentNode(DEFAULT_NODE);
        }
      } else {
        setCurrentNode(DEFAULT_NODE);
      }

      setReady(true);
    };

    setupScene();
  }, [selectedProfileId, mode]);

  useEffect(() => {
    if (!ready || !selectedProfileId || !scene2[currentNode]) return;

    saveGameForProfile(selectedProfileId, {
      sceneId: 'Scene2',
      currentNode,
    });
  }, [currentNode, ready, selectedProfileId]);

  if (!ready) {
    return <View style={styles.container} />;
  }

  const data = scene2[currentNode];

  // error if json doesn't exist
  if (!data) {
  return (
    <View style={styles.container}>
      <DialogBox 
        characterId="error" // Hardcoded to "error"
        characterData={characterList}
        txt={`Node "${currentNode}" not found.`} 
        onPress={goToMainMenu} 
      />
    </View>
  );
}

  const handleSelect = (nextNodeID) => {
    // check if next node exists before updating
    if (scene2[nextNodeID]) {
      setCurrentNode(nextNodeID);
    } else {
      console.warn(`Attempted to navigate to non-existent node: ${nextNodeID}`);
    }
  };

const goToMainMenu = () => {
    router.replace({
      pathname: '/menu',
      params: { profileId: selectedProfileId },
    });
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
        <TouchableOpacity style = {styles.menuButton} onPress={goToMainMenu}>
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
    flexWrap: 'true',
  },
});

export default Scene2;