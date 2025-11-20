'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
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
  { value: 'DEBITO', labelKey: 'billeteras.types.DEBITO' },
  { value: 'CREDITO', labelKey: 'billeteras.types.CREDITO' },
  { value: 'EFECTIVO', labelKey: 'billeteras.types.EFECTIVO' },
  { value: 'AHORRO', labelKey: 'billeteras.types.AHORRO' },
  { value: 'INVERSION', labelKey: 'billeteras.types.INVERSION' },
]

export function CrearBilleteraForm({
  userId,
  onSuccess,
  onCancel,
  isInline = false,
}: CrearBilleteraProps) {
  const t = useTranslations()
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

      notify.success(t('common.success'))

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
          {t('billeteras.fields.name')} <span className="text-red-500">*</span>
        </Label>
        <Input
          ref={billeteraNombreRef}
          id="nombre-billetera"
          value={billeteraNombre}
          onChange={(e) => setBilleteraNombre(e.target.value)}
          placeholder={t('billeteras.fields.namePlaceholder')}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tipo-billetera">
          {t('billeteras.fields.type')} <span className="text-red-500">*</span>
        </Label>
        <Select value={billeteraType} onValueChange={setBilleteraType}>
          <SelectTrigger id="tipo-billetera">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIPOS_BILLETERA.map((tipo) => (
              <SelectItem key={tipo.value} value={tipo.value}>
                {t(tipo.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="saldo-billetera">
          {t('billeteras.fields.initialBalance')} <span className="text-red-500">*</span>
        </Label>
        <Input
          ref={billeteraSaldoRef}
          id="saldo-billetera"
          type="number"
          step="0.01"
          min="0"
          value={billeteraSaldo}
          onChange={(e) => setBilleteraSaldo(e.target.value)}
          placeholder={t('billeteras.fields.initialBalancePlaceholder')}
          required
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          type="submit"
          disabled={loading || !billeteraNombre.trim()}
          className="flex-1"
        >
          {loading ? t('billeteras.create.submitting') : t('billeteras.create.submit')}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="flex-1"
          >
            {t('common.back')}
          </Button>
        )}
      </div>
    </form>
  )
}
