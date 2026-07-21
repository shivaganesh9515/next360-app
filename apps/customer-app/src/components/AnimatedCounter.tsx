import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleProp, TextStyle } from 'react-native';

interface Props {
  from?: number;
  to: number;
  duration?: number;
  style?: StyleProp<TextStyle>;
  formatFn?: (value: number) => string;
}

// A number that animates from one value to another on mount or on `to` change.
// Used for stats, earnings counters, point displays — anywhere a jumping
// number would feel jarring. Driven by Animated.timing with an easing curve
// so the count reads as smooth, not mechanical.
// Falls back to the plain Text value when the animation finishes to avoid
// the overhead of keeping the Animated listener alive.
export default function AnimatedCounter({
  from = 0, to, duration = 800, style, formatFn,
}: Props) {
  const anim = useRef(new Animated.Value(from)).current;
  const displayValue = useRef<string | null>(null);
  const [, forceUpdate] = React.useState(0);

  useEffect(() => {
    displayValue.current = null;
    anim.setValue(from);
    Animated.timing(anim, {
      toValue: to,
      duration,
      useNativeDriver: false,
    }).start();
  }, [to, from]);

  const listenRef = useRef<any>(null);
  useEffect(() => {
    if (listenRef.current) anim.removeListener(listenRef.current);
    listenRef.current = anim.addListener(({ value }) => {
      const rounded = Math.round(value);
      displayValue.current = formatFn ? formatFn(rounded) : `${rounded}`;
      forceUpdate((n) => n + 1);
    });
    return () => {
      if (listenRef.current) anim.removeListener(listenRef.current);
    };
  }, [anim, formatFn]);

  const finalValue = formatFn ? formatFn(to) : `${to}`;
  const showValue = displayValue.current ?? finalValue;

  return <Text style={style}>{showValue}</Text>;
}
