import React, { useCallback } from 'react'
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated'

// ── Spring config inspired by Framer Motion FloatingPanel ──
// bounce: 0.1, duration: 0.4 — lower bounce, snappier return, cleaner feel.
export const PANEL_SPRING_CONFIG = {
  damping: 26,
  stiffness: 240,
  mass: 0.55,
}

// ── Quick press feedback ──
export const PRESS_SPRING_CONFIG = {
  damping: 12,
  stiffness: 300,
  mass: 0.5,
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
  open: (origin: PanelOrigin) => void
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
 * - **Open**: springs anim from 0→1
 * - **Close**: springs anim from 1→0, calls onClose on completion
 * - **Backdrop**: smooth crossfade via opacity
 * - **Trigger ghost**: icon/text fades out as panel grows in
 *
 * Each popover uses useAnimatedStyle at the top level for its own
 * panel size/position interpolation and staggered content reveals.
 */
export function usePanelAnimation(): PanelAnimations {
  const anim = useSharedValue(0)

  const open = useCallback((_origin: PanelOrigin) => {
    requestAnimationFrame(() => {
      anim.value = withSpring(1, PANEL_SPRING_CONFIG)
    })
  }, [])

  const close = useCallback((onClose?: () => void) => {
    anim.value = withSpring(0, PANEL_SPRING_CONFIG, (finished) => {
      if (finished && onClose) {
        runOnJS(onClose)()
      }
    })
  }, [])

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: anim.value,
  }))

  const triggerGhostStyle = useAnimatedStyle(() => ({
    opacity: interpolate(anim.value, [0, 0.3, 0.6], [1, 0.5, 0]),
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
// Wraps children with a staggered entrance animation driven by the shared
// animation value.  Use this INSTEAD of useStaggerItemStyle inside .map()
// callbacks, which would violate the rules of hooks.
interface StaggeredItemProps {
  anim: SharedValue<number>
  index: number
  children: React.ReactNode
  style?: any
}

export function StaggeredItem({ anim, index, children, style }: StaggeredItemProps) {
  const itemStyle = useAnimatedStyle(() => {
    const baseDelay = 0.08
    const delay = Math.min(baseDelay + index * 0.03, 0.35)
    return {
      opacity: interpolate(anim.value, [0, delay, delay + 0.05], [0, 0, 1]),
      transform: [{
        translateY: interpolate(anim.value, [0, delay, delay + 0.08], [10, 10, 0]),
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
    const delay = 0.10 + index * 0.05
    return {
      opacity: interpolate(anim.value, [0, delay, delay + 0.04], [0, 0, 1]),
      transform: [{
        translateY: interpolate(anim.value, [0, delay, delay + 0.06], [12, 12, 0]),
      }],
    }
  })

  return (
    <Reanimated.View style={[style, sectionStyle]}>
      {children}
    </Reanimated.View>
  )
}

// ── Body content stagger (fade + slide up as a group) ──
export function useBodyStaggerStyle(anim: SharedValue<number>): object {
  return useAnimatedStyle(() => ({
    opacity: interpolate(anim.value, [0, 0.35, 0.45], [0, 0, 1]),
    transform: [{ translateY: interpolate(anim.value, [0, 0.4, 0.5], [14, 14, 0]) }],
  }))
}

// ── Header stagger (fade + slide slightly later) ──
export function useHeaderStaggerStyle(anim: SharedValue<number>): object {
  return useAnimatedStyle(() => ({
    opacity: interpolate(anim.value, [0, 0.2, 0.3], [0, 0, 1]),
    transform: [{ translateY: interpolate(anim.value, [0, 0.25, 0.35], [14, 14, 0]) }],
  }))
}
