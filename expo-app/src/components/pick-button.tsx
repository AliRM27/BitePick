import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  interpolate,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface PickButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Large, animated CTA button with pulsing glow effect.
 * The primary interaction point of the app.
 */
export function PickButton({ onPress, loading = false, disabled = false }: PickButtonProps) {
  const theme = useTheme();

  // Pulsing glow animation
  const glowPulse = useSharedValue(0);
  // Press scale animation
  const pressScale = useSharedValue(1);
  // Loading rotation
  const loadingRotation = useSharedValue(0);

  useEffect(() => {
    // Continuous glow pulse
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [glowPulse]);

  useEffect(() => {
    if (loading) {
      loadingRotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      loadingRotation.value = 0;
    }
  }, [loading, loadingRotation]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowPulse.value, [0, 1], [0.4, 0.9]),
    transform: [{ scale: interpolate(glowPulse.value, [0, 1], [0.95, 1.08]) }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const loadingStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${loadingRotation.value}deg` }],
  }));

  const handlePressIn = () => {
    pressScale.value = withSpring(0.95, { damping: 15, stiffness: 200 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  return (
    <View style={styles.wrapper}>
      {/* Glow layer behind button */}
      <Animated.View
        style={[
          styles.glow,
          { backgroundColor: theme.accentGlow },
          glowStyle,
        ]}
      />

      {/* Main button */}
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[
          styles.button,
          { backgroundColor: theme.accent },
          (disabled || loading) && styles.disabled,
          buttonStyle,
        ]}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Animated.View style={loadingStyle}>
              <ThemedText style={[styles.loadingIcon, { color: '#FFFFFF' }]}>
                ◐
              </ThemedText>
            </Animated.View>
            <ThemedText style={[styles.buttonText, { color: '#FFFFFF' }]}>
              Finding your spot...
            </ThemedText>
          </View>
        ) : (
          <View style={styles.contentContainer}>
            <ThemedText style={[styles.emoji]}>🍽️</ThemedText>
            <ThemedText style={[styles.buttonText, { color: '#FFFFFF' }]}>
              Pick for me
            </ThemedText>
          </View>
        )}
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: Spacing.four,
  },
  glow: {
    position: 'absolute',
    width: '100%',
    height: 72,
    borderRadius: BorderRadius.xl,
  },
  button: {
    width: '100%',
    height: 64,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  disabled: {
    opacity: 0.6,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emoji: {
    fontSize: 24,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loadingIcon: {
    fontSize: 22,
  },
});
