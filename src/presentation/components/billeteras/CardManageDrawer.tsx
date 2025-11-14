/**
 * CardManageDrawer - Crear/Editar billetera unificado
 */

import { useTranslations } from 'next-intl'
import { useState, useEffect, useRef } from 'react'
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
import { Switch } from '@/components/ui/switch'
import {
  useCreateBilletera,
  useUpdateBilletera,
  type Billetera,
} from '@/presentation/hooks/useBilleteras'
import { useInputFocus } from '@/presentation/hooks/useInputFocus'

interface CardManageDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  billetera?: Billetera | null
}

const TIPOS = ['DEBITO', 'CREDITO', 'EFECTIVO', 'AHORRO', 'INVERSION'] as const

export function CardManageDrawer({
  open,
  onOpenChange,
  billetera,
}: CardManageDrawerProps) {
  const t = useTranslations('billeteras')
  const isEdit = !!billetera

  const createMutation = useCreateBilletera()
  const updateMutation = useUpdateBilletera()

  // Refs para inputs
  const nombreInputRef = useRef<HTMLInputElement>(null)
  const saldoInputRef = useRef<HTMLInputElement>(null)
  const tasaInputRef = useRef<HTMLInputElement>(null)

  // Hook para auto-scroll en inputs
  useInputFocus(nombreInputRef, 350)
  useInputFocus(saldoInputRef, 350)
  useInputFocus(tasaInputRef, 350)

  // Form state
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<typeof TIPOS[number]>('DEBITO')
  const [isCompartida, setIsCompartida] = useState(false)
  const [tieneInteres, setTieneInteres] = useState(false)
  const [tasaInteres, setTasaInteres] = useState('')
  const [saldoInicial, setSaldoInicial] = useState('')

  // Reset form cuando abre/cierra o cambia billetera
  useEffect(() => {
    if (open) {
      if (billetera) {
        setNombre(billetera.nombre)
        setTipo(billetera.tipo)
        setIsCompartida(billetera.is_compartida)
        setTieneInteres(!!billetera.tasa_interes)
        setTasaInteres(billetera.tasa_interes?.toString() || '')
        setSaldoInicial('')
      } else {
        setNombre('')
        setTipo('DEBITO')
        setIsCompartida(false)
        setTieneInteres(false)
        setTasaInteres('')
        setSaldoInicial('')
      }
    }
  }, [open, billetera])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const tasaInteresValue = tieneInteres && tasaInteres
      ? parseFloat(tasaInteres)
      : null

    if (isEdit && billetera) {
      // Actualizar billetera
      await updateMutation.mutateAsync({
        id: billetera.id,
        nombre,
        tipo,
        isCompartida,
        tasaInteres: tasaInteresValue,
      })
    } else {
      // Crear billetera
      await createMutation.mutateAsync({
        nombre,
        tipo,
        saldoInicial: parseFloat(saldoInicial) || 0,
        isCompartida,
        tasaInteres: tasaInteresValue,
      })
    }

    onOpenChange(false)
  }

  const loading = createMutation.isPending || updateMutation.isPending

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            {isEdit ? t('edit.title') : t('create.title')}
          </DrawerTitle>
          <DrawerDescription>
            {isEdit ? billetera?.nombre : t('emptyDescription')}
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="nombre">
                {t('fields.name')} <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={nombreInputRef}
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder={t('fields.namePlaceholder')}
                required
              />
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <Label htmlFor="tipo">
                {t('fields.type')} <span className="text-red-500">*</span>
              </Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as typeof TIPOS[number])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t_tipo) => (
                    <SelectItem key={t_tipo} value={t_tipo}>
                      {t(`types.${t_tipo}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Compartida */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>{t('fields.shared')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('fields.sharedDescription')}
                </p>
              </div>
              <Switch checked={isCompartida} onCheckedChange={setIsCompartida} />
            </div>

            {/* Interés */}
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label>{t('fields.interest')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('fields.interestDescription')}
                  </p>
                </div>
                <Switch checked={tieneInteres} onCheckedChange={setTieneInteres} />
              </div>

              {tieneInteres && (
                <div className="space-y-2">
                  <Label htmlFor="tasaInteres">
                    {t('fields.interestRate')}
                  </Label>
                  <Input
                    ref={tasaInputRef}
                    id="tasaInteres"
                    type="number"
                    step="0.01"
                    value={tasaInteres}
                    onChange={(e) => setTasaInteres(e.target.value)}
                    placeholder={t('fields.interestRatePlaceholder')}
                  />
                </div>
              )}
            </div>

            {/* Saldo Inicial (solo crear) */}
            {!isEdit && (
              <div className="space-y-2">
                <Label htmlFor="saldoInicial">
                  {t('fields.initialBalance')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  ref={saldoInputRef}
                  id="saldoInicial"
                  type="number"
                  step="0.01"
                  value={saldoInicial}
                  onChange={(e) => setSaldoInicial(e.target.value)}
                  placeholder={t('fields.initialBalancePlaceholder')}
                  required
                />
              </div>
            )}
          </form>
        </DrawerBody>

        <DrawerFooter>
          <Button type="submit" disabled={loading} className="w-full" onClick={handleSubmit}>
            {loading
              ? isEdit ? t('edit.submitting') : t('create.submitting')
              : isEdit ? t('edit.submit') : t('create.submit')}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" disabled={loading} className="w-full">
              {t('delete.cancel')}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
