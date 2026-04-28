/*
Call this function from index/another page using 
import DialogBox from '../components/DialogBox'

<DialogBox charaname='NPC name here' txt='speech goes here'></DialogBox>
*/

import { Pressable, StyleSheet, Text, View, Image, useColorScheme } from 'react-native';
//import Colors from "../constants/Colors";
import { useState, useEffect } from 'react'
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring 
} from 'react-native-reanimated';

const AnimatedText = Animated.createAnimatedComponent(Text);

const imageMap = {
  "fox_image": require('../assets/images/fox.png'),
  "wolf_image": require('../assets/images/wolf.png'),
  "hare_image": require('../assets/images/hare.png'),
};

const DialogBox = ({ style, characterId, characterData, txt, speed = 60, onPress, ...props }) => {
  //const colorScheme = useColorScheme();
  //const theme = Colors[colorScheme] ?? Colors.light;
const speaker = characterData[characterId] || { name: "???", portrait: null };
const opacity = useSharedValue(0);

const animatedStyle = useAnimatedStyle(() => {
  return {
    opacity: opacity.value,
  };
});

const [displayedText, setDisplayedText] = useState('');
const [currentIndex, setCurrentIndex] = useState(0);


useEffect(() => {
  opacity.value = withTiming(1, { duration: 1000 });
  if (currentIndex < txt.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + txt[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);

      return () => clearTimeout(timeout); 
    }
  }, [currentIndex, speed]);

useEffect(() => {
  setDisplayedText('');
  setCurrentIndex(0);
}, [txt]);

  // sets invisible on click
  const [visable, setVisable] = useState(true)

  const handlePress = () => {
  // skip to end if text is still displaying
  if (currentIndex < txt.length) {
    setDisplayedText(txt);
    setCurrentIndex(txt.length);
  } else {
    // If text is finished, tell the parent to move to the next box
    if (onPress) onPress(); 
  }
};
  
  // only returns if visible 
  if (!visable) {
    return null;
  }
  return (
    <View style={{ alignItems: 'center', marginBottom: 20 }}>
      
      <View style={styles.portraitContainer}>
        {speaker.portrait ? (
          <Image source={imageMap[speaker.portrait]} style={styles.portrait} />
        ) : (
          <View style={styles.portraitPlaceholder} /> 
        )}
      </View>

      <Pressable onPress={handlePress}>
      <Text style={styles.heading}>
        {speaker.name}
      </Text>
      <View 
        style={[
          styles.card, 
          style
        ]}
        {...props}
      >
        <AnimatedText style={[animatedStyle]}>{displayedText}</AnimatedText>
      </View>
      </Pressable>
    </View>
  );
};

export default DialogBox;

const styles = StyleSheet.create({
    portraitContainer: {
      width: 64,
      height: 64,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
    },
    portrait: {
      width: 64,
      height: 64,
      marginBottom: 10,
      borderWidth: 2,
      borderColor: '#4d3a69',
      borderRadius: 32, //circle
      backgroundColor: '#8b5cf6', // Helps see if box is there
    },
    card: {
      padding: 20,
      height: 150,
      width: 350,
      //minWidth: 280,
      //maxWidth: 320,
      borderRadius: 18,
      //backgroundColor: '#2a1e3b',
      backgroundColor: '#8b5cf6',
      borderWidth: 1,
      borderColor: '#4d3a69',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
    heading: {
      fontWeight: '800', 
      fontSize: 22,
      textAlign: 'left',
      marginBottom: 10,
      color: '#f6f0ff', 
    },
    bodyText: {
      color: '#d7caeb', 
      fontSize: 15,
    }
});