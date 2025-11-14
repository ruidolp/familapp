'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { HexColorPicker } from 'react-colorful'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { notify } from '@/infrastructure/lib/notifications'
import { useInputFocus } from '@/presentation/hooks/useInputFocus'

interface CrearSobreDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  onSobreCreated?: (sobre: any) => void
}

const COLORES_SUGERIDOS = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#06b6d4',
  '#64748b',
]

export function CrearSobreDrawer({
  open,
  onOpenChange,
  userId,
  onSobreCreated,
}: CrearSobreDrawerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [sobreName, setSobreName] = useState('')
  const [sobreColor, setSobreColor] = useState(COLORES_SUGERIDOS[0])
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [existingSobres, setExistingSobres] = useState<string[]>([])

  // Ref para focus
  const sobreNombreRef = useRef<HTMLInputElement>(null)
  useInputFocus(sobreNombreRef, 350)

  // Al abrir, cargar sobres existentes
  useEffect(() => {
    if (open) {
      setSobreName('')
      setSobreColor(COLORES_SUGERIDOS[0])
      setShowColorPicker(false)
      fetchExistingSobres()
    }
  }, [open])

  const fetchExistingSobres = async () => {
    try {
      const response = await fetch('/api/sobres')
      if (response.ok) {
        const data = await response.json()
        const nombres = data.sobres.map((s: any) => s.nombre.toLowerCase().trim())
        setExistingSobres(nombres)
      }
    } catch (error) {
      console.error('Error al cargar sobres:', error)
    }
  }

  const handleCrearSobre = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const nombreTrimmed = sobreName.trim()

      // Validar duplicado
      if (existingSobres.includes(nombreTrimmed.toLowerCase())) {
        notify.duplicate('sobre', 'nombre')
        setLoading(false)
        return
      }

      // Crear el sobre
      const response = await fetch('/api/sobres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          nombre: nombreTrimmed,
          tipo: 'GASTO',
          presupuestoAsignado: 0,
          color: sobreColor,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.requiresOnboarding) {
          notify.warning('Configuración requerida', data.error)
        } else {
          notify.error(data.error)
        }
        setLoading(false)
        return
      }

      notify.created('Sobre')

      // Reset
      setSobreName('')
      setSobreColor(COLORES_SUGERIDOS[0])
      setShowColorPicker(false)

      // Close drawer
      onOpenChange(false)

      // Callback - paso del sobre para que SobresScreen abra AgregarPresupuestoDrawer
      onSobreCreated?.(data.sobre)

      // Refresh page
      router.refresh()
    } catch (err: any) {
      notify.error(err.message || 'Error al crear el sobre')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Crear Nuevo Sobre</DrawerTitle>
          <DrawerDescription>
            Define el nombre y color de tu sobre. Luego asignarás presupuesto desde una billetera.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody>
          <form onSubmit={handleCrearSobre} className="space-y-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="nombre-sobre">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={sobreNombreRef}
                id="nombre-sobre"
                value={sobreName}
                onChange={(e) => setSobreName(e.target.value)}
                placeholder="Ej: Comida, Transporte, Hogar"
                required
              />
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap items-center">
                {COLORES_SUGERIDOS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setSobreColor(c)
                      setShowColorPicker(false)
                    }}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      sobreColor === c && !showColorPicker
                        ? 'border-slate-900 scale-110'
                        : 'border-slate-300 hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}

                <button
                  type="button"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center text-xs font-bold ${
                    showColorPicker
                      ? 'border-slate-900 bg-slate-100'
                      : 'border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  +
                </button>
              </div>

              {showColorPicker && (
                <div className="mt-3 p-3 border border-slate-300 rounded-lg bg-white">
                  <HexColorPicker color={sobreColor} onChange={setSobreColor} />
                  <div className="mt-3 flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded border border-slate-300"
                      style={{ backgroundColor: sobreColor }}
                    />
                    <Input
                      type="text"
                      value={sobreColor}
                      onChange={(e) => setSobreColor(e.target.value)}
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </form>
        </DrawerBody>

        <DrawerFooter>
          <Button
            onClick={handleCrearSobre}
            disabled={loading || !sobreName.trim()}
            className="w-full"
          >
            {loading ? 'Creando...' : 'Crear Sobre'}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" disabled={loading} className="w-full mb-4">
              Cancelar
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
