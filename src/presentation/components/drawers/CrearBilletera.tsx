'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { notify } from '@/infrastructure/lib/notifications'
import { useInputFocus } from '@/presentation/hooks/useInputFocus'

interface CrearBilleteraProps {
  userId: string
  onSuccess?: (billetera: any) => void
  onCancel?: () => void
  isInline?: boolean // Para mostrar textos de "billetera" cuando se usa inline
}

const TIPOS_BILLETERA = [
  { value: 'DEBITO', label: 'Débito' },
  { value: 'CREDITO', label: 'Crédito' },
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'AHORRO', label: 'Ahorro' },
  { value: 'INVERSION', label: 'Inversión' },
]

export function CrearBilleteraForm({
  userId,
  onSuccess,
  onCancel,
  isInline = false,
}: CrearBilleteraProps) {
  const [loading, setLoading] = useState(false)
  const [billeteraNombre, setBilleteraNombre] = useState('')
  const [billeteraType, setBilleteraType] = useState('EFECTIVO')
  const [billeteraSaldo, setBilleteraSaldo] = useState('')

  const billeteraNombreRef = useRef<HTMLInputElement>(null)
  const billeteraSaldoRef = useRef<HTMLInputElement>(null)

  useInputFocus(billeteraNombreRef, 350)
  useInputFocus(billeteraSaldoRef, 350)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const saldoInicial = parseFloat(billeteraSaldo) || 0

      const response = await fetch('/api/billeteras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          nombre: billeteraNombre.trim(),
          tipo: billeteraType,
          saldoInicial,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        notify.error(data.error || 'Error al crear billetera')
        setLoading(false)
        return
      }

      notify.success('Billetera creada')

      // Resetear form
      setBilleteraNombre('')
      setBilleteraType('EFECTIVO')
      setBilleteraSaldo('')

      // Callback
      onSuccess?.(data.billetera)
      setLoading(false)
    } catch (err: any) {
      notify.error(err.message || 'Error al crear billetera')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nombre-billetera">
          Nombre <span className="text-red-500">*</span>
        </Label>
        <Input
          ref={billeteraNombreRef}
          id="nombre-billetera"
          value={billeteraNombre}
          onChange={(e) => setBilleteraNombre(e.target.value)}
          placeholder="Ej: Mi Tarjeta, Efectivo"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tipo-billetera">
          Tipo <span className="text-red-500">*</span>
        </Label>
        <Select value={billeteraType} onValueChange={setBilleteraType}>
          <SelectTrigger id="tipo-billetera">
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

      <div className="space-y-2">
        <Label htmlFor="saldo-billetera">
          Saldo Inicial <span className="text-red-500">*</span>
        </Label>
        <Input
          ref={billeteraSaldoRef}
          id="saldo-billetera"
          type="number"
          step="0.01"
          min="0"
          value={billeteraSaldo}
          onChange={(e) => setBilleteraSaldo(e.target.value)}
          placeholder="0.00"
          required
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          type="submit"
          disabled={loading || !billeteraNombre.trim()}
          className="flex-1"
        >
          {loading ? 'Creando...' : 'Crear Billetera'}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="flex-1"
          >
            Atrás
          </Button>
        )}
      </div>
    </form>
  )
}
