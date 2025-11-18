import { useCallback } from 'react'
import {
  hapticClick,
  hapticSuccess,
  hapticError,
  hapticWarning,
  stopHaptic
} from '@/lib/mobile/haptic'

/**
 * Hook for easy haptic feedback integration
 * Provides callback functions for common haptic events
 */
export function useHapticFeedback() {
  const onClick = useCallback(() => {
    hapticClick()
  }, [])

  const onSuccess = useCallback(() => {
    hapticSuccess()
  }, [])

  const onError = useCallback(() => {
    hapticError()
  }, [])

  const onWarning = useCallback(() => {
    hapticWarning()
  }, [])

  const onStop = useCallback(() => {
    stopHaptic()
  }, [])

  return {
    onClick,
    onSuccess,
    onError,
    onWarning,
    onStop
  }
}
