import { Pressable, Text, View, StyleSheet } from 'react-native';

const PlayerChoice = ({ choices, onSelect }) => {
  return (
    <View style={styles.container}>
      {choices.map((choice, index) => (
        <Pressable 
          key={index} 
          style={styles.button} 
          // Pass both choice.next AND choice.label
          onPress={() => onSelect(choice.next, choice.label)}
        >
          <Text style={styles.buttonText}>{choice.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default PlayerChoice;

const styles = StyleSheet.create({
    container: {
      
      //padding: 10,
      //minWidth: 280,
      //maxWidth: 1000,
      //borderRadius: 8,
      //borderColor: "red",
      //alignItems: "center",

      //position: 'absolute',
      //bottom: 120,   
      marginTop: 20,       
      alignSelf: 'center', 
      width: '100%',
      alignItems: "center",
      zIndex: 10,
    },
    button: {
      paddingVertical: 15, 
      paddingHorizontal: 20,
      marginVertical: 6,
      width: 280, 
      borderRadius: 14, 
      backgroundColor: '#8b5cf6', 
      borderWidth: 1,
      borderColor: '#a78bfa', 
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 6,
    },
    buttonText: {
      fontWeight: "800", 
      fontSize: 15,
      textAlign: 'center',
      color: "#fff",
    },
});