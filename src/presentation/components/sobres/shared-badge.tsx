/**
 * Shared Badge Component
 *
 * Badge para indicar que un sobre es compartido
 */

import { Badge } from '@/presentation/components/ui/badge'
import { Users } from 'lucide-react'
import { cn } from '@/infrastructure/lib/utils'

interface SharedBadgeProps {
  className?: string
  showIcon?: boolean
}

export function SharedBadge({ className, showIcon = true }: SharedBadgeProps) {
  return (
    <Badge variant="secondary" className={cn("gap-1", className)}>
      {showIcon && <Users className="h-3 w-3" />}
      Compartido
    </Badge>
  )
}
