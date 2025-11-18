'use client'

import { useEffect, useState } from 'react'
import { Download, X, Share2 } from 'lucide-react'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'

/**
 * PWA Install Prompt Component
 * Shows a banner to encourage users to install the app
 */
export default function InstallPrompt() {
  const [mounted, setMounted] = useState(false)
  const { canInstall, isInstalling, install, dismiss, isIOS } = useInstallPrompt()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render until mounted to avoid hydration issues
  if (!mounted || !canInstall) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {isIOS ? (
              <Share2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
            ) : (
              <Download className="w-5 h-5 text-blue-600 flex-shrink-0" />
            )}
            <h3 className="font-semibold text-gray-900 text-sm">Install Solar Scan</h3>
          </div>
          <p className="text-xs text-gray-600">
            {isIOS
              ? 'Tap Share and select "Add to Home Screen" for quick access'
              : 'Get quick access to solar analysis on your home screen'}
          </p>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={dismiss}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
          {!isIOS && (
            <button
              onClick={install}
              disabled={isInstalling}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {isInstalling ? 'Installing...' : 'Install'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
