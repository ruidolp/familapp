'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, ShoppingCart, Trash2, Copy, MoreVertical, Clock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CreateShoppingListDrawer } from '@/components/drawers/CreateShoppingListDrawer'
import { notify } from '@/infrastructure/lib/notifications'
import { ExecutionStorage } from '@/infrastructure/utils/execution-storage'
import type { LocalShoppingExecution } from '@/domain/types/shopping-execution'

interface ShoppingList {
  id: string
  nombre: string
  descripcion?: string
  purchase_count: number
  created_at: string
  updated_at: string
  _itemCount?: number // Agregado por el backend si está disponible
}

interface ShoppingExecution {
  id: string
  shopping_list_id: string
  status: string
  store_name?: string | null
  started_at: string
  created_at: string
}

// Union type para soportar tanto ejecuciones del servidor como locales
type ExecutionDisplay = ShoppingExecution | (LocalShoppingExecution & { isLocal: true })

interface ListasScreenProps {
  userId: string
}

export function ListasScreen({ userId }: ListasScreenProps) {
  const router = useRouter()
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [activeExecutions, setActiveExecutions] = useState<ExecutionDisplay[]>([])
  const [loading, setLoading] = useState(false)
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false)

  // Cargar listas y ejecuciones activas al montar
  useEffect(() => {
    fetchLists()
    fetchActiveExecutions()
  }, [])

  const fetchLists = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/shopping-lists')
      if (response.ok) {
        const data = await response.json()
        setLists(data.lists || [])
      } else {
        notify.error('Error al cargar listas')
      }
    } catch (error) {
      console.error('Error fetching lists:', error)
      notify.error('Error al cargar listas')
    } finally {
      setLoading(false)
    }
  }

  const fetchActiveExecutions = async () => {
    try {
      // Cargar ejecuciones del servidor
      const serverExecutions: ShoppingExecution[] = []
      try {
        const response = await fetch('/api/shopping-executions')
        if (response.ok) {
          const data = await response.json()
          serverExecutions.push(...(data.executions || []))
        }
      } catch (error) {
        console.error('Error fetching server executions:', error)
      }

      // Cargar ejecuciones locales (IndexedDB)
      const localExecutions = await ExecutionStorage.getAllInProgress()
      const localExecutionsDisplay: ExecutionDisplay[] = localExecutions.map(exe => ({
        ...exe,
        isLocal: true,
      }))

      // Combinar ambas (evitando duplicados si existen)
      const serverIds = new Set(serverExecutions.map(e => e.id))
      const filtered = localExecutionsDisplay.filter(
        e => !serverIds.has(e.localId)
      )

      const combined = [...localExecutionsDisplay, ...serverExecutions]
      setActiveExecutions(combined)
    } catch (error) {
      console.error('Error fetching active executions:', error)
      // No mostrar error al usuario, es un feature secundario
    }
  }

  const handleOpenCreateDrawer = () => {
    setCreateDrawerOpen(true)
  }

  const handleCreateDrawerOpenChange = (open: boolean) => {
    setCreateDrawerOpen(open)
    // Refresh list when drawer closes (in case a list was created)
    if (!open) {
      fetchLists()
      fetchActiveExecutions()
    }
  }

  const handleDeleteList = async (listId: string, listName: string) => {
    if (!confirm(`¿Eliminar lista "${listName}"?`)) return

    try {
      const response = await fetch(`/api/shopping-lists/${listId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        notify.success('Lista eliminada')
        fetchLists()
      } else {
        notify.error('Error al eliminar lista')
      }
    } catch (error) {
      console.error('Error deleting list:', error)
      notify.error('Error al eliminar lista')
    }
  }

  const handleCloneList = async (listId: string, listName: string) => {
    try {
      const response = await fetch(`/api/shopping-lists/${listId}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newName: `${listName} (copia)`,
        }),
      })

      if (response.ok) {
        notify.success('Lista clonada')
        fetchLists()
        fetchActiveExecutions()
      } else {
        notify.error('Error al clonar lista')
      }
    } catch (error) {
      console.error('Error cloning list:', error)
      notify.error('Error al clonar lista')
    }
  }

  const handleOpenList = (listId: string) => {
    router.push(`/shopping-lists/${listId}`)
  }

  const handleOpenExecution = (execution: ExecutionDisplay) => {
    // Para ejecuciones locales usar localId, para del servidor usar id
    const id = (execution as any).localId || (execution as any).id
    router.push(`/shopping-executions/${id}`)
  }

  // Separate lists into pending and executed
  const pendingLists = lists.filter(list => list.purchase_count === 0)
  const executedLists = lists.filter(list => list.purchase_count > 0)

  // Helper to render a list card
  const renderListCard = (list: ShoppingList) => (
    <Card
      key={list.id}
      className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => handleOpenList(list.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base truncate">
            {list.nombre}
          </h3>
          {list.descripcion && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {list.descripcion}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span>
              {list._itemCount !== undefined
                ? `${list._itemCount} items`
                : 'Sin items'}
            </span>
            <span>•</span>
            <span>
              {list.purchase_count > 0
                ? `Usada ${list.purchase_count} veces`
                : 'Sin usar'}
            </span>
          </div>
        </div>

        {/* Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <MoreVertical size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                handleOpenList(list.id)
              }}
            >
              Abrir
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                handleCloneList(list.id, list.nombre)
              }}
            >
              <Copy size={14} className="mr-2" />
              Clonar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteList(list.id, list.nombre)
              }}
              className="text-destructive"
            >
              <Trash2 size={14} className="mr-2" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  )

  // Helper to render an execution card
  const renderExecutionCard = (execution: ExecutionDisplay) => {
    // Encontrar el nombre de la lista asociada
    const listName = lists.find(l => l.id === execution.shopping_list_id)?.nombre || 'Compra'
    const startDate = new Date(execution.started_at)
    const timeAgo = Math.floor((Date.now() - startDate.getTime()) / 1000)
    let timeText = ''
    if (timeAgo < 60) {
      timeText = 'Hace unos segundos'
    } else if (timeAgo < 3600) {
      timeText = `Hace ${Math.floor(timeAgo / 60)} min`
    } else if (timeAgo < 86400) {
      timeText = `Hace ${Math.floor(timeAgo / 3600)} h`
    } else {
      timeText = `Hace ${Math.floor(timeAgo / 86400)} días`
    }

    // Obtener el ID apropiado
    const executionId = (execution as any).localId || (execution as any).id
    const isLocal = (execution as any).isLocal

    return (
      <Card
        key={executionId}
        className={`p-4 cursor-pointer hover:shadow-lg transition-shadow ${
          isLocal
            ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30'
            : 'border-amber-200 dark:border-amber-900'
        }`}
        onClick={() => handleOpenExecution(execution)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={16} className="text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-base truncate text-amber-900 dark:text-amber-100">
                {listName}
              </h3>
              {isLocal && (
                <span className="text-xs bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 px-2 py-0.5 rounded">
                  Local
                </span>
              )}
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">
              En progreso • {timeText}
            </p>
            {(execution as any).store_name && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                📍 {(execution as any).store_name}
              </p>
            )}
          </div>

          {/* Action button */}
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={(e) => {
              e.stopPropagation()
              handleOpenExecution(execution)
            }}
          >
            <Clock size={14} />
            Continuar
          </Button>
        </div>
      </Card>
    )
  }

  if (loading && lists.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Cargando listas...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Mis Listas de Compras</h2>
        <Button
          onClick={handleOpenCreateDrawer}
          size="sm"
          className="gap-2"
        >
          <Plus size={18} />
          Nueva Lista
        </Button>
      </div>

      {/* Lists Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {lists.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
            <ShoppingCart size={64} className="opacity-20" />
            <p className="text-center">
              No tienes listas de compras aún
              <br />
              <span className="text-sm">Crea tu primera lista para empezar</span>
            </p>
            <Button onClick={handleOpenCreateDrawer} className="gap-2">
              <Plus size={18} />
              Crear Primera Lista
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active Executions Section */}
            {activeExecutions.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-3 pl-1">
                  ⏱️ Compras en curso ({activeExecutions.length})
                </h3>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {activeExecutions.map(renderExecutionCard)}
                </div>
              </div>
            )}

            {/* Pending Lists Section */}
            {pendingLists.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 pl-1">
                  Pendientes ({pendingLists.length})
                </h3>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {pendingLists.map(renderListCard)}
                </div>
              </div>
            )}

            {/* Executed Lists Section */}
            {executedLists.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 mb-3 pl-1">
                  ✓ Ejecutadas ({executedLists.length})
                </h3>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {executedLists.map(renderListCard)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Shopping List Drawer */}
      <CreateShoppingListDrawer
        open={createDrawerOpen}
        onOpenChange={handleCreateDrawerOpenChange}
      />
    </div>
  )
}
