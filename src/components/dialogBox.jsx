/*
Call this function from index/another page using 
import DialogBox from '../components/DialogBox'

<DialogBox charaname='NPC name here' txt='speech goes here'></DialogBox>
*/

import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
//import Colors from "../constants/Colors";
import { useState, useEffect } from 'react'
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring 
} from 'react-native-reanimated';

const AnimatedText = Animated.createAnimatedComponent(Text);

const DialogBox = ({ style, charaname, txt, ...props }) => {
  //const colorScheme = useColorScheme();
  //const theme = Colors[colorScheme] ?? Colors.light;

const opacity = useSharedValue(0);

const animatedStyle = useAnimatedStyle(() => {
  return {
    opacity: opacity.value,
  };
});

useEffect(() => {
  opacity.value = withTiming(1, { duration: 500 });
}, []);

  // sets invisible on click
  const [visable, setVisable] = useState(true)
    const handlePress = () => {
      setVisable(false)
    }
  
  // only returns if visible 
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
        <AnimatedText style={[animatedStyle]}>{txt}</AnimatedText>
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