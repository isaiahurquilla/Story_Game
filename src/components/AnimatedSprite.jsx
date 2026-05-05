import React, { useEffect, useState } from 'react';
import { View, Image } from 'react-native';

const AnimatedSprite = ({
  source,
  totalFrames,
  firstFrame = 0,
  lastFrame,
  displayWidth,
  displayHeight,
  speedMs = 200,
}) => {
  const last = lastFrame ?? totalFrames - 1;
  const count = last - firstFrame + 1;
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    if (count <= 1) return undefined;
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % count);
    }, speedMs);
    return () => clearInterval(interval);
  }, [count, speedMs]);

  const actualFrame = firstFrame + frameIndex;

  return (
    <View style={{ width: displayWidth, height: displayHeight, overflow: 'hidden' }}>
      <Image
        source={source}
        style={{
          position: 'absolute',
          left: -actualFrame * displayWidth,
          top: 0,
          width: totalFrames * displayWidth,
          height: displayHeight,
        }}
        resizeMode="stretch"
      />
    </View>
  );
};

export default AnimatedSprite;