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
    backgroundColor: 'rgba(12, 18, 24, 0.82)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(202, 242, 255, 0.32)',
  },
  text: {
    color: 'white',
    fontWeight: '700',
    fontSize: 13,
  },
});

export default InteractPrompt;
