import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const InteractPrompt = ({ visible, text = 'Press E to interact' }) => {
  if (!visible) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 8,
  },
  text: {
    color: 'white',
    fontWeight: '700',
  },
});

export default InteractPrompt;