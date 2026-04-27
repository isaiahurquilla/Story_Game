import { Pressable, Text, View, StyleSheet } from 'react-native';

const PlayerChoice = ({ choices, onSelect }) => {
  return (
    <View style={styles.container}>
      {choices.map((choice, index) => (
        <Pressable
          key={index}
          style={styles.button}
          onPress={() => onSelect(choice.next, choice.label, choice.cost || 0)}
        >
          <Text style={styles.buttonText}>
            {choice.label}
            {choice.cost ? ` (-${choice.cost} 💰)` : ''}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};

export default PlayerChoice;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  button: {
    padding: 15,
    marginVertical: 5,
    width: 250,
    borderRadius: 8,
    backgroundColor: '#dba5e3',
    shadowColor: '#483d50',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'left',
    color: 'black',
  },
});