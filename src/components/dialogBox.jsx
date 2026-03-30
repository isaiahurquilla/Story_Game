/*
Call this function from index/another page using 
import DialogBox from '../components/DialogBox'

<DialogBox charaname='NPC name here' txt='speech goes here'></DialogBox>
*/

import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
//import Colors from "../constants/Colors";
import { useState } from 'react'


const DialogBox = ({ style, charaname, txt, ...props }) => {
  //const colorScheme = useColorScheme();
  //const theme = Colors[colorScheme] ?? Colors.light;

  const [visable, setVisable] = useState(true)
    const handlePress = () => {
      setVisable(false)
    }
  
  if (!visable) {
    return null;
  }
  return (
    <View style={{ alignItems: 'center', marginBottom: 20 }}>
      <Pressable onPress={handlePress}>
      <Text style={styles.heading}>
        {charaname}
      </Text>
      <View 
        style={[
          styles.card, 
          style
        ]}
        {...props}
      >
        <Text>{txt}</Text>
      </View>
      </Pressable>
    </View>
  );
};

export default DialogBox;

const styles = StyleSheet.create({
    card: {
      padding: 20,
      minWidth: 280,
      maxWidth: 320,
      borderRadius: 8,
      backgroundColor: '#dba5e3' ,
      shadowColor: '#483d50',
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 5,
    },
    heading: {
      fontWeight: "bold", 
      fontSize: 24,
      textAlign: 'left',
      alignItems: 'left',
      marginBottom: 10,
      color: "black",
      
    },
});