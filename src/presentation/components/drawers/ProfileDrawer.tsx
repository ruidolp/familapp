'use client'

import { LogOut, User } from 'lucide-react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
} from '@/components/ui/drawer'

interface ProfileDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userName?: string | null
  userEmail?: string | null
  onLogout: () => void
}

export function ProfileDrawer({
  open,
  onOpenChange,
  userName,
  userEmail,
  onLogout,
}: ProfileDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="left">
      <DrawerContent
        className="h-full w-[80%] rounded-r-3xl"
        style={{
          boxShadow: '10px 0 40px rgba(0,0,0,0.2)',
        }}
      >
        {/* Header con info del usuario */}
        <DrawerHeader className="border-b border-slate-200 pb-6">
          {/* Círculo de perfil grande */}
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl"
            style={{
              boxShadow: '0 10px 30px rgba(147, 51, 234, 0.3)',
            }}
          >
            <User className="w-12 h-12 text-white" />
          </div>

          <DrawerTitle className="text-2xl font-bold text-center font-display">
            {userName || 'Usuario'}
          </DrawerTitle>

          {userEmail && (
            <DrawerDescription className="text-center text-slate-500 mt-2">
              {userEmail}
            </DrawerDescription>
          )}
        </DrawerHeader>

        {/* Contenido del menú */}
        <DrawerBody>
          <div className="space-y-2">
            {/* Botón Cerrar Sesión */}
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 border border-red-200 transition-all group shadow-md hover:shadow-xl"
              style={{
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.15)',
              }}
            >
              <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <LogOut className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-lg font-semibold text-red-700 font-display">
                  Cerrar Sesión
                </p>
                <p className="text-sm text-red-600">
                  Salir de la aplicación
                </p>
              </div>
            </button>

            {/* Más opciones de menú en el futuro */}
            {/* <button>...</button> */}
          </div>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}
