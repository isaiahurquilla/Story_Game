import { Pressable, StyleSheet, Text, View, Image } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

const AnimatedText = Animated.createAnimatedComponent(Text);

const imageMap = {
  //fox_image: require('../assets/images/fox.png'),
  //wolf_image: require('../assets/images/wolf.png'),
  //hare_image: require('../assets/images/hare.png'),
  dude_image: require('../assets/sprites/Dude_Monster/Dude_Monster.png'),
  pink_image: require('../assets/sprites/Pink_Monster/Pink_Monster.png'),
  owlet_image: require('../assets/sprites/Owlet_Monster/Owlet_Monster.png'),
};

const DialogBox = ({
  style,
  variant = 'default',
  characterId,
  characterData,
  txt = '',
  speed = 24,
  onPress,
  showPortrait = true,
  continueHint,
  portraitOverride,
  children,
  ...props
}) => {
  const speaker = useMemo(() => {
    return characterData?.[characterId] || { name: 'Narrator', portrait: null };
  }, [characterData, characterId]);

  const opacity = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  const variantStyles = {
    default: {
      wrap: styles.defaultWrap,
      portrait: styles.defaultPortrait,
      heading: styles.defaultHeading,
      card: styles.defaultCard,
      bodyText: styles.defaultBodyText,
      hint: styles.defaultHint,
    },
    vn: {
      wrap: styles.vnWrap,
      portrait: styles.vnPortrait,
      heading: styles.vnHeading,
      card: styles.vnCard,
      bodyText: styles.vnBodyText,
      hint: styles.vnHint,
    },
    overlay: {
      wrap: styles.overlayWrap,
      portrait: styles.overlayPortrait,
      heading: styles.overlayHeading,
      card: styles.overlayCard,
      bodyText: styles.overlayBodyText,
      hint: styles.overlayHint,
    },
  };

  const palette = variantStyles[variant] || variantStyles.default;
  const portraitSource = portraitOverride || imageMap[speaker.portrait];
  const hintLabel = continueHint ?? (onPress ? 'Tap to continue' : null);

  useEffect(() => {
    opacity.value = 0;
    opacity.value = withTiming(1, { duration: 250 });
    setDisplayedText('');
    setCurrentIndex(0);
  }, [txt, opacity]);

  useEffect(() => {
    if (!txt || currentIndex >= txt.length) return undefined;

    const timeout = setTimeout(() => {
      setDisplayedText((prev) => prev + txt[currentIndex]);
      setCurrentIndex((prev) => prev + 1);
    }, speed);

    return () => clearTimeout(timeout);
  }, [currentIndex, txt, speed]);

  const handlePress = () => {
    if (currentIndex < txt.length) {
      setDisplayedText(txt);
      setCurrentIndex(txt.length);
      return;
    }

    onPress?.();
  };

  return (
    <View style={[styles.outerWrap, palette.wrap]}>
      {showPortrait && (
        <View style={styles.portraitContainer}>
          {portraitSource ? (
            <Image source={portraitSource} style={[styles.basePortrait, palette.portrait]} />
          ) : (
            <View style={[styles.portraitPlaceholder, palette.portrait]} />
          )}
        </View>
      )}

      <Pressable onPress={handlePress} disabled={!onPress && currentIndex >= txt.length}>
        <Text style={[styles.baseHeading, palette.heading]}>{speaker.name}</Text>

        <View style={[styles.baseCard, palette.card, style]} {...props}>
          <AnimatedText style={[palette.bodyText, animatedStyle]}>{displayedText}</AnimatedText>
          {children}
        </View>

        {hintLabel ? <Text style={[styles.baseHint, palette.hint]}>{hintLabel}</Text> : null}
      </Pressable>
    </View>
  );
};

export default DialogBox;

const styles = StyleSheet.create({
  outerWrap: {
    width: '100%',
  },
  portraitContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  basePortrait: {
    borderWidth: 2,
    borderRadius: 32,
  },
  portraitPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    opacity: 0.3,
  },
  baseHeading: {
    fontWeight: '800',
  },
  baseCard: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 5,
  },
  baseHint: {
    marginTop: 8,
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'right',
  },
  defaultWrap: {
    alignItems: 'center',
    marginBottom: 20,
  },
  defaultPortrait: {
    width: 64,
    height: 64,
    borderColor: '#4d3a69',
    backgroundColor: '#8b5cf6',
  },
  defaultHeading: {
    fontSize: 22,
    textAlign: 'left',
    marginBottom: 10,
    color: '#f6f0ff',
  },
  defaultCard: {
    padding: 20,
    minHeight: 150,
    width: 350,
    borderRadius: 18,
    backgroundColor: '#8b5cf6',
    borderColor: '#4d3a69',
  },
  defaultBodyText: {
    color: '#d7caeb',
    fontSize: 15,
    lineHeight: 22,
  },
  defaultHint: {
    color: '#cdbcf3',
  },
  vnWrap: {
    width: '100%',
  },
  vnPortrait: {
    width: 300,
    height: 300,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(32,20,52,0.95)',
  },
  vnHeading: {
    fontSize: 28,
    color: '#f7f0ff',
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  vnCard: {
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 20,
    backgroundColor: 'rgba(18, 12, 30, 0.9)',
    borderColor: 'rgba(231, 218, 255, 0.16)',
  },
  vnBodyText: {
    color: '#f1e9ff',
    fontSize: 18,
    lineHeight: 27,
  },
  vnHint: {
    color: '#d7c7ff',
  },
  overlayWrap: {
    width: '100%',
  },
  overlayPortrait: {
    width: 84,
    height: 84,
    borderColor: 'rgba(217,244,255,0.2)',
    backgroundColor: 'rgba(20, 28, 43, 0.9)',
  },
  overlayHeading: {
    fontSize: 20,
    color: '#effbff',
    marginBottom: 10,
  },
  overlayCard: {
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: 'rgba(12, 18, 29, 0.92)',
    borderColor: 'rgba(190, 231, 255, 0.2)',
  },
  overlayBodyText: {
    color: '#eefcff',
    fontSize: 15,
    lineHeight: 22,
  },
  overlayHint: {
    color: '#bfeaff',
  },
});
