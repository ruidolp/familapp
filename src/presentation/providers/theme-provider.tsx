/**
 * Theme Provider
 *
 * Manages theme state and applies CSS variables dynamically.
 * Provides useTheme() hook for components.
 */

'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { apiClient } from '@/infrastructure/lib/api-client'

export interface ThemeColors {
  background: string
  foreground: string
  card: string
  'card-foreground': string
  popover: string
  'popover-foreground': string
  primary: string
  'primary-foreground': string
  secondary: string
  'secondary-foreground': string
  muted: string
  'muted-foreground': string
  accent: string
  'accent-foreground': string
  destructive: string
  'destructive-foreground': string
  border: string
  input: string
  ring: string
  radius: string
}

export interface Theme {
  id: string
  slug: string
  name: string
  description?: string
  colors: ThemeColors
}

interface ThemeContextType {
  theme: string
  themes: Theme[]
  setTheme: (themeSlug: string) => Promise<void>
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: string
  themes: Theme[]
}

export function ThemeProvider({
  children,
  defaultTheme = 'blanco',
  themes,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<string>(defaultTheme)
  const [isLoading, setIsLoading] = useState(false)

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
  }, [theme])

  // Load saved theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme && themes.find(t => t.slug === savedTheme)) {
      setThemeState(savedTheme)
    }
  }, [themes])

  const setTheme = async (themeSlug: string) => {
    setIsLoading(true)
    try {
      // Validate theme exists
      if (!themes.find(t => t.slug === themeSlug)) {
        throw new Error(`Theme "${themeSlug}" not found`)
      }

      // Save to localStorage
      localStorage.setItem('theme', themeSlug)

      // Update state
      setThemeState(themeSlug)

      // Save to database (backend will handle persistence)
      await apiClient.post('/api/user/theme', { themeSlug })
        .catch(err => {
          console.warn('Failed to save theme preference to database:', err)
          // Non-blocking: theme still works from localStorage
        })
    } catch (error) {
      console.error('Error setting theme:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themes,
        setTheme,
        isLoading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * useTheme Hook
 *
 * Access theme context from any component.
 */
export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
