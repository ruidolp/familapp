'use client'

import { useEffect } from 'react'

export function PWAInstaller() {
  useEffect(() => {
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
  }, [])

  return null
}
