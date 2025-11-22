'use client'

/**
 * PauseExecutionDrawer Component
 *
 * Confirms that the user wants to pause the current purchase execution
 * and return to the shopping lists screen
 */

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetHeader,
} from '@/presentation/components/ui/sheet'
import { Button } from '@/presentation/components/ui/button'
import { AlertCircle, PauseCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useTranslations } from 'next-intl'

interface PauseExecutionDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function PauseExecutionDrawer({
  open,
  onOpenChange,
  onConfirm,
}: PauseExecutionDrawerProps) {
  const t = useTranslations('shopping.execution.pause')

  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[450px]">
        <SheetHeader className="space-y-3">
          <SheetTitle className="text-xl font-bold flex items-center gap-2">
            <PauseCircle className="h-5 w-5 text-primary" />
            {t('title')}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <Card className="space-y-3 border-border bg-muted/40 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full bg-primary/10 p-2">
                <AlertCircle className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-foreground">
                  {t('cardSummary')}
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>{t('autoSave')}</li>
                  <li>{t('resumeHint')}</li>
                </ul>
              </div>
            </div>
          </Card>

          <div className="space-y-3 pt-4">
            <Button
              onClick={handleConfirm}
              variant="default"
              className="w-full h-11"
            >
              {t('confirm')}
            </Button>

            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full h-11"
            >
              {t('continue')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
