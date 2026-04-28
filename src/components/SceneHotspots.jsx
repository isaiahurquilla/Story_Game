import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

export const isColliding = (player, hotspot) => {
  return (
    player.x < hotspot.x + hotspot.width &&
    player.x + player.width > hotspot.x &&
    player.y < hotspot.y + hotspot.height &&
    player.y + player.height > hotspot.y
  );
};

const SceneHotspots = ({ hotspots = [], onHotspotPress, debug = false }) => {
  return (
    <>
      {hotspots.map((hotspot) => (
        <Pressable
          key={hotspot.id}
          onPress={() => onHotspotPress?.(hotspot)}
          style={[
            styles.hotspot,
            {
              left: hotspot.x,
              top: hotspot.y,
              width: hotspot.width,
              height: hotspot.height,
              backgroundColor: debug ? 'rgba(255,0,0,0.25)' : 'transparent',
              borderWidth: debug ? 1 : 0,
            },
          ]}
        >
          <View />
        </Pressable>
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  hotspot: {
    position: 'absolute',
    zIndex: 10,
    borderColor: 'red',
  },
});

export default SceneHotspots;