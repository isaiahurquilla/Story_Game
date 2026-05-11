import React, { useEffect, useState } from 'react';
import { Image } from 'react-native';

// Cycles through an array of individual image sources (one PNG per frame) — used for the Mechanic casting animation
const FrameSequenceSprite = ({ frames, speedMs = 120, style }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [frames]);

  useEffect(() => {
    if (!frames || frames.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % frames.length);
    }, speedMs);
    return () => clearInterval(interval);
  }, [frames, speedMs]);

  if (!frames || frames.length === 0) return null;
  return <Image source={frames[index]} style={style} resizeMode="contain" />;
};

export default FrameSequenceSprite;
