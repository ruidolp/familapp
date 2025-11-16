/**
 * Header Component
 *
 * Header fijo superior con:
 * - Avatar del usuario (izquierda)
 * - Logo WAPP (centro) - Click para cerrar sesión
 * - Menú hamburguesa con selector de temas (derecha)
 */

'use client'

import { Menu, LogOut, Palette, Check } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from '@/presentation/providers/theme-provider'

interface HeaderProps {
  userName?: string | null
  userImage?: string | null
}

export function Header({ userName, userImage }: HeaderProps) {
  const { theme: currentTheme, themes, setTheme, isLoading } = useTheme()

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

  const initials = userName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??'

  return (
    <div className="h-full flex items-center justify-between px-4 border-b bg-card">
      {/* Avatar usuario */}
      <Button variant="ghost" size="icon" className="rounded-full">
        <Avatar className="h-8 w-8">
          <AvatarImage src={userImage || undefined} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </Button>

      {/* Logo WAPP - Click para cerrar sesión */}
      <Button
        variant="ghost"
        className="text-xl font-bold tracking-tight text-foreground hover:bg-transparent"
        onClick={() => signOut({ callbackUrl: '/auth/login' })}
        title="Cerrar sesión"
      >
        <span className="mr-2">WAPP</span>
        <LogOut className="h-4 w-4 opacity-50" />
      </Button>

      {/* Menú hamburguesa con selector de temas */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isLoading}>
            <Menu className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {/* Header del menú */}
          <div className="px-2 py-1.5 flex items-center gap-2 text-sm font-semibold">
            <Palette className="h-4 w-4" />
            <span>Temas</span>
          </div>

          {/* Separador */}
          <div className="my-1 h-px bg-border" />

          {/* Temas disponibles */}
          {themes.length > 0 ? (
            themes.map((theme) => (
              <DropdownMenuItem
                key={theme.slug}
                onClick={() => handleThemeChange(theme.slug)}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    {/* Color preview */}
                    <div
                      className="h-4 w-4 rounded-full border-2 border-foreground/20"
                      style={{
                        backgroundColor: `hsl(${theme.colors.primary})`,
                      }}
                    />
                    <span className="text-sm">{theme.name}</span>
                  </div>
                  {currentTheme === theme.slug && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              No themes available
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
