import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';
import { Animated, Easing, Image, View, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows } from '../constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const FLIGHT_MS = 550;

interface FlyOrigin {
  x: number;
  y: number;
  width: number;
  height: number;
  imageUri?: string;
}

interface CartTarget {
  x: number;
  y: number;
}

interface FlyToCartContextType {
  fly: (origin: FlyOrigin) => void;
  // The mini-cart bar reports its own real on-screen position here once it's
  // visible, so the ghost flies to where the bar actually is instead of a
  // guessed point. Pass null when the bar unmounts/hides.
  registerCartTarget: (point: CartTarget | null) => void;
  // Fires once a flight's animation finishes landing — the mini-cart bar uses
  // this to time its own "bump" pulse so the two animations feel connected
  // instead of coincidentally overlapping.
  subscribeLand: (cb: () => void) => () => void;
}

const FlyToCartContext = createContext<FlyToCartContextType | undefined>(undefined);

export function useFlyToCart() {
  const ctx = useContext(FlyToCartContext);
  if (!ctx) throw new Error('useFlyToCart must be used within FlyToCartProvider');
  return ctx;
}

interface Flight extends FlyOrigin {
  id: number;
  progress: Animated.Value;
  target: CartTarget;
}

let flightId = 0;

// A ghost of the product image arcs from wherever "Add" was tapped toward the
// mini-cart bar, then fades — the same "something just happened" feedback
// Swiggy/Zomato give on every add-to-cart tap. Rendered at the app root (see
// App.tsx) so it can fly across screen boundaries (e.g. from the Product
// Sheet, which is itself already mounted at the root).
export function FlyToCartProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [flights, setFlights] = useState<Flight[]>([]);
  const cartTargetRef = useRef<CartTarget | null>(null);
  const landListenersRef = useRef<Set<() => void>>(new Set());

  const registerCartTarget = useCallback((point: CartTarget | null) => {
    cartTargetRef.current = point;
  }, []);

  const subscribeLand = useCallback((cb: () => void) => {
    landListenersRef.current.add(cb);
    return () => landListenersRef.current.delete(cb);
  }, []);

  const fly = useCallback((origin: FlyOrigin) => {
    const id = ++flightId;
    const progress = new Animated.Value(0);
    // Fallback for the very first add of a session, before the bar has ever
    // been visible to report its own position — a rough spot near the floating
    // nav's cart area, since the bar will pop in with its own animation moments
    // later anyway.
    const target = cartTargetRef.current ?? {
      x: SCREEN_WIDTH / 2,
      y: SCREEN_HEIGHT - insets.bottom - 40,
    };
    setFlights((prev) => [...prev, { ...origin, id, progress, target }]);
    Animated.timing(progress, {
      toValue: 1,
      duration: FLIGHT_MS,
      easing: Easing.bezier(0.3, 0, 0.2, 1),
      useNativeDriver: true,
    }).start(() => {
      setFlights((prev) => prev.filter((f) => f.id !== id));
      landListenersRef.current.forEach((cb) => cb());
    });
  }, [insets.bottom]);

  const value = useMemo(() => ({ fly, registerCartTarget, subscribeLand }), [fly, registerCartTarget, subscribeLand]);

  return (
    <FlyToCartContext.Provider value={value}>
      {children}
      {flights.map((f) => {
        const translateX = f.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, f.target.x - (f.x + f.width / 2)],
        });
        // Parabolic hop — rises before dropping to the target, rather than a
        // flat straight-line slide.
        const translateY = f.progress.interpolate({
          inputRange: [0, 0.45, 1],
          outputRange: [0, -90, f.target.y - (f.y + f.height / 2)],
        });
        // Holds close to full size through most of the hop, then shrinks
        // sharply right at the end — reads as "sucked into" the cart rather
        // than uniformly deflating the whole way there.
        const scale = f.progress.interpolate({
          inputRange: [0, 0.7, 1],
          outputRange: [1, 0.92, 0.2],
        });
        // A little tumble as it flies, like a coin tossed into a jar.
        const rotate = f.progress.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', f.target.x >= f.x ? '18deg' : '-18deg'],
        });
        const opacity = f.progress.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] });

        return (
          // Split in two: the outer view carries the shadow (must NOT clip),
          // the inner one clips the image to rounded corners (must clip) — a
          // single view with both `overflow: hidden` and a shadow silently
          // drops the shadow on iOS, since the clip mask cuts it off too.
          <Animated.View
            key={f.id}
            pointerEvents="none"
            style={[
              styles.ghostShadowWrap,
              Shadows.raised,
              {
                left: f.x, top: f.y, width: f.width, height: f.height,
                opacity,
                transform: [{ translateX }, { translateY }, { rotate }, { scale }],
              },
            ]}
          >
            <View style={styles.ghost}>
              {f.imageUri ? (
                <Image source={{ uri: f.imageUri }} style={styles.ghostImage} />
              ) : (
                <View style={styles.ghostFallback}>
                  <Ionicons name="leaf" size={20} color={Colors.white} />
                </View>
              )}
            </View>
          </Animated.View>
        );
      })}
    </FlyToCartContext.Provider>
  );
}

const styles = StyleSheet.create({
  ghostShadowWrap: { position: 'absolute', zIndex: 999, borderRadius: BorderRadius.lg },
  ghost: {
    flex: 1, borderRadius: BorderRadius.lg, overflow: 'hidden',
    borderWidth: 2, borderColor: Colors.white,
  },
  ghostImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  ghostFallback: { flex: 1, backgroundColor: Colors.organic, alignItems: 'center', justifyContent: 'center' },
});
