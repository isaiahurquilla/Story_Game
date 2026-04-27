import React from 'react';
import { Image, View, StyleSheet } from 'react-native';

const PlayerSprite = ({ x, y, size = 56, spriteSource, facing = 'down' }) => {
  if (spriteSource) {
    return (
      <Image
        source={spriteSource}
        style={[
          styles.sprite,
          {
            left: x,
            top: y,
            width: size,
            height: size,
          },
        ]}
        resizeMode="contain"
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        {
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: 12,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  sprite: {
    position: 'absolute',
    zIndex: 20,
  },
  placeholder: {
    position: 'absolute',
    zIndex: 20,
    backgroundColor: '#7a4fe0',
    borderWidth: 2,
    borderColor: '#fff',
  },
});

export default PlayerSprite;