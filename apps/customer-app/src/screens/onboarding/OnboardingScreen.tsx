import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { Colors, Typography } from '../../constants/theme';

const { width } = Dimensions.get('window');

type Slide = {
  key: string;
  emoji: string;
  accent: string;
  accentTint: string;
  title: string;
  subtitle: string;
};

const SLIDES: Slide[] = [
  {
    key: 'organic',
    emoji: '🌾',
    accent: Colors.organic,
    accentTint: Colors.organicLight,
    title: 'Organic, straight from the farm',
    subtitle: 'Certified organic produce and staples sourced directly from local growers.',
  },
  {
    key: 'natural',
    emoji: '🍯',
    accent: Colors.natural,
    accentTint: Colors.naturalLight,
    title: 'Natural goods, honestly made',
    subtitle: 'Minimally processed foods and everyday essentials with nothing artificial added.',
  },
  {
    key: 'eco',
    emoji: '♻️',
    accent: Colors.eco,
    accentTint: Colors.ecoLight,
    title: 'Eco-friendly, kinder to the planet',
    subtitle: 'Sustainable, low-waste products for a home that treads a little lighter.',
  },
];

export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const isLast = index === SLIDES.length - 1;

  const goNext = () => {
    if (isLast) {
      onDone();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(next);
  };

  const active = SLIDES[index];

  return (
    <View style={s.container}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        onMomentumScrollEnd={onMomentumScrollEnd}
        renderItem={({ item }) => (
          <View style={[s.slide, { width }]}>
            <View style={[s.hero, { backgroundColor: item.accentTint }]}>
              <Text style={s.heroEmoji}>{item.emoji}</Text>
            </View>
          </View>
        )}
      />

      <View style={s.content}>
        <Text style={s.title}>{active.title}</Text>
        <Text style={s.subtitle}>{active.subtitle}</Text>

        <View style={s.footerRow}>
          <TouchableOpacity onPress={onDone} hitSlop={12}>
            <Text style={s.skip}>Skip</Text>
          </TouchableOpacity>

          <View style={s.dots}>
            {SLIDES.map((slide, i) => (
              <View
                key={slide.key}
                style={[
                  s.dot,
                  i === index && [s.dotActive, { backgroundColor: active.accent, width: 22 }],
                ]}
              />
            ))}
          </View>

          <TouchableOpacity style={[s.nextBtn, { backgroundColor: active.accent }]} onPress={goNext}>
            <Text style={s.nextLabel}>{isLast ? 'Get Started' : 'Next'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  slide: { alignItems: 'center', justifyContent: 'center' },
  hero: {
    width: width - 64,
    height: width - 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: { fontSize: 88 },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 8,
  },
  title: {
    ...Typography.h1,
    color: Colors.text,
    marginBottom: 10,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: 28,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skip: {
    ...Typography.button,
    color: Colors.textSecondary,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  dotActive: {
    height: 6,
    borderRadius: 3,
  },
  nextBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
  },
  nextLabel: {
    ...Typography.button,
    color: Colors.white,
  },
});
