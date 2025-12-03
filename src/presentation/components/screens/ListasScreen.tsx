'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Plus, ShoppingCart, Trash2, Copy, MoreVertical, Clock, CheckCircle2, UserPlus, User, Pencil, ExternalLink, Users, Bell } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { CreateShoppingListDrawer } from '@/components/drawers/CreateShoppingListDrawer'
import { EditShoppingListDrawer } from '@/components/drawers/EditShoppingListDrawer'
import { ExecutionHistoryDrawer } from '@/components/drawers/ExecutionHistoryDrawer'
import { InviteUserDialog, type ContactMethod } from '@/components/sobres/invite-user-dialog'
import { ManageListInvitationsDrawer } from '@/presentation/components/listas/manage-list-invitations-drawer'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PendingRegistrationsAlert } from '@/presentation/components/listas/PendingRegistrationsAlert'
import { OwnerRegisterPurchaseDrawer } from '@/presentation/components/drawers/OwnerRegisterPurchaseDrawer'
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
  _isShared?: boolean // Flag para listas compartidas
  user_role?: string // Rol del usuario en la lista compartida
  _collaboratorCount?: number // Número de colaboradores (solo para OWNER)
  _collaborators?: Array<{ id: string; name?: string | null; email?: string | null }>
  _sharedBy?: { name?: string | null; email?: string | null }
  _ownerInfo?: { name?: string | null; email?: string | null }
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
  const locale = useLocale()
  const { formatNumber } = useCurrency()
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [sharedLists, setSharedLists] = useState<ShoppingList[]>([])
  const [activeExecutions, setActiveExecutions] = useState<ExecutionDisplay[]>([])
  const [completedExecutions, setCompletedExecutions] = useState<ExecutionDisplay[]>([])
  const [loading, setLoading] = useState(false)
  const [ownedListIds, setOwnedListIds] = useState<string[]>([])
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false)
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false)
  const [ownerRegisterDrawerOpen, setOwnerRegisterDrawerOpen] = useState(false)
  const [selectedExecution, setSelectedExecution] = useState<ExecutionDisplay | null>(null)
  const [selectedExecutionForOwner, setSelectedExecutionForOwner] = useState<any>(null)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('listas')
  const [editingList, setEditingList] = useState<ShoppingList | null>(null)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [invitingList, setInvitingList] = useState<ShoppingList | null>(null)
  const [manageListInvitesOpen, setManageListInvitesOpen] = useState(false)
  const [listInvitesTarget, setListInvitesTarget] = useState<ShoppingList | null>(null)

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

  // FIX: Memoize owned list IDs to prevent creating new array on every render
  useEffect(() => {
    const ids = lists.filter(l => !l._isShared).map(l => l.id)
    // Only update if actually changed (compare stringified versions)
    if (JSON.stringify(ids) !== JSON.stringify(ownedListIds)) {
      setOwnedListIds(ids)
    }
  }, [lists])

  const fetchLists = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/shopping-lists')
      if (response.ok) {
        const data = await response.json()
        setLists(data.lists || [])
        setSharedLists(data.sharedLists || [])
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

  const handleInviteUser = (list: ShoppingList) => {
    setInvitingList(list)
    setInviteDialogOpen(true)
  }

  const handleManageListInvites = (list: ShoppingList) => {
    setListInvitesTarget(list)
    setManageListInvitesOpen(true)
  }

  const handleInviteDialogSuccess = (method: ContactMethod) => {
    if (method === 'whatsapp' && invitingList) {
      setListInvitesTarget(invitingList)
      setManageListInvitesOpen(true)
    }
  }

  const handleListInvitesDrawerChange = (open: boolean) => {
    setManageListInvitesOpen(open)
    if (!open) {
      setListInvitesTarget(null)
    }
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
    router.push(`/${locale}/shopping-lists/${listId}`)
  }

  const handleOpenExecution = (execution: ExecutionDisplay) => {
    // Para ejecuciones locales usar localId, para del servidor usar id
    const id = (execution as any).localId || (execution as any).id
    router.push(`/${locale}/shopping-executions/${id}`)
  }

  // Separate lists into pending and executed
  const pendingLists = lists.filter(list => list.purchase_count === 0)
  const executedLists = lists.filter(list => list.purchase_count > 0)
  const totalLists = lists.length + sharedLists.length

  const renderSectionEmptyState = (message: string) => (
    <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  )

  const formatCollaboratorNames = (collaborators?: ShoppingList['_collaborators']) => {
    if (!collaborators || collaborators.length === 0) return ''
    return collaborators
      .map((collab) => {
        const name = collab?.name?.trim()
        if (name) return name
        return collab?.email || 'Invitado'
      })
      .join(', ')
  }

  // Helper to render a list item (inside single card)
  const renderListItem = (list: ShoppingList) => {
    const collaboratorNames = !list._isShared ? formatCollaboratorNames(list._collaborators) : ''
    const sharedByLabel = list._isShared ? (list._sharedBy?.name || list._sharedBy?.email || '') : ''

    return (
      <div
        key={list.id}
        className="flex items-start justify-between gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => handleOpenList(list.id)}
      >
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold typography-body truncate">
              {list.nombre}
            </h3>
            {list._isShared && list.user_role && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 whitespace-nowrap">
                {list.user_role === 'EDITOR'
                  ? 'Editor'
                  : list.user_role === 'EXECUTION_ONLY'
                    ? 'Solo Compra'
                    : list.user_role}
              </span>
            )}
          </div>

          {!list._isShared && collaboratorNames && (
            <div className="flex items-center gap-1 text-xs font-semibold text-foreground">
              <User className="h-[1.1em] w-[1.1em]" />
              <span className="truncate">Compartido con {collaboratorNames}</span>
            </div>
          )}

          {list._isShared && sharedByLabel && (
            <p className="flex items-center gap-1 typography-caption font-semibold text-foreground">
              <Users className="h-[1.1em] w-[1.1em]" />
              Compartida por {sharedByLabel}
            </p>
          )}

          {list.descripcion && (
            <p className="typography-caption font-semibold text-muted-foreground line-clamp-1">
              {list.descripcion}
            </p>
          )}

          <div className="flex items-center gap-3 typography-caption font-semibold text-muted-foreground">
            <span>
              {list._itemCount !== undefined
                ? `${list._itemCount} items`
                : 'Sin items'}
            </span>
            <span>•</span>
            <span>
              {list.purchase_count > 0
                ? `${list.purchase_count} compras`
                : 'Sin compras'}
            </span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 shrink-0"
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
              <ExternalLink size={14} className="mr-2" />
              Abrir
            </DropdownMenuItem>

            {!list._isShared && (
              <>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEditList(list)
                  }}
                >
                  <Pencil size={14} className="mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    handleInviteUser(list)
                  }}
                >
                  <UserPlus size={14} className="mr-2" />
                  Invitar usuario
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    handleManageListInvites(list)
                  }}
                >
                  <Users size={14} className="mr-2" />
                  Gestionar invitados
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                handleCloneList(list.id, list.nombre)
              }}
            >
              <Copy size={14} className="mr-2" />
              Clonar
            </DropdownMenuItem>

            {!list._isShared && (
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
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

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

  // Helper to render an execution item (inside single card)
  const renderExecutionItem = (execution: ExecutionDisplay) => {
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

    const executionId = (execution as any).localId || (execution as any).id

    return (
      <div
        key={executionId}
        className="flex items-start justify-between gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => handleOpenExecution(execution)}
      >
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-muted-foreground shrink-0" />
            <h3 className="flex-1 truncate typography-body font-semibold">
              {listName}
            </h3>
          </div>
          <p className="typography-caption font-semibold text-muted-foreground">
            En progreso • {timeText}
          </p>
          {(execution as any).store_name && (
            <p className="typography-caption font-semibold text-muted-foreground line-clamp-1">
              📍 {(execution as any).store_name}
            </p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 shrink-0"
            >
              <MoreVertical size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                handleOpenExecution(execution)
              }}
            >
              <Clock size={14} className="mr-2" />
              Continuar
            </DropdownMenuItem>
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
    )
  }

  // Helper to render a completed execution item (inside single card)
  const renderCompletedExecutionItem = (execution: ExecutionDisplay) => {
    const listName = lists.find(l => l.id === execution.shopping_list_id)?.nombre || 'Compra'
    const endDate = (execution as any).completed_at ? new Date((execution as any).completed_at) : new Date()
    const completedText = formatDate(endDate)
    const endTime = formatTime(endDate)
    const total = getExecutionTotal(execution)
    const storeName = (execution as any).store_name
    const hasPendingRegistration = (execution as any).owner_registration_status === 'pending'
    const isRegisteredByOwner = (execution as any).owner_registration_status === 'registered'
    const executorName = (execution as any).executor_name || (execution as any).executor_email

    return (
      <div
        key={(execution as any).localId || (execution as any).id}
        className="flex items-start justify-between gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => handleOpenHistory(execution)}
      >
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <CheckCircle2 size={16} className="text-muted-foreground shrink-0" />
            <h3 className="font-semibold typography-body truncate">
              {listName}
            </h3>
            {hasPendingRegistration && (
              <Bell size={14} className="text-orange-500 animate-pulse shrink-0" />
            )}
            {isRegisteredByOwner && executorName && (
              <Badge
                variant="secondary"
                className="text-xs px-2 py-0.5 cursor-pointer hover:bg-secondary/80 flex items-center gap-1"
                onClick={(e) => {
                  e.stopPropagation()
                  handleOpenHistory(execution)
                }}
              >
                <Users className="h-[1em] w-[1em]" />
                {executorName}
              </Badge>
            )}
          </div>
          <p className="typography-caption font-semibold text-muted-foreground">
            {completedText} {endTime && `· ${endTime}`}
          </p>
          {(storeName || total !== null) && (
            <div className="flex items-center gap-2 typography-caption font-semibold">
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 shrink-0"
            >
              <MoreVertical size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                handleOpenHistory(execution)
              }}
            >
              <ExternalLink size={14} className="mr-2" />
              Ver detalles
            </DropdownMenuItem>
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
      <div className="flex items-center justify-between gap-4 flex-wrap p-4 pb-0">
        <h3 className="typography-h3 text-foreground">Listas de Compras</h3>
        <Button
          className="gap-2 rounded-full px-4 py-2 text-base font-semibold"
          onClick={handleOpenCreateDrawer}
        >
          <Plus size={16} />
          Nueva lista
        </Button>
      </div>

      {/* Tabs Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {totalLists === 0 && activeExecutions.length === 0 && completedExecutions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border bg-card px-6 py-10 text-muted-foreground">
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-4">
              <TabsTrigger value="listas" className="text-sm font-semibold relative">
                Listas
                {totalLists > 0 && (
                  <Badge variant="secondary" className="ml-1.5 rounded-full px-1.5 py-0 text-[0.65rem] font-semibold min-w-[1.25rem] h-5">
                    {totalLists}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="en-curso" className="text-sm font-semibold relative">
                En curso
                {activeExecutions.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 rounded-full px-1.5 py-0 text-[0.65rem] font-semibold min-w-[1.25rem] h-5">
                    {activeExecutions.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="finalizadas" className="text-sm font-semibold relative">
                Finalizadas
                {completedExecutions.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 rounded-full px-1.5 py-0 text-[0.65rem] font-semibold min-w-[1.25rem] h-5">
                    {completedExecutions.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Listas Tab */}
            <TabsContent value="listas" className="mt-0">
              {totalLists === 0 ? (
                renderSectionEmptyState('No tienes listas de compras aún')
              ) : (
                <Card className="divide-y divide-border rounded-2xl overflow-hidden">
                  {lists.map(renderListItem)}
                  {sharedLists.length > 0 && (
                    <>
                      <div className="px-4 py-3 bg-muted/30">
                        <p className="typography-caption font-semibold uppercase tracking-wide text-muted-foreground text-center">
                          Listas compartidas conmigo
                        </p>
                      </div>
                      {sharedLists.map(renderListItem)}
                    </>
                  )}
                </Card>
              )}
            </TabsContent>

            {/* En Curso Tab */}
            <TabsContent value="en-curso" className="mt-0">
              {activeExecutions.length === 0 ? (
                renderSectionEmptyState('No hay compras en curso en este momento')
              ) : (
                <Card className="divide-y divide-border rounded-2xl overflow-hidden">
                  {activeExecutions.map(renderExecutionItem)}
                </Card>
              )}
            </TabsContent>

            {/* Finalizadas Tab */}
            <TabsContent value="finalizadas" className="mt-0">
              {completedExecutions.length === 0 ? (
                renderSectionEmptyState('No tienes compras finalizadas todavía')
              ) : (
                <Card className="divide-y divide-border rounded-2xl overflow-hidden">
                  {completedExecutions.map(renderCompletedExecutionItem)}
                </Card>
              )}
            </TabsContent>
          </Tabs>
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

      {/* Invite User Dialog */}
      {invitingList && (
        <InviteUserDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          tipo="lista"
          itemId={invitingList.id}
          itemNombre={invitingList.nombre}
          itemEmoji="🛒"
          onSuccess={handleInviteDialogSuccess}
        />
      )}

      {listInvitesTarget && (
        <ManageListInvitationsDrawer
          open={manageListInvitesOpen}
          onOpenChange={handleListInvitesDrawerChange}
          listaId={listInvitesTarget.id}
          listaNombre={listInvitesTarget.nombre}
        />
      )}

      {/* Pending Registrations Alert - Only for owned lists, not shared lists */}
      {/* FIX: Use memoized ownedListIds instead of creating new array on every render */}
      <PendingRegistrationsAlert
        listIds={ownedListIds}
        onRegisterNow={(execution) => {
          setSelectedExecutionForOwner(execution)
          setOwnerRegisterDrawerOpen(true)
        }}
        onDismissAll={() => {
          // Refresh data
          fetchLists()
          fetchActiveExecutions()
          fetchCompletedExecutions()
        }}
      />

      {/* Owner Register Purchase Drawer */}
      <OwnerRegisterPurchaseDrawer
        open={ownerRegisterDrawerOpen}
        onOpenChange={setOwnerRegisterDrawerOpen}
        execution={selectedExecutionForOwner}
        userId={userId}
        onSuccess={() => {
          // Refresh data
          fetchLists()
          fetchActiveExecutions()
          fetchCompletedExecutions()
        }}
      />
    </div>
  )
}
