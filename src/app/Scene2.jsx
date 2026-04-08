import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import DialogBox from '../components/DialogBox';
import PlayerChoice from '../components/PlayerChoice'; 
import scene2 from '../assets/scene2.json';

const Scene2 = () => {
  const [currentNode, setCurrentNode] = useState("start");
  const data = scene2[currentNode];

  // error if json doesn't exist
  if (!data) {
    return (
      <View style={styles.container}>
        <DialogBox charaname="Error" txt={`Node "${currentNode}" not found in JSON.`} />
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

  return (
    <View style={styles.container}>
      <DialogBox 
        charaname={data.character || "System"} 
        txt={data.txt} 
        onPress={!data.choices ? () => handleSelect(data.next) : null} 
      />

      {data.choices && (
        <PlayerChoice 
          choices={data.choices} 
          onSelect={handleSelect} 
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    flexWrap: true,
  },
});

export default Scene2;