/**
 * AppShell.tsx - Layout Principal de WAPP
 *
 * ⚠️  ESTRUCTURA CRÍTICA - NO MODIFICAR LAS CLASES DE LAYOUT ⚠️
 *
 * Este componente define la estructura de altura fija de la app.
 * Cualquier modificación a las clases flex/height romperá el layout.
 *
 * ESTRUCTURA:
 * ┌─────────────────────┐
 * │      HEADER         │  ← shrink-0, altura fija
 * ├─────────────────────┤
 * │                     │
 * │       CARD          │  ← flex-1, scroll interno
 * │    (contenido)      │
 * │                     │
 * ├─────────────────────┤
 * │    DOT INDICATOR    │  ← shrink-0, altura fija (solo en Sobres)
 * ├─────────────────────┤
 * │      FOOTER         │  ← shrink-0, altura fija
 * └─────────────────────┘
 */

import React, { ReactNode } from 'react'

interface AppShellProps {
  // Contenido del header
  headerContent: ReactNode

  // Contenido principal (Card)
  children: ReactNode

  // Contenido del footer (navegación)
  footerContent: ReactNode

  // Dot indicator - solo se muestra si se proporciona
  dotIndicator?: ReactNode

  // Alturas personalizables (en pixels)
  headerHeight?: number
  footerHeight?: number
  dotIndicatorHeight?: number
}

export function AppShell({
  headerContent,
  children,
  footerContent,
  dotIndicator,
  headerHeight = 60,
  footerHeight = 80,
  dotIndicatorHeight = 40,
}: AppShellProps) {
  return (
    // CONTENEDOR RAÍZ - SIEMPRE h-screen flex flex-col
    <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden">

      {/* ========== HEADER ========== */}
      {/* shrink-0: NUNCA cambia de tamaño */}
      <header
        className="shrink-0 bg-gray-800/50 backdrop-blur-md border-b border-white/10"
        style={{ height: `${headerHeight}px` }}
      >
        {headerContent}
      </header>

      {/* ========== MAIN BODY ========== */}
      {/* flex-1: toma espacio restante | overflow-hidden: contiene el scroll */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* ===== CARD/CONTENIDO ===== */}
        {/* flex-1: crece para llenar | min-h-0: permite shrink en flex | overflow-y-auto: scroll interno */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {children}
        </div>

        {/* ===== DOT INDICATOR ===== */}
        {/* Solo se renderiza si existe | shrink-0: NUNCA cambia de tamaño */}
        {dotIndicator && (
          <div
            className="shrink-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm"
            style={{ height: `${dotIndicatorHeight}px` }}
          >
            {dotIndicator}
          </div>
        )}
      </main>

      {/* ========== FOOTER ========== */}
      {/* shrink-0: NUNCA cambia de tamaño */}
      <footer
        className="shrink-0 bg-gray-800/50 backdrop-blur-md border-t border-white/10"
        style={{ height: `${footerHeight}px` }}
      >
        {footerContent}
      </footer>
    </div>
  )
}

export default AppShell
