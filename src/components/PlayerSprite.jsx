import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

const PlayerSprite = ({
  x,
  y,
  size = 42,
  spriteSource,
  facing = 'down',
}) => {
  const facingStyle = {
    left: x,
    top: y,
  };

  if (spriteSource) {
    return (
      <Image
        source={spriteSource}
        style={[styles.spriteImage, facingStyle, { width: size, height: size }]}
        resizeMode="contain"
      />
    );
  }

  return <View style={[styles.placeholder, facingStyle, { width: size, height: size, borderRadius: size / 2 }]} />;
};

const styles = StyleSheet.create({
  spriteImage: {
    position: 'absolute',
    zIndex: 5,
  },
  placeholder: {
    position: 'absolute',
    backgroundColor: '#7a4fe0',
    borderWidth: 2,
    borderColor: '#ffffff',
    zIndex: 5,
  },
});

export default PlayerSprite;