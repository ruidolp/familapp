'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useInputFocus } from '@/presentation/hooks/useInputFocus'

interface CrearBilleteraDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
}

const TIPOS_BILLETERA = [
  { value: 'DEBITO', label: 'Débito' },
  { value: 'CREDITO', label: 'Crédito' },
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'AHORRO', label: 'Ahorro' },
  { value: 'INVERSION', label: 'Inversión' },
]

const COLORES_SUGERIDOS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#64748b', // slate
]

const EMOJIS_SUGERIDOS = ['💳', '💰', '🏦', '💵', '💴', '💶', '💷', '🪙']

export function CrearBilleteraDrawer({
  open,
  onOpenChange,
  userId,
}: CrearBilleteraDrawerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refs para inputs
  const nombreInputRef = useRef<HTMLInputElement>(null)
  const saldoInputRef = useRef<HTMLInputElement>(null)

  // Hook para auto-scroll en inputs
  useInputFocus(nombreInputRef, 350)
  useInputFocus(saldoInputRef, 350)

  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<string>('DEBITO')
  const [saldoInicial, setSaldoInicial] = useState('0')
  const [color, setColor] = useState(COLORES_SUGERIDOS[0])
  const [emoji, setEmoji] = useState(EMOJIS_SUGERIDOS[0])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Convertir saldo a número válido
      const saldoNumerico = saldoInicial && !isNaN(parseFloat(saldoInicial))
        ? parseFloat(saldoInicial)
        : 0

      const response = await fetch('/api/billeteras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          nombre: nombre.trim(),
          tipo,
          saldoInicial: saldoNumerico,
          color,
          emoji,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear billetera')
      }

      // Reset form
      setNombre('')
      setSaldoInicial('0')
      setColor(COLORES_SUGERIDOS[0])
      setEmoji(EMOJIS_SUGERIDOS[0])

      // Close drawer
      onOpenChange(false)

      // Refresh page
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Crear Nueva Billetera</DrawerTitle>
          <DrawerDescription>
            Agrega una cuenta de banco, efectivo, o tarjeta de crédito
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="nombre">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={nombreInputRef}
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Banco Nacional - Débito"
                required
              />
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <Label htmlFor="tipo">
                Tipo <span className="text-red-500">*</span>
              </Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_BILLETERA.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Saldo Inicial */}
            <div className="space-y-2">
              <Label htmlFor="saldo">Saldo Inicial</Label>
              <Input
                ref={saldoInputRef}
                id="saldo"
                type="number"
                step="0.01"
                value={saldoInicial}
                onChange={(e) => setSaldoInicial(e.target.value)}
                placeholder="0.00"
              />
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {COLORES_SUGERIDOS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      color === c
                        ? 'border-slate-900 scale-110'
                        : 'border-slate-300 hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Emoji */}
            <div className="space-y-2">
              <Label>Icono</Label>
              <div className="flex gap-2 flex-wrap">
                {EMOJIS_SUGERIDOS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`text-2xl w-12 h-12 rounded-lg border-2 transition-all ${
                      emoji === e
                        ? 'border-slate-900 bg-slate-100 scale-110'
                        : 'border-slate-300 hover:bg-slate-50 hover:scale-105'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                {error}
              </div>
            )}
          </form>
        </DrawerBody>

        <DrawerFooter>
          <Button type="submit" disabled={loading || !nombre.trim()} className="w-full" onClick={handleSubmit}>
            {loading ? 'Creando...' : 'Crear Billetera'}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" disabled={loading} className="w-full">
              Cancelar
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
