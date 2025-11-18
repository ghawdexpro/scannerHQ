/**
 * Haptic Feedback utilities for mobile devices
 * Provides tactile feedback for user interactions
 */

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'

/**
 * Trigger haptic feedback
 * Gracefully falls back if not supported
 */
export function triggerHaptic(type: HapticType = 'medium'): void {
  if (!('vibrate' in navigator)) return

  try {
    const patterns: Record<HapticType, number | number[]> = {
      light: 10,
      medium: 25,
      heavy: 50,
      success: [30, 50, 30],
      warning: [50, 30, 50],
      error: [100, 30, 100]
    }

    navigator.vibrate(patterns[type])
  } catch (error) {
    console.debug('Haptic feedback not available:', error)
  }
}

/**
 * Haptic feedback for button click
 */
export function hapticClick(): void {
  triggerHaptic('light')
}

/**
 * Haptic feedback for success state
 */
export function hapticSuccess(): void {
  triggerHaptic('success')
}

/**
 * Haptic feedback for error state
 */
export function hapticError(): void {
  triggerHaptic('error')
}

/**
 * Haptic feedback for warning state
 */
export function hapticWarning(): void {
  triggerHaptic('warning')
}

/**
 * Stop any ongoing vibration
 */
export function stopHaptic(): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(0)
  }
}
