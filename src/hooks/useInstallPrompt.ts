import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface UseInstallPromptReturn {
  canInstall: boolean
  isInstalling: boolean
  install: () => Promise<void>
  dismiss: () => void
  isIOS: boolean
}

/**
 * Hook to handle PWA install prompts
 * Provides custom install UI for Add to Home Screen
 */
export function useInstallPrompt(): UseInstallPromptReturn {
  const [canInstall, setCanInstall] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if running on iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(isIOSDevice)

    if (isIOSDevice) {
      // iOS PWA installation is manual, just show the banner
      setCanInstall(true)
      return
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const event = e as BeforeInstallPromptEvent
      setDeferredPrompt(event)
      setCanInstall(true)
    }

    const handleAppInstalled = () => {
      console.log('PWA installed successfully')
      setCanInstall(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const install = async () => {
    if (isIOS) {
      // For iOS, we can't programmatically trigger installation
      // Just show instructions
      console.log('Please tap the Share button and select "Add to Home Screen"')
      return
    }

    if (!deferredPrompt) return

    try {
      setIsInstalling(true)
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        console.log('User accepted the installation')
        setCanInstall(false)
      } else {
        console.log('User dismissed the installation')
      }

      setDeferredPrompt(null)
    } catch (error) {
      console.error('Installation prompt failed:', error)
    } finally {
      setIsInstalling(false)
    }
  }

  const dismiss = () => {
    setCanInstall(false)
    setDeferredPrompt(null)
  }

  return {
    canInstall,
    isInstalling,
    install,
    dismiss,
    isIOS
  }
}
