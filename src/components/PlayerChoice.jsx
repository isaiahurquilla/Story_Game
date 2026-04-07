import { Pressable, Text, View, StyleSheet } from 'react-native';

const PlayerChoice = ({ choices, onSelect }) => {
  return (
    <View style={styles.container}>
      {choices.map((choice, index) => (
        <Pressable 
          key={index} 
          style={styles.button} 
          onPress={() => onSelect(choice.next)}
        >
          <Text style={styles.buttonText}>{choice.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default PlayerChoice

const styles = StyleSheet.create({
    container: {
      
      padding: 10,
      minWidth: 280,
      maxWidth: 1000,
      borderRadius: 8,
      borderColor: "red",
      alignItems: "center",
    },
    button: {
      padding: 20,
      margin: 20,
      minWidth: 50,
      maxWidth: 100,
      borderRadius: 8,
      backgroundColor: '#dba5e3' ,
      shadowColor: '#483d50',
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 5,
    },
    buttonText: {
      fontWeight: "bold", 
      fontSize: 12,
      textAlign: 'left',
      color: "black",
    },
});