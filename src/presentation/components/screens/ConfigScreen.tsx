/**
 * ConfigScreen - Vista de Configuración
 */

'use client'

import { useState } from 'react'
import { LogOut, Palette, Check } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/presentation/providers/theme-provider'

export function ConfigScreen() {
  const { theme: currentTheme, themes, setTheme, isLoading } = useTheme()
  const [showThemes, setShowThemes] = useState(false)

  const applyThemeVariables = (themeSlug: string) => {
    const selectedTheme = themes.find(t => t.slug === themeSlug)
    if (!selectedTheme) return

    const root = document.documentElement

    // Apply CSS custom properties for all theme colors
    Object.entries(selectedTheme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value)
    })

    // Set data-theme attribute
    root.setAttribute('data-theme', themeSlug)
  }

  const handleThemeChange = async (themeSlug: string) => {
    // Apply theme immediately (optimistic update)
    applyThemeVariables(themeSlug)

    // Then save via the provider hook
    await setTheme(themeSlug)
  }

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Configuración</h2>

      {/* Sección de Temas */}
      <div className="rounded-lg border bg-card">
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition"
          onClick={() => setShowThemes(prev => !prev)}
          disabled={isLoading}
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Palette className="h-5 w-5" />
            <span>Temas</span>
            {currentTheme && (
              <span className="text-xs text-muted-foreground">({currentTheme})</span>
            )}
          </div>
          <span className={`text-xs text-muted-foreground transition-transform ${showThemes ? 'rotate-90' : ''}`}>
            ➜
          </span>
        </button>
        {showThemes && (
          <div className="space-y-2 border-t px-4 py-4">
            {themes.length > 0 ? (
              themes.map((theme) => (
                <button
                  key={theme.slug}
                  onClick={() => handleThemeChange(theme.slug)}
                  disabled={isLoading}
                  className="w-full flex items-center justify-between p-3 rounded-lg border bg-background hover:bg-accent transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-6 w-6 rounded-full border-2 border-foreground/20"
                      style={{
                        backgroundColor: `hsl(${theme.colors.primary})`,
                      }}
                    />
                    <span className="text-sm font-medium">{theme.name}</span>
                  </div>
                  {currentTheme === theme.slug && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">
                No hay temas disponibles
              </p>
            )}
          </div>
        )}
      </div>

      {/* Sección de Sesión */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h3 className="text-lg font-semibold">Sesión</h3>

        <Button
          variant="destructive"
          className="w-full"
          onClick={() => signOut({ callbackUrl: '/auth/login' })}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  )
}
