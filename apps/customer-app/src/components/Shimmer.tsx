import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, ViewStyle, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface Props {
  style?: ViewStyle | ViewStyle[];
}

// Drop-in replacement for a static gray placeholder block — a soft highlight
// band sweeps left-to-right on a loop, the same "content is on its way"
// language most modern apps use instead of a flat gray box. Self-contained
// (measures its own width via onLayout) so it works at any size without the
// caller doing anything but swapping the View for this.
export default function Shimmer({ style }: Props) {
  const [width, setWidth] = useState(SCREEN_WIDTH);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 1100,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [-width, width] });

  return (
    <View style={[styles.base, style]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <Animated.View style={[styles.sweep, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.45)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: Colors.border, overflow: 'hidden' },
  sweep: { position: 'absolute', top: 0, bottom: 0, width: '60%' },
});
