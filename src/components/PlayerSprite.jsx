import React, { useEffect, useMemo, useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';

const DEFAULT_FRAME_SIZE = 32;

const PlayerSprite = ({
  x,
  y,
  size = 42,
  spriteSource = null,
  animationSet = null,
  state = 'idle',
  facing = 'right',
  zIndex = 5,
  speedMs = 140,
}) => {
  const activeSheet = animationSet?.[state] || animationSet?.idle || null;
  const frameWidth = animationSet?.frameWidth || DEFAULT_FRAME_SIZE;
  const frameHeight = animationSet?.frameHeight || DEFAULT_FRAME_SIZE;
  const frameCount =
    animationSet?.frameCounts?.[state] ||
    animationSet?.frameCounts?.idle ||
    1;

  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    setFrameIndex(0);
  }, [state, activeSheet]);

  useEffect(() => {
    if (!activeSheet || frameCount <= 1) return;

    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frameCount);
    }, speedMs);

    return () => clearInterval(interval);
  }, [activeSheet, frameCount, speedMs]);

  const containerStyle = useMemo(
    () => [
      styles.crop,
      {
        left: x,
        top: y,
        width: size,
        height: size,
        zIndex,
        transform: [{ scaleX: facing === 'left' ? -1 : 1 }],
      },
    ],
    [x, y, size, zIndex, facing]
  );

  if (activeSheet) {
    return (
      <View style={containerStyle}>
        <Image
          source={activeSheet}
          style={{
            position: 'absolute',
            left: -frameIndex * size,
            top: 0,
            width: frameCount * size,
            height: size,
          }}
          resizeMode="stretch"
        />
      </View>
    );
  }

  if (spriteSource) {
    return (
      <Image
        source={spriteSource}
        style={[
          styles.spriteImage,
          {
            left: x,
            top: y,
            width: size,
            height: size,
            zIndex,
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
          borderRadius: size / 2,
          zIndex,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  crop: {
    position: 'absolute',
    overflow: 'hidden',
  },
  spriteImage: {
    position: 'absolute',
  },
  placeholder: {
    position: 'absolute',
    backgroundColor: '#7a4fe0',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
});

export default PlayerSprite;