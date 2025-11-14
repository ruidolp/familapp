/**
 * CardsList - Lista de billeteras
 */

import { useTranslations } from 'next-intl'
import { Plus, ArrowRightLeft, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Billetera } from '@/presentation/hooks/useBilleteras'

interface CardsListProps {
  billeteras: Billetera[]
  onDeposito: (billetera: Billetera) => void
  onDelete: (billetera: Billetera) => void
  onTransfer: (billetera: Billetera) => void
  onInfo: (billetera: Billetera) => void
}

export function CardsList({
  billeteras,
  onDeposito,
  onDelete,
  onTransfer,
  onInfo,
}: CardsListProps) {
  const t = useTranslations('billeteras')

  if (billeteras.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground mb-2">{t('empty')}</p>
        <p className="text-sm text-muted-foreground">{t('emptyDescription')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {billeteras.map((billetera) => (
        <div
          key={billetera.id}
          className="rounded-lg border bg-wallet-card p-4 space-y-3"
        >
          {/* Header con nombre y tipo */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">
                {billetera.nombre}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t(`types.${billetera.tipo}`)}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onInfo(billetera)}>
                  {t('actions.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onTransfer(billetera)}>
                  {t('actions.transfer')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(billetera)}
                  className="text-red-600"
                >
                  {t('actions.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Saldos */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                {t('balance.real')}
              </p>
              <p className={`text-lg font-bold ${Number(billetera.saldo_real) < 0 ? 'text-red-600' : 'text-foreground'}`}>
                ${Number(billetera.saldo_real).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                {t('balance.projected')}
              </p>
              <p className={`text-lg font-bold ${Number(billetera.saldo_proyectado) < 0 ? 'text-red-600' : 'text-foreground'}`}>
                ${Number(billetera.saldo_proyectado).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Badges */}
          {(billetera.is_compartida || billetera.tasa_interes) && (
            <div className="flex gap-2">
              {billetera.is_compartida && (
                <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">
                  {t('fields.shared')}
                </span>
              )}
              {billetera.tasa_interes && (
                <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">
                  {t('fields.interest')}: {billetera.tasa_interes}%
                </span>
              )}
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-2 pt-2.5">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onDeposito(billetera)}
            >
              <Plus className="h-3 w-3 mr-2" />
              {t('actions.deposit')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onTransfer(billetera)}
            >
              <ArrowRightLeft className="h-3 w-3 mr-2" />
              {t('actions.transfer')}
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
