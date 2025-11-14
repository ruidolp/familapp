/**
 * Theme Selector Component
 *
 * Dropdown to select and switch themes.
 * Shows current theme with color preview.
 */

'use client'

import { useTheme } from '@/presentation/providers/theme-provider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Palette, Check } from 'lucide-react'

export function ThemeSelector() {
  const { theme: currentTheme, themes, setTheme, isLoading } = useTheme()

  const selectedTheme = themes.find(t => t.slug === currentTheme)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isLoading}>
          <Palette className="mr-2 h-4 w-4" />
          {selectedTheme?.name || 'Theme'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {themes.map((theme) => (
          <DropdownMenuItem
            key={theme.slug}
            onClick={() => setTheme(theme.slug)}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                {/* Color preview */}
                <div
                  className="h-4 w-4 rounded-full border"
                  style={{
                    backgroundColor: `hsl(${theme.colors.primary})`,
                  }}
                />
                <span>{theme.name}</span>
              </div>
              {currentTheme === theme.slug && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
