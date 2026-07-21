import React, { useCallback } from 'react'
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated'

// ── Panel expansion spring ──
// Higher mass + lower stiffness = slower, more stable opening.
// On low-end Android, a mass of 0.55 with 240 stiffness creates visible
// micro-jitter because each frame has to compute the physics AND paint
// the growing panel.  Mass 0.8 smooths this out.
export const PANEL_SPRING_CONFIG = {
  damping: 28,
  stiffness: 200,
  mass: 0.8,
}

// ── Quick press feedback (spring back) ──
export const PRESS_SPRING_CONFIG = {
  damping: 14,
  stiffness: 280,
  mass: 0.6,
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

  const open = useCallback(() => {
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

// ── Backward-compatible aliases ──
// LocationPopover and NotificationsPopover still import these.
// They now alias to useContentFadeIn so nothing breaks.
export const useBodyStaggerStyle = useContentFadeIn;
export const useHeaderStaggerStyle = useContentFadeIn;

// ── Single content fade-in (replaces body + header + per-item stagger) ──
// A SINGLE opacity + translateY animation for ALL panel content.
// Content becomes visible between anim=0.25 and 0.4 — by then the panel
// has already grown to ~40-50% of its target size, so content appears
// naturally as the panel opens.
//
// No per-item stagger, no multiple animation layers fighting each other.
// This is the correct approach for mobile: one animation driver,
// predictable behavior, minimal UI thread work.
export function useContentFadeIn(anim: SharedValue<number>): object {
  return useAnimatedStyle(() => ({
    opacity: interpolate(anim.value, [0, 0.25, 0.4], [0, 0, 1]),
    transform: [{
      translateY: interpolate(anim.value, [0, 0.28, 0.42], [10, 10, 0]),
    }],
  }))
}
