'use client'

import { Card } from '@/components/ui/card'
import { ReactNode } from 'react'

interface LockedMetricCardProps {
  title: string
  message: string
  icon: ReactNode
}

export function LockedMetricCard({ title, message, icon }: LockedMetricCardProps) {
  return (
    <Card className="p-6 bg-muted/30 border-dashed">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          {icon}
        </div>
        <div className="space-y-2">
          <h4 className="typography-h4 text-foreground">{title}</h4>
          <p className="typography-body-sm text-muted-foreground">
            {message}
          </p>
        </div>
      </div>
    </Card>
  )
}
