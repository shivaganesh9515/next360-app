import React, { useCallback } from 'react'
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  interpolate,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated'

// ── Panel expansion spring ──
// overshootClamping: true = NO bounce whatsoever, settles clean.
// Medium stiffness + medium mass = smooth, not sluggish, not jittery.
// restDisplacementThreshold tightened so it snaps to final state fast.
export const PANEL_SPRING_CONFIG = {
  damping: 32,
  stiffness: 240,
  mass: 0.65,
  overshootClamping: true,
  restDisplacementThreshold: 0.005,
  restSpeedThreshold: 0.005,
}

// ── Quick press feedback (spring back) ──
export const PRESS_SPRING_CONFIG = {
  damping: 18,
  stiffness: 350,
  mass: 0.5,
  overshootClamping: true,
}

export interface PanelOrigin {
  x: number
  y: number
  width: number
  height: number
}

export interface PanelAnimations {
  /** Shared value driving all animations (0 = closed, 1 = open) */
  anim: SharedValue<number>
  /** Call when trigger is pressed — springs open */
  open: () => void
  /** Call to close — springs back, runs onClose callback when done */
  close: (onClose?: () => void) => void
  /** Animated style for the backdrop overlay (opacity 0→1) */
  backdropStyle: object
  /** Animated style for the trigger clone inside panel (fades out) */
  triggerGhostStyle: object
}

/**
 * Unified floating-panel animation hook.
 *
 * - **Open**: springs anim from 0→1 (overshootClamping = no bounce)
 * - **Close**: springs anim from 1→0, calls onClose on completion
 * - **Backdrop**: smooth crossfade via opacity
 * - **Trigger ghost**: icon/text fades out as panel grows in
 */
export function usePanelAnimation(): PanelAnimations {
  const anim = useSharedValue(0)

  // One rAF so the Modal gets exactly one frame to mount before the spring
  // kicks in — prevents the "jump" on frame 0 without adding perceptible delay.
  const open = useCallback(() => {
    requestAnimationFrame(() => {
      anim.value = withSpring(1, PANEL_SPRING_CONFIG)
    })
  }, [])

  const close = useCallback((onClose?: () => void) => {
    // Close uses withTiming for a crisp, linear dismiss — spring close
    // can feel "bouncy backwards" which reads as lag on close.
    anim.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) }, (finished) => {
      if (finished && onClose) {
        runOnJS(onClose)()
      }
    })
  }, [])

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(anim.value, [0, 0.5], [0, 1]),
  }))

  const triggerGhostStyle = useAnimatedStyle(() => ({
    opacity: interpolate(anim.value, [0, 0.25, 0.55], [1, 0.4, 0]),
  }))

  return {
    anim,
    open,
    close,
    backdropStyle,
    triggerGhostStyle,
  }
}

// ── StaggeredItem component ──
interface StaggeredItemProps {
  anim: SharedValue<number>
  index: number
  children: React.ReactNode
  style?: any
}

export function StaggeredItem({ anim, index, children, style }: StaggeredItemProps) {
  const itemStyle = useAnimatedStyle(() => {
    const baseDelay = 0.06
    const delay = Math.min(baseDelay + index * 0.025, 0.3)
    return {
      opacity: interpolate(anim.value, [0, delay, delay + 0.05], [0, 0, 1]),
      transform: [{
        translateY: interpolate(anim.value, [0, delay, delay + 0.07], [8, 8, 0]),
      }],
    }
  })

  return (
    <Reanimated.View style={[style, itemStyle]}>
      {children}
    </Reanimated.View>
  )
}

// ── Staggered section header/footer ──
interface StaggeredSectionProps {
  anim: SharedValue<number>
  index: number
  children: React.ReactNode
  style?: any
}

export function StaggeredSection({ anim, index, children, style }: StaggeredSectionProps) {
  const sectionStyle = useAnimatedStyle(() => {
    const delay = 0.09 + index * 0.045
    return {
      opacity: interpolate(anim.value, [0, delay, delay + 0.04], [0, 0, 1]),
      transform: [{
        translateY: interpolate(anim.value, [0, delay, delay + 0.06], [10, 10, 0]),
      }],
    }
  })

  return (
    <Reanimated.View style={[style, sectionStyle]}>
      {children}
    </Reanimated.View>
  )
}

// ── Backward-compatible aliases ──
export const useBodyStaggerStyle = useContentFadeIn;
export const useHeaderStaggerStyle = useContentFadeIn;

// ── Single content fade-in ──
// Content visible between anim=0.2 and 0.38 — panel has grown enough
// by then that content appears naturally rather than popping in.
export function useContentFadeIn(anim: SharedValue<number>): object {
  return useAnimatedStyle(() => ({
    opacity: interpolate(anim.value, [0, 0.2, 0.38], [0, 0, 1]),
    transform: [{
      translateY: interpolate(anim.value, [0, 0.22, 0.4], [8, 8, 0]),
    }],
  }))
}
