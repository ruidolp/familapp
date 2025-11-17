/**
 * Header Component
 *
 * Header fijo superior con:
 * - Título dinámico según la sección activa (izquierda/centro)
 * - Menú hamburguesa con selector de temas y logout (derecha)
 */

'use client'

import { Menu, LogOut, Palette, Check, Mail } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useTheme } from '@/presentation/providers/theme-provider'

type TabType = 'listas' | 'sobres' | 'metricas' | 'config'

interface HeaderProps {
  activeTab: TabType
  sobreNombre?: string
  sobreEmoji?: string
  sobrePresupuesto?: number
}

export function Header({ activeTab, sobreNombre, sobreEmoji, sobrePresupuesto }: HeaderProps) {
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

  // Determinar el título según la tab activa
  const getTitulo = () => {
    switch (activeTab) {
      case 'listas':
        return 'Listas'
      case 'sobres':
        if (sobreNombre) {
          return (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Mail size={20} className="text-foreground/80 flex-shrink-0" />
              <span className="font-semibold truncate">{sobreNombre}</span>
              {sobrePresupuesto !== undefined && (
                <span className="text-sm text-muted-foreground ml-auto whitespace-nowrap">
                  Presupuesto: ${Number(sobrePresupuesto).toFixed(2)}
                </span>
              )}
            </div>
          )
        }
        return 'Sobres'
      case 'metricas':
        return 'Métricas'
      case 'config':
        return 'Config'
      default:
        return 'WAPP'
    }
  }

  return (
    <div className="h-full flex items-center justify-between px-4 border-b bg-card">
      {/* Título dinámico */}
      <div className="flex-1 min-w-0 mr-4">
        {typeof getTitulo() === 'string' ? (
          <h1 className="text-lg font-semibold text-foreground truncate">
            {getTitulo()}
          </h1>
        ) : (
          getTitulo()
        )}
      </div>

      {/* Menú hamburguesa con selector de temas y logout */}
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
          <DropdownMenuSeparator />

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

          {/* Separador antes de logout */}
          <DropdownMenuSeparator />

          {/* Logout */}
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <div className="flex items-center gap-2 w-full">
              <LogOut className="h-4 w-4" />
              <span>Cerrar sesión</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
