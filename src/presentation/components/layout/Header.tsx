/**
 * Header Component
 *
 * Header fijo superior con:
 * - Avatar del usuario (izquierda)
 * - Logo WAPP (centro) - Click para cerrar sesión
 * - Menú hamburguesa (derecha)
 */

'use client'

import { Menu, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  userName?: string | null
  userImage?: string | null
}

export function Header({ userName, userImage }: HeaderProps) {
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

      {/* Menú hamburguesa */}
      <Button variant="ghost" size="icon">
        <Menu className="h-5 w-5" />
      </Button>
    </div>
  )
}
