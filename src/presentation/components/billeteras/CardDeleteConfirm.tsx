/**
 * CardDeleteConfirm - Modal de confirmación para eliminar billetera
 */

import { useTranslations } from 'next-intl'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  useDeleteBilletera,
  useLinkedEnvelopes,
  type Billetera,
} from '@/presentation/hooks/useBilleteras'

interface CardDeleteConfirmProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  billetera: Billetera | null
}

export function CardDeleteConfirm({
  open,
  onOpenChange,
  billetera,
}: CardDeleteConfirmProps) {
  const t = useTranslations('billeteras')
  const deleteMutation = useDeleteBilletera()
  const { data: linkedData } = useLinkedEnvelopes(billetera?.id || '')

  const handleDelete = async () => {
    if (!billetera) return
    await deleteMutation.mutateAsync(billetera.id)
    onOpenChange(false)
  }

  if (!billetera) return null

  const hasLinkedEnvelopes = linkedData?.hasLinkedEnvelopes || false
  const envelopesCount = linkedData?.count || 0

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            {t('delete.title')}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>{t('delete.confirm')}</p>
            <p className="font-medium text-foreground">
              {billetera.nombre}
            </p>
            <p className="text-sm">{t('delete.warning')}</p>

            {/* Mostrar impacto si hay sobres vinculados */}
            {hasLinkedEnvelopes && (
              <div className="rounded-lg bg-muted p-3 space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {t('delete.linkedEnvelopes')}
                </p>
                <p className="text-sm">
                  {t('delete.linkedEnvelopesDescription', { count: envelopesCount })}
                </p>
                <p className="text-sm text-red-600">
                  {t('delete.impactWarning')}
                </p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            {t('delete.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleteMutation.isPending
              ? t('delete.submitting')
              : t('delete.submit')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
