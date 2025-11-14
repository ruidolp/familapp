/**
 * AppShell Layout - Mobile Structure
 *
 * Layout base tipo app móvil con:
 * - Header fijo superior (56px)
 * - Body scrollable central
 * - Footer fijo inferior (64px) con bottom navigation
 */

interface AppShellProps {
  header: React.ReactNode
  footer: React.ReactNode
  children: React.ReactNode
}

export function AppShell({ header, footer, children }: AppShellProps) {
  return (
    <div className="flex flex-col h-[100vh] h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* Header fijo */}
      <header className="h-14 flex-shrink-0">
        {header}
      </header>

      {/* Body scrollable */}
      <main className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        {children}
      </main>

      {/* Footer fijo */}
      <footer className="h-16 flex-shrink-0">
        {footer}
      </footer>
    </div>
  )
}
