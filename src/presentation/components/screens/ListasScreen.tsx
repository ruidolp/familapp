'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, ShoppingCart, Trash2, Copy, MoreVertical, Clock, CheckCircle2, ChevronDown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CreateShoppingListDrawer } from '@/components/drawers/CreateShoppingListDrawer'
import { EditShoppingListDrawer } from '@/components/drawers/EditShoppingListDrawer'
import { ExecutionHistoryDrawer } from '@/components/drawers/ExecutionHistoryDrawer'
import { notify } from '@/infrastructure/lib/notifications'
import { ExecutionStorage } from '@/infrastructure/utils/execution-storage'
import type { LocalShoppingExecution } from '@/domain/types/shopping-execution'
import { useCurrency } from '@/presentation/providers/currency-provider'
import { cn } from '@/infrastructure/lib/utils'

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
  menuAction?: string | null
  onMenuActionHandled?: () => void
}

export function ListasScreen({ userId, menuAction, onMenuActionHandled }: ListasScreenProps) {
  const router = useRouter()
  const { formatNumber } = useCurrency()
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [activeExecutions, setActiveExecutions] = useState<ExecutionDisplay[]>([])
  const [completedExecutions, setCompletedExecutions] = useState<ExecutionDisplay[]>([])
  const [loading, setLoading] = useState(false)
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false)
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false)
  const [selectedExecution, setSelectedExecution] = useState<ExecutionDisplay | null>(null)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [showActiveExecutions, setShowActiveExecutions] = useState(false)
  const [showCompletedExecutions, setShowCompletedExecutions] = useState(false)
  const [editingList, setEditingList] = useState<ShoppingList | null>(null)

  // Cargar listas y ejecuciones al montar
  useEffect(() => {
    fetchLists()
    fetchActiveExecutions()
    fetchCompletedExecutions()
  }, [])

  // Refrescar cuando la ventana/tab vuelve a tener foco
  useEffect(() => {
    const handleFocus = () => {
      fetchLists()
      fetchActiveExecutions()
      fetchCompletedExecutions()
    }

    window.addEventListener('focus', handleFocus)
    // También escuchar cambios de visibilidad (para móviles)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        handleFocus()
      }
    })

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleFocus)
    }
  }, [])

  // Listen for contextual menu actions (e.g., from bottom nav)
  useEffect(() => {
    if (menuAction === 'nueva-lista') {
      setCreateDrawerOpen(true)
      onMenuActionHandled?.()
    }
  }, [menuAction, onMenuActionHandled])

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
      // Solo incluir las que NO están sincronizadas
      const localExecutions = await ExecutionStorage.getAllInProgress()
      const unsyncedLocalExecutions = localExecutions.filter(
        exe => exe.syncStatus !== 'synced'
      )

      // Crear IDs del servidor para evitar duplicados
      const serverIds = new Set(serverExecutions.map(e => e.id))

      // Filtrar locales que no estén ya en el servidor
      const filteredLocalExecutions = unsyncedLocalExecutions.filter(
        exe => !exe.serverExecutionId || !serverIds.has(exe.serverExecutionId)
      )

      // Convertir locales a ExecutionDisplay con isLocal flag
      const localExecutionsDisplay: ExecutionDisplay[] = filteredLocalExecutions.map(exe => ({
        ...exe,
        isLocal: true,
      }))

      // Combinar: primero del servidor, luego locales no sincronizadas
      const combined = [...serverExecutions, ...localExecutionsDisplay]
      setActiveExecutions(combined)
    } catch (error) {
      console.error('Error fetching active executions:', error)
      // No mostrar error al usuario, es un feature secundario
    }
  }

  const fetchCompletedExecutions = async () => {
    try {
      // Cargar ejecuciones completadas del servidor
      const serverExecutions: ShoppingExecution[] = []
      try {
        const response = await fetch('/api/shopping-executions?status=COMPLETED')
        if (response.ok) {
          const data = await response.json()
          serverExecutions.push(...(data.executions || []))
        }
      } catch (error) {
        console.error('Error fetching server completed executions:', error)
      }

      // Cargar ejecuciones completadas locales (IndexedDB)
      // Solo incluir las que NO están sincronizadas
      const localExecutions = await ExecutionStorage.getAllCompleted()
      const unsyncedLocalExecutions = localExecutions.filter(
        exe => exe.syncStatus !== 'synced'
      )

      // Crear IDs del servidor para evitar duplicados
      const serverIds = new Set(serverExecutions.map(e => e.id))

      // Filtrar locales que no estén ya en el servidor
      const filteredLocalExecutions = unsyncedLocalExecutions.filter(
        exe => !exe.serverExecutionId || !serverIds.has(exe.serverExecutionId)
      )

      // Convertir locales a ExecutionDisplay con isLocal flag
      const localExecutionsDisplay: ExecutionDisplay[] = filteredLocalExecutions.map(exe => ({
        ...exe,
        isLocal: true,
      }))

      // Combinar: primero del servidor, luego locales no sincronizadas
      const combined = [...serverExecutions, ...localExecutionsDisplay].sort((a, b) => {
        const aDate = (a as any).completed_at ? new Date((a as any).completed_at).getTime() : 0
        const bDate = (b as any).completed_at ? new Date((b as any).completed_at).getTime() : 0
        return bDate - aDate
      })
      setCompletedExecutions(combined)
    } catch (error) {
      console.error('Error fetching completed executions:', error)
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
      fetchCompletedExecutions()
    }
  }

  const handleDeleteExecution = async (execution: ExecutionDisplay) => {
    const executionId = (execution as any).localId || (execution as any).id
    const isLocal = (execution as any).isLocal

    const statusLabel =
      (execution as any).status === 'COMPLETED' || (execution as any).completed_at
        ? 'compra finalizada'
        : 'compra en progreso'

    if (!confirm(`¿Eliminar esta ${statusLabel}?`)) return

    try {
      if (isLocal) {
        // Eliminar de IndexedDB
        await ExecutionStorage.deleteLocal(executionId)
        notify.success('Compra eliminada')
        fetchActiveExecutions()
      } else {
        // En el futuro se puede implementar eliminación en servidor
        notify.error('No se puede eliminar compras del servidor aún')
      }
    } catch (error: any) {
      console.error('Error deleting execution:', error)
      notify.error('Error al eliminar compra')
    }
  }

  const handleOpenHistory = (execution: ExecutionDisplay) => {
    setSelectedExecution(execution)
    setHistoryDrawerOpen(true)
  }

  const handleEditList = (list: ShoppingList) => {
    setEditingList(list)
    setEditDrawerOpen(true)
  }

  const handleUpdateList = async (nombre: string, descripcion?: string) => {
    if (!editingList) return

    try {
      const response = await fetch(`/api/shopping-lists/${editingList.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, descripcion }),
      })

      if (response.ok) {
        notify.success('Lista actualizada')
        setEditDrawerOpen(false)
        setEditingList(null)
        fetchLists()
      } else {
        notify.error('Error al actualizar lista')
      }
    } catch (error) {
      console.error('Error updating list:', error)
      notify.error('Error al actualizar lista')
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
      className="p-4 cursor-pointer shadow-theme hover:shadow-none transition-shadow text-foreground"
      onClick={() => handleOpenList(list.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold typography-body truncate">
            {list.nombre}
          </h3>
          {list.descripcion && (
            <p className="typography-caption font-semibold text-muted-foreground line-clamp-2 mt-1">
              {list.descripcion}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 typography-caption font-semibold text-muted-foreground">
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
                handleEditList(list)
              }}
            >
              Editar
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

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return ''
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const formatTime = (date: Date | string | null | undefined) => {
    if (!date) return ''
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleTimeString('es-ES', { hour12: false, hour: '2-digit', minute: '2-digit' })
  }

  const getExecutionTotal = (execution: ExecutionDisplay) => {
    const asAny = execution as any
    const manual = asAny.total_manual
    const calculated = asAny.total_calculated
    const estimado = asAny.total_estimado
    const localTotal = asAny.totalSpent
    const total =
      (manual !== null && manual !== undefined ? Number(manual) : undefined) ??
      (calculated !== null && calculated !== undefined ? Number(calculated) : undefined) ??
      (estimado !== null && estimado !== undefined ? Number(estimado) : undefined) ??
      (localTotal !== null && localTotal !== undefined ? Number(localTotal) : undefined)
    return Number.isFinite(total) ? total : null
  }

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

    const executionToneClass = isLocal
      ? 'border-primary/60 bg-primary/10'
      : 'border-accent/40 bg-accent/10'

    return (
      <Card
        key={executionId}
        className={`p-4 cursor-pointer rounded-2xl shadow-theme hover:shadow-none transition-shadow ${executionToneClass}`}
        onClick={() => handleOpenExecution(execution)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <Clock size={16} className="text-muted-foreground" />
              <h3 className="flex-1 truncate typography-label-lg text-foreground">
                {listName}
              </h3>
            </div>
            <p className="mb-2 typography-caption font-semibold text-muted-foreground">En progreso • {timeText}</p>
            {(execution as any).store_name && (
              <p className="typography-caption font-semibold text-muted-foreground line-clamp-1">
                📍 {(execution as any).store_name}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              className="gap-2 rounded-full px-4 py-2 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={(e) => {
                e.stopPropagation()
                handleOpenExecution(execution)
              }}
            >
              <Clock size={14} />
              Continuar
            </Button>

            {/* Menu de opciones */}
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
                    handleDeleteExecution(execution)
                  }}
                  className="text-destructive"
                >
                  <Trash2 size={14} className="mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>
    )
  }

  // Helper to render a completed execution card
  const renderCompletedExecutionCard = (execution: ExecutionDisplay) => {
    // Encontrar el nombre de la lista asociada
    const listName = lists.find(l => l.id === execution.shopping_list_id)?.nombre || 'Compra'
    const endDate = (execution as any).completed_at ? new Date((execution as any).completed_at) : new Date()
    const completedText = formatDate(endDate)
    const endTime = formatTime(endDate)
    const total = getExecutionTotal(execution)
    const storeName = (execution as any).store_name

    return (
      <Card
        key={(execution as any).localId || (execution as any).id}
        className="p-4 cursor-pointer rounded-2xl border-tertiary/40 bg-tertiary/10 shadow-theme hover:shadow-none transition-shadow"
        onClick={() => handleOpenHistory(execution)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="mb-1 flex items-center gap-2 text-foreground">
              <CheckCircle2 size={16} />
              <h3 className="font-semibold typography-body truncate">
                {listName}
              </h3>
            </div>
            <p className="mb-2 typography-caption font-semibold text-muted-foreground">
              {completedText} {endTime && `· ${endTime}`}
            </p>
            {(storeName || total !== null) && (
              <div className="mt-1 flex items-center gap-2 typography-caption font-semibold">
                {storeName ? (
                  <span className="flex-1 text-muted-foreground line-clamp-1">
                    📍 {storeName}
                  </span>
                ) : (
                  <span className="flex-1 text-muted-foreground">Total</span>
                )}
                {total !== null && (
                  <span className="font-semibold text-foreground whitespace-nowrap">
                    {formatNumber(total)}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
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
                    handleDeleteExecution(execution)
                  }}
                  className="text-destructive"
                >
                  <Trash2 size={14} className="mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
      {/* Lists Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {lists.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
            <ShoppingCart size={64} className="opacity-20" />
            <p className="text-center">
              No tienes listas de compras aún
              <br />
              <span className="typography-body-sm">Crea tu primera lista para empezar</span>
            </p>
            <Button onClick={handleOpenCreateDrawer} className="gap-2 rounded-full px-4 py-2 text-base font-semibold">
              <Plus size={18} />
              Crear Lista
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* All Lists */}
            {lists.length > 0 && (
              <div>
                <h3 className="font-semibold typography-body text-foreground mb-3 pl-1">
                  Mis Listas ({lists.length})
                </h3>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {lists.map(renderListCard)}
                </div>
              </div>
            )}

            {/* Active Executions Section */}
            {activeExecutions.length > 0 && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setShowActiveExecutions(prev => !prev)}
                  aria-expanded={showActiveExecutions}
                  className="flex w-full items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-left shadow-sm"
                >
                  <span className="font-semibold typography-body text-foreground">
                    ⏱️ Compras en curso ({activeExecutions.length})
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-5 w-5 text-muted-foreground transition-transform',
                      showActiveExecutions ? 'rotate-180' : ''
                    )}
                  />
                </button>
                {showActiveExecutions && (
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {activeExecutions.map(renderExecutionCard)}
                  </div>
                )}
              </div>
            )}

            {/* Completed Executions Section */}
            {completedExecutions.length > 0 && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setShowCompletedExecutions(prev => !prev)}
                  aria-expanded={showCompletedExecutions}
                  className="flex w-full items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-left shadow-sm"
                >
                  <span className="font-semibold typography-body text-foreground">
                    ✓ Compras Finalizadas ({completedExecutions.length})
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-5 w-5 text-muted-foreground transition-transform',
                      showCompletedExecutions ? 'rotate-180' : ''
                    )}
                  />
                </button>
                {showCompletedExecutions && (
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {completedExecutions.map(renderCompletedExecutionCard)}
                  </div>
                )}
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

      {/* Edit Shopping List Drawer */}
      {editingList && (
        <EditShoppingListDrawer
          open={editDrawerOpen}
          onOpenChange={setEditDrawerOpen}
          list={editingList}
          onSave={handleUpdateList}
        />
      )}

      {/* Execution History Drawer */}
      <ExecutionHistoryDrawer
        execution={selectedExecution}
        isOpen={historyDrawerOpen}
        onOpenChange={setHistoryDrawerOpen}
      />
    </div>
  )
}
