import React, { useState } from 'react';
import { View } from 'react-native';
import DialogBox from '../components/DialogBox';

const storyScript = [
  { name: "NPCname", txt: "hello" },
  { name: "NPCname", txt: "second line" },
  { name: "NPCname", txt: "longer third line of text" }
];

const Scene1 = () => {
  const [currentLine, setCurrentLine] = useState(0);

  const handleNext = () => {
    if (currentLine < storyScript.length - 1) {
      setCurrentLine(currentLine + 1);
    } else {
      console.log("scene end");
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center' }}>
      <DialogBox 
        charaname={storyScript[currentLine].name} 
        txt={storyScript[currentLine].txt} 
        onPress={handleNext} 
      />
    </View>
  );
}

export default Scene1