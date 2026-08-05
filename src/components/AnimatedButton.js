import React, { useRef } from 'react';
import { Animated, TouchableWithoutFeedback, StyleSheet, ActivityIndicator, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { triggerHaptic } from '../services/hapticService';
import { playSound } from '../services/soundService';

export default function AnimatedButton({
  onPress,
  title,
  loading = false,
  disabled = false,
  variant = 'primary', // 'primary' | 'secondary' | 'danger'
  style,
  textStyle,
  hapticType = 'light',
  soundKey = 'click',
  icon,
}) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled || loading) return;
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePress = () => {
    if (disabled || loading) return;
    triggerHaptic(hapticType);
    if (soundKey) {
      playSound(soundKey);
    }
    if (onPress) onPress();
  };

  // Determine colors based on variant
  let backgroundColor = colors.primary;
  let textColor = colors.textPrimary;
  let borderStyle = {};

  if (variant === 'secondary') {
    backgroundColor = colors.cardBg;
    textColor = colors.textPrimary;
    borderStyle = { borderWidth: 1, borderColor: colors.border };
  } else if (variant === 'danger') {
    backgroundColor = colors.red;
    textColor = '#FFFFFF';
  }

  if (disabled) {
    backgroundColor = colors.cardBg;
    textColor = colors.textLight;
    borderStyle = { borderWidth: 1, borderColor: colors.border };
  }

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
    >
      <Animated.View
        style={[
          styles.button,
          { backgroundColor, transform: [{ scale: scaleAnim }] },
          borderStyle,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : (
          <View style={styles.contentRow}>
            {icon && <View style={styles.iconWrap}>{icon}</View>}
            <Text style={[styles.text, { color: textColor }, textStyle]}>{title}</Text>
          </View>
        )}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 6,
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    marginRight: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
  },
});
