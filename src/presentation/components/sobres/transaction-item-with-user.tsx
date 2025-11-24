/**
 * Transaction Item with User Component
 *
 * Componente para mostrar una transacción con información del usuario que la creó
 * Útil para sobres compartidos donde múltiples usuarios pueden crear gastos
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/presentation/components/ui/avatar'
import { Badge } from '@/presentation/components/ui/badge'
import { cn } from '@/infrastructure/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface Usuario {
  id: string
  nombre?: string
  email?: string
  avatar?: string
}

interface Categoria {
  id: string
  nombre: string
  emoji?: string
}

interface Subcategoria {
  id: string
  nombre: string
  emoji?: string
}

interface TransactionItemWithUserProps {
  transaction: {
    id: string
    monto: number
    fecha: Date | string
    descripcion?: string
    tipo: string
    categoria?: Categoria | null
    subcategoria?: Subcategoria | null
    usuario: Usuario
    usuario_id: string
  }
  currentUserId?: string
  onClick?: () => void
  className?: string
  showDate?: boolean
}

export function TransactionItemWithUser({
  transaction,
  currentUserId,
  onClick,
  className,
  showDate = true,
}: TransactionItemWithUserProps) {
  const isCurrentUser = currentUserId === transaction.usuario_id
  const fecha = typeof transaction.fecha === 'string' ? new Date(transaction.fecha) : transaction.fecha

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* Avatar del usuario */}
      <Avatar className="h-10 w-10">
        <AvatarImage src={transaction.usuario.avatar} />
        <AvatarFallback className="text-xs">
          {transaction.usuario.nombre?.[0]?.toUpperCase() || transaction.usuario.email?.[0]?.toUpperCase() || '?'}
        </AvatarFallback>
      </Avatar>

      {/* Información de la transacción */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Emoji y nombre de categoría */}
          <span className="font-medium truncate">
            {transaction.categoria?.emoji} {transaction.categoria?.nombre || 'Sin categoría'}
          </span>

          {/* Badge con nombre de usuario (si no es el actual) */}
          {!isCurrentUser && transaction.usuario.nombre && (
            <Badge variant="outline" className="text-xs shrink-0">
              {transaction.usuario.nombre}
            </Badge>
          )}
        </div>

        {/* Subcategoría o descripción */}
        {(transaction.subcategoria?.nombre || transaction.descripcion) && (
          <p className="text-sm text-muted-foreground truncate">
            {transaction.subcategoria?.nombre || transaction.descripcion}
          </p>
        )}

        {/* Fecha */}
        {showDate && (
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(fecha, {
              addSuffix: true,
              locale: es,
            })}
          </p>
        )}
      </div>

      {/* Monto */}
      <div className="text-right shrink-0">
        <span className={cn(
          'font-bold text-lg',
          transaction.tipo === 'INGRESO' ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'
        )}>
          {transaction.tipo === 'INGRESO' ? '+' : '-'}${Math.abs(transaction.monto).toLocaleString('es-CL')}
        </span>
      </div>
    </div>
  )
}
