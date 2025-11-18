'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  X,
  Plus,
  Minus,
  AlertCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { notify } from '@/infrastructure/lib/notifications'
import { adjustQty, quantityToDecimal } from '@/infrastructure/utils/quantity'
import { ProductQuantityInput } from '@/components/inputs/ProductQuantityInput'
import { EditShoppingListItemDrawer } from '@/components/drawers/EditShoppingListItemDrawer'

// Types
interface Product {
  id: string
  nombre: string
  descripcion?: string
  is_catalog?: boolean
}

interface Category {
  id: string
  nombre: string
  color?: string
  emoji?: string
}

interface ListItem {
  id: string
  shopping_list_id: string
  product_id?: string
  product_custom_id?: string
  is_catalog: boolean
  cantidad: number
  unidad_medida?: string
  categoria_producto_id?: string
  marca?: string
  comentario?: string
  item_order: number
  nombre?: string // From COALESCE in database query
  _productName?: string // Enriched client-side
}

interface EditorData {
  listInfo: {
    id: string
    nombre: string
    descripcion?: string
    purchase_count: number
  }
  items: ListItem[]
  catalog: Product[]
  customProducts: Product[]
  categories: Category[]
  favorites: any[]
  frequent: any[]
}

interface ListEditorScreenProps {
  listId: string
}

// State for tracking item save status
interface ItemSaveState {
  [itemId: string]: {
    isSaving: boolean
    error?: string
  }
}

export function ListEditorScreen({ listId }: ListEditorScreenProps) {
  const router = useRouter()

  // Data state
  const [data, setData] = useState<EditorData | null>(null)
  const [items, setItems] = useState<ListItem[]>([])
  const [loading, setLoading] = useState(true)

  // UI preferences
  const [groupByCategory, setGroupByCategory] = useState(false)
  const [showInlineQty, setShowInlineQty] = useState(true)

  // Edit drawer state
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ListItem | null>(null)

  // Save state per item
  const [itemSaveState, setItemSaveState] = useState<ItemSaveState>({})

  // Track unsaved creates/deletes for batch save
  const [pendingBatch, setPendingBatch] = useState<{
    creates: any[]
    deletes: string[]
  }>({
    creates: [],
    deletes: [],
  })

  // Load data on mount
  useEffect(() => {
    loadEditorData()
  }, [listId])

  // Listen for visibility change (tab focus)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab/window regained focus - reload data
        loadEditorData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Flush pending creates/deletes on unmount
  useEffect(() => {
    return () => {
      if (
        pendingBatch.creates.length > 0 ||
        pendingBatch.deletes.length > 0
      ) {
        // Save batch synchronously if possible (won't work due to async)
        // This is why we need to save immediately
      }
    }
  }, [pendingBatch])

  const loadEditorData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/shopping-lists/${listId}/editor-data`)
      if (response.ok) {
        const data: EditorData = await response.json()
        setData(data)
        setItems(data.items)
      } else {
        notify.error('Error al cargar datos')
        router.back()
      }
    } catch (error) {
      console.error('Error loading editor data:', error)
      notify.error('Error al cargar datos')
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const saveItemUpdate = async (itemId: string, updates: { cantidad?: number; comentario?: string }) => {
    setItemSaveState((prev) => ({
      ...prev,
      [itemId]: { isSaving: true },
    }))

    try {
      const response = await fetch(`/api/shopping-lists/${listId}/items/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creates: [],
          updates: [{ id: itemId, ...updates }],
          deletes: [],
        }),
      })

      if (response.ok) {
        setItemSaveState((prev) => ({
          ...prev,
          [itemId]: { isSaving: false },
        }))
      } else {
        throw new Error('Error al guardar')
      }
    } catch (error: any) {
      console.error('Error saving item update:', error)
      setItemSaveState((prev) => ({
        ...prev,
        [itemId]: { isSaving: false, error: 'Error al guardar' },
      }))
      // Keep local state, let user retry
    }
  }

  const handleEditItem = (item: ListItem) => {
    setSelectedItem(item)
    setEditDrawerOpen(true)
  }

  const handleSaveItemEdit = (cantidad: number, comentario?: string) => {
    if (!selectedItem) return

    // Update local state immediately (optimistic)
    setItems(
      items.map((i) =>
        i.id === selectedItem.id
          ? { ...i, cantidad, comentario }
          : i
      )
    )

    // Save to server immediately
    saveItemUpdate(selectedItem.id, { cantidad, comentario })
  }

  const handleAddItem = (
    productName: string,
    isCatalog: boolean,
    productId?: string,
    quantity: string = '1'
  ) => {
    addItemToList(productName, isCatalog ? 1 : 0, quantity, undefined, productId)
  }

  const addItemToList = async (
    productName: string,
    isCatalog: number,
    quantity: string = '1',
    unidad?: string,
    productId?: string
  ) => {
    let finalProductId = productId
    let finalIsCatalog = !!isCatalog

    if (!finalProductId) {
      const catalogMatch = data?.catalog.find(
        (p) => p.nombre.toLowerCase() === productName.toLowerCase()
      )

      if (catalogMatch) {
        finalProductId = catalogMatch.id
        finalIsCatalog = true
      } else {
        const customMatch = data?.customProducts.find(
          (p) => p.nombre.toLowerCase() === productName.toLowerCase()
        )

        if (customMatch) {
          finalProductId = customMatch.id
          finalIsCatalog = false
        } else {
          try {
            const response = await fetch('/api/products/custom', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ nombre: productName }),
            })

            if (response.ok) {
              const result = await response.json()
              finalProductId = result.product.id
              finalIsCatalog = false

              if (data) {
                setData({
                  ...data,
                  customProducts: [...data.customProducts, result.product],
                })
              }
            }
          } catch (error) {
            console.error('Error creating custom product:', error)
            notify.error('Error al crear producto')
            return
          }
        }
      }
    }

    const cantidadDecimal = quantityToDecimal(quantity)

    const newItem: ListItem = {
      id: `temp-${Date.now()}`,
      shopping_list_id: listId,
      product_id: finalIsCatalog ? finalProductId : undefined,
      product_custom_id: !finalIsCatalog ? finalProductId : undefined,
      is_catalog: finalIsCatalog,
      cantidad: cantidadDecimal,
      unidad_medida: unidad,
      item_order: items.length,
      _productName: productName,
    }

    // Add to local state
    setItems([...items, newItem])

    // Add to pending creates (will be saved on unmount or manually)
    setPendingBatch((prev) => ({
      ...prev,
      creates: [
        ...prev.creates,
        {
          product_id: newItem.product_id,
          product_custom_id: newItem.product_custom_id,
          is_catalog: newItem.is_catalog,
          cantidad: newItem.cantidad,
          unidad_medida: newItem.unidad_medida,
          item_order: newItem.item_order,
        },
      ],
    }))
  }

  const handleDeleteItem = (itemId: string) => {
    setItems(items.filter((i) => i.id !== itemId))

    if (!itemId.startsWith('temp-')) {
      setPendingBatch((prev) => ({
        ...prev,
        deletes: [...prev.deletes, itemId],
      }))
    }
  }

  const handleUpdateQuantity = (itemId: string, direction: 'up' | 'down') => {
    const item = items.find((i) => i.id === itemId)
    if (!item) return

    const currentQuantity = item.cantidad.toString()
    const newQuantityStr = adjustQty(currentQuantity, direction)
    const newQuantity = quantityToDecimal(newQuantityStr)

    // Update local state
    setItems(
      items.map((i) =>
        i.id === itemId ? { ...i, cantidad: newQuantity } : i
      )
    )

    // Save to server immediately
    if (!itemId.startsWith('temp-')) {
      saveItemUpdate(itemId, { cantidad: newQuantity })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive">Error al cargar lista</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4 space-y-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              router.back()
            }}
          >
            <ArrowLeft size={20} />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">{data.listInfo.nombre}</h1>
            {data.listInfo.descripcion && (
              <p className="text-sm text-muted-foreground">
                {data.listInfo.descripcion}
              </p>
            )}
          </div>
        </div>

        {/* Preferences */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Switch
              id="group-category"
              checked={groupByCategory}
              onCheckedChange={setGroupByCategory}
            />
            <Label htmlFor="group-category">Agrupar por categoría</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="show-qty-buttons"
              checked={!showInlineQty}
              onCheckedChange={(checked) => setShowInlineQty(!checked)}
            />
            <Label htmlFor="show-qty-buttons">Mostrar controles de cantidad</Label>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p>Lista vacía</p>
            <p className="text-sm">Agrega items usando el campo de abajo</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const saveState = itemSaveState[item.id]
              const isSaving = saveState?.isSaving ?? false
              const hasError = !!saveState?.error

              return (
                <Card
                  key={item.id}
                  className={`p-3 transition-opacity ${
                    isSaving ? 'opacity-60' : ''
                  } ${hasError ? 'border-destructive/50 bg-destructive/5' : ''}`}
                >
                  <div className="space-y-2">
                    {/* Line 1: Quantity, Name, and buttons */}
                    <div className="flex items-center gap-2">
                      {/* Minus button (if inline qty disabled) */}
                      {!showInlineQty && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleUpdateQuantity(item.id, 'down')}
                          className="h-8 w-8 flex-shrink-0"
                          disabled={isSaving}
                        >
                          <Minus size={14} />
                        </Button>
                      )}

                      {/* Quantity */}
                      <div className="text-sm font-medium min-w-[2rem] text-center flex-shrink-0">
                        {item.cantidad}
                      </div>

                      {/* Plus button (if inline qty disabled) */}
                      {!showInlineQty && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleUpdateQuantity(item.id, 'up')}
                          className="h-8 w-8 flex-shrink-0"
                          disabled={isSaving}
                        >
                          <Plus size={14} />
                        </Button>
                      )}

                      {/* Product name (clickable) */}
                      <Button
                        variant="ghost"
                        onClick={() => handleEditItem(item)}
                        className="flex-1 h-auto justify-start text-left px-2 py-1 font-medium hover:bg-muted"
                        disabled={isSaving}
                      >
                        {item.nombre || item._productName || item.product_id || item.product_custom_id}
                      </Button>

                      {/* Save status indicator */}
                      {isSaving && (
                        <Loader2 size={14} className="animate-spin flex-shrink-0 text-blue-500" />
                      )}
                      {hasError && (
                        <AlertCircle size={14} className="flex-shrink-0 text-destructive" />
                      )}

                      {/* Delete button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteItem(item.id)}
                        className="h-8 w-8 flex-shrink-0"
                        disabled={isSaving}
                      >
                        <X size={14} />
                      </Button>
                    </div>

                    {/* Line 2: Comment (if exists) */}
                    {item.comentario && (
                      <div className="text-xs text-muted-foreground px-2">
                        {item.comentario}
                      </div>
                    )}

                    {/* Error message */}
                    {hasError && (
                      <div className="flex items-center gap-2 text-xs text-destructive px-2">
                        <AlertCircle size={12} />
                        <span>Error al guardar. Intenta de nuevo.</span>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Input Fixed at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <ProductQuantityInput
          onAddProduct={(name, qty) => handleAddItem(name, false, undefined, qty)}
        />
      </div>

      {/* Edit Item Drawer */}
      {selectedItem && (
        <EditShoppingListItemDrawer
          open={editDrawerOpen}
          onOpenChange={setEditDrawerOpen}
          item={selectedItem}
          onSave={handleSaveItemEdit}
        />
      )}
    </div>
  )
}
