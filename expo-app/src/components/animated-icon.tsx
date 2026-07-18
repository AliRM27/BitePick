import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  Keyframe,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useTheme } from '@/hooks/use-theme';

const INITIAL_SCALE_FACTOR = Dimensions.get('screen').height / 90;
const DURATION = 600;
const MIN_VISIBLE_MS = 500;
const FADE_DURATION = 220;

interface AnimatedSplashOverlayProps {
  /**
   * When false, the overlay stays fully visible instead of firing its exit
   * animation — used to hold the splash until an async readiness check
   * (e.g. the onboarding-completed flag) resolves, avoiding a flash of the
   * wrong screen underneath.
   */
  ready?: boolean;
}

export function AnimatedSplashOverlay({ ready = true }: AnimatedSplashOverlayProps) {
  const [visible, setVisible] = useState(true);
  const theme = useTheme();
  const mountedAt = useRef(Date.now());

  const overlayOpacity = useSharedValue(1);
  const textOpacity = useSharedValue(0);
  const textScale = useSharedValue(0.95);

  // Text entrance — always plays immediately on mount, independent of `ready`.
  useEffect(() => {
    textOpacity.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) });
    textScale.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) });
  }, [textOpacity, textScale]);

  // Exit — only once `ready`, after a minimum on-screen time so the brand
  // moment doesn't feel like it skips on fast devices where the async
  // readiness check resolves in a few milliseconds.
  useEffect(() => {
    if (!ready) return;

    const elapsed = Date.now() - mountedAt.current;
    const delay = Math.max(0, MIN_VISIBLE_MS - elapsed);

    const timer = setTimeout(() => {
      textOpacity.value = withTiming(0, {
        duration: FADE_DURATION,
        easing: Easing.out(Easing.quad),
      });
      textScale.value = withTiming(1.05, {
        duration: FADE_DURATION,
        easing: Easing.out(Easing.quad),
      });
      overlayOpacity.value = withTiming(0, { duration: FADE_DURATION }, (finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [ready, overlayOpacity, textOpacity, textScale]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ scale: textScale.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.backgroundSolidColor,
        { backgroundColor: theme.background },
        overlayStyle,
      ]}
    >
      <Animated.Text style={[styles.splashText, { color: "#E95D21" }, textStyle]}>
        CupMap
      </Animated.Text>
    </Animated.View>
  );
}

const keyframe = new Keyframe({
  0: {
    transform: [{ scale: INITIAL_SCALE_FACTOR }],
  },
  100: {
    transform: [{ scale: 1 }],
    easing: Easing.elastic(0.7),
  },
});

const logoKeyframe = new Keyframe({
  0: {
    transform: [{ scale: 1.3 }],
    opacity: 0,
  },
  40: {
    transform: [{ scale: 1.3 }],
    opacity: 0,
    easing: Easing.elastic(0.7),
  },
  100: {
    opacity: 1,
    transform: [{ scale: 1 }],
    easing: Easing.elastic(0.7),
  },
});

const glowKeyframe = new Keyframe({
  0: {
    transform: [{ rotateZ: '0deg' }],
  },
  100: {
    transform: [{ rotateZ: '7200deg' }],
  },
});

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <Animated.View entering={glowKeyframe.duration(60 * 1000 * 4)} style={styles.glow}>
        <Image style={styles.glow} source={require('@/assets/images/logo-glow.png')} />
      </Animated.View>

      <Animated.View entering={keyframe.duration(DURATION)} style={styles.background} />
      <Animated.View style={styles.imageContainer} entering={logoKeyframe.duration(DURATION)}>
        <Image style={styles.image} source={require('@/assets/images/splash-icon.png')} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    width: 201,
    height: 201,
    position: 'absolute',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 128,
    height: 128,
    zIndex: 100,
  },
  image: {
    position: 'absolute',
    width: 76,
    height: 76,
  },
  background: {
    borderRadius: 40,
    experimental_backgroundImage: `linear-gradient(180deg, #FAF5E6, #EBD2B6)`,
    width: 128,
    height: 128,
    position: 'absolute',
  },
  backgroundSolidColor: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#0D0D0D',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  splashText: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1.5,
  },
});
