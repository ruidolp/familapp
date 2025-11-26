'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { X, Download, Share } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstaller() {
  const t = useTranslations('pwa.install')
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIOSPrompt, setShowIOSPrompt] = useState(false)
  const [showAndroidPrompt, setShowAndroidPrompt] = useState(false)

  useEffect(() => {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ ServiceWorker registered:', registration.scope)
        })
        .catch((error) => {
          console.error('❌ ServiceWorker registration failed:', error)
        })
    }

    // Check if already dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed === 'true') return

    // Detect if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isIOSStandalone = (navigator as any).standalone === true

    if (isStandalone || isIOSStandalone) {
      // Already installed, don't show prompt
      return
    }

    // Detect iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

    if (isIOS && isSafari) {
      // Show iOS instructions after 3 seconds
      const timer = setTimeout(() => {
        setShowIOSPrompt(true)
      }, 3000)
      return () => clearTimeout(timer)
    }

    // Android/Chrome - Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Show Android prompt after 3 seconds
      setTimeout(() => {
        setShowAndroidPrompt(true)
      }, 3000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    await deferredPrompt.prompt()

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('✅ PWA installed')
    }

    // Clear the prompt
    setDeferredPrompt(null)
    setShowAndroidPrompt(false)
  }

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', 'true')
    setShowIOSPrompt(false)
    setShowAndroidPrompt(false)
  }

  // iOS Prompt
  if (showIOSPrompt) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom duration-300">
        <Card className="relative bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 backdrop-blur-sm">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/5 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          <div className="p-4 pr-10">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Share className="w-5 h-5 text-primary" />
              </div>

              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-sm">{t('title')}</h3>
                <p className="text-xs text-muted-foreground">{t('descriptionIOS')}</p>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-primary">1.</span>
                    <span>{t('iosInstructions.step1')} <Share className="inline w-3 h-3" /></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-primary">2.</span>
                    <span>{t('iosInstructions.step2')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-primary">3.</span>
                    <span>{t('iosInstructions.step3')}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleDismiss}
                    variant="ghost"
                    size="sm"
                    className="text-xs h-8"
                  >
                    {t('laterButton')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Android/Chrome Prompt
  if (showAndroidPrompt && deferredPrompt) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom duration-300">
        <Card className="relative bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 backdrop-blur-sm">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/5 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          <div className="p-4 pr-10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Download className="w-5 h-5 text-primary" />
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-sm">{t('title')}</h3>
                <p className="text-xs text-muted-foreground mt-1">{t('descriptionAndroid')}</p>
              </div>

              <Button
                onClick={handleInstallClick}
                size="sm"
                className="shrink-0 h-8 text-xs"
              >
                {t('installButton')}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return null
}
