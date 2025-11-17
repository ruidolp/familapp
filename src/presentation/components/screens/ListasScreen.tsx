'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, ShoppingCart, Trash2, Copy, MoreVertical } from 'lucide-react'
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

interface ShoppingList {
  id: string
  nombre: string
  descripcion?: string
  purchase_count: number
  created_at: string
  updated_at: string
  _itemCount?: number // Agregado por el backend si está disponible
}

interface ListasScreenProps {
  userId: string
}

export function ListasScreen({ userId }: ListasScreenProps) {
  const router = useRouter()
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [loading, setLoading] = useState(false)
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false)

  // Cargar listas al montar
  useEffect(() => {
    fetchLists()
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

  const handleOpenCreateDrawer = () => {
    setCreateDrawerOpen(true)
  }

  const handleCreateDrawerOpenChange = (open: boolean) => {
    setCreateDrawerOpen(open)
    // Refresh list when drawer closes (in case a list was created)
    if (!open) {
      fetchLists()
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
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {lists.map((list) => (
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
            ))}
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
