'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface CrearSobreDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
}

const TIPOS_SOBRE = [
  { value: 'GASTO', label: 'Gasto' },
  { value: 'AHORRO', label: 'Ahorro' },
  { value: 'DEUDA', label: 'Deuda' },
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

const EMOJIS_SUGERIDOS = ['🏠', '🍔', '🚗', '✈️', '🎮', '💊', '🎓', '🎁']

export function CrearSobreDialog({
  open,
  onOpenChange,
  userId,
}: CrearSobreDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<string>('GASTO')
  const [presupuesto, setPresupuesto] = useState('0')
  const [color, setColor] = useState(COLORES_SUGERIDOS[0])
  const [emoji, setEmoji] = useState(EMOJIS_SUGERIDOS[0])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/sobres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          nombre: nombre.trim(),
          tipo,
          presupuestoAsignado: parseFloat(presupuesto) || 0,
          color,
          emoji,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear sobre')
      }

      // Reset form
      setNombre('')
      setPresupuesto('0')
      setColor(COLORES_SUGERIDOS[0])
      setEmoji(EMOJIS_SUGERIDOS[0])

      // Close dialog
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Sobre</DialogTitle>
            <DialogDescription>
              Agrega un presupuesto para gestionar tus gastos
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Nombre */}
            <div className="grid gap-2">
              <Label htmlFor="nombre">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Hogar, Comida, Transporte"
                required
              />
            </div>

            {/* Tipo */}
            <div className="grid gap-2">
              <Label htmlFor="tipo">
                Tipo <span className="text-red-500">*</span>
              </Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_SOBRE.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Presupuesto */}
            <div className="grid gap-2">
              <Label htmlFor="presupuesto">
                Presupuesto Asignado (USD) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="presupuesto"
                type="number"
                step="0.01"
                value={presupuesto}
                onChange={(e) => setPresupuesto(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            {/* Color */}
            <div className="grid gap-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {COLORES_SUGERIDOS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
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
            <div className="grid gap-2">
              <Label>Icono</Label>
              <div className="flex gap-2">
                {EMOJIS_SUGERIDOS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`text-2xl w-10 h-10 rounded-lg border-2 transition-all ${
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
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !nombre.trim() || parseFloat(presupuesto) <= 0}
            >
              {loading ? 'Creando...' : 'Crear Sobre'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
