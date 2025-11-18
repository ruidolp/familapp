'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  X,
  Plus,
  Minus,
  AlertCircle,
  Loader2,
  MoreVertical,
  Square,
  ShoppingCart,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { notify } from '@/infrastructure/lib/notifications'
import { adjustQty, quantityToDecimal, decimalToFraction } from '@/infrastructure/utils/quantity'
import { ProductQuantityInput } from '@/components/inputs/ProductQuantityInput'
import { EditShoppingListItemDrawer } from '@/components/drawers/EditShoppingListItemDrawer'
import { ListOptionsDrawer } from '@/components/drawers/ListOptionsDrawer'
import {
  ConfigureExecutionDrawer,
  type ExecutionConfig,
} from '@/presentation/components/execution/ConfigureExecutionDrawer'
import { ExecutionStorage } from '@/infrastructure/utils/execution-storage'
import type { CreateLocalExecutionInput } from '@/domain/types/shopping-execution'

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
  nombre?: string
  _productName?: string
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
  const [flatListMode, setFlatListMode] = useState(false)

  // Drawers state
  const [optionsDrawerOpen, setOptionsDrawerOpen] = useState(false)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ListItem | null>(null)

  // Execute purchase drawer state
  const [configureExecutionOpen, setConfigureExecutionOpen] = useState(false)
  const [userId, setUserId] = useState<string>('')

  // Save state per item
  const [itemSaveState, setItemSaveState] = useState<ItemSaveState>({})

  // Load data on mount
  useEffect(() => {
    loadEditorData()
  }, [listId])

  // Save to localStorage as backup (not for restoration)
  useEffect(() => {
    localStorage.setItem(
      `list:${listId}:draft`,
      JSON.stringify({ items, updatedAt: new Date().toISOString() })
    )
  }, [items, listId])

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

  // Keep selectedItem in sync with items array
  // When items changes and selectedItem exists, update selectedItem to latest from items
  useEffect(() => {
    if (selectedItem && items) {
      const updatedItem = items.find((i) => i.id === selectedItem.id)
      if (updatedItem && updatedItem !== selectedItem) {
        console.log('🔄 SYNCING SELECTED ITEM:', {
          itemId: selectedItem.id,
          oldCantidad: selectedItem.cantidad,
          newCantidad: updatedItem.cantidad,
        })
        setSelectedItem(updatedItem)
      }
    }
  }, [items, selectedItem?.id])

  const loadEditorData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/shopping-lists/${listId}/editor-data`)
      if (response.ok) {
        const data: EditorData = await response.json()
        console.log('📥 LOADED FROM SERVER:', {
          listId,
          itemCount: data.items.length,
          items: data.items.map(i => ({
            id: i.id,
            nombre: i.nombre || i._productName,
            cantidad: i.cantidad,
          })),
        })
        setData(data)
        setItems(data.items)
        // Clear any draft conflict indicators
        setItemSaveState({})
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

  const createNewItem = async (
    newItem: Omit<ListItem, 'id'> & { _productName: string }
  ) => {
    const tempId = `temp-${Date.now()}`
    const itemWithTempId: ListItem = {
      ...newItem,
      id: tempId,
    }

    // Add to local state immediately (optimistic)
    setItems((prev) => [...prev, itemWithTempId])

    // Save to server
    setItemSaveState((prev) => ({
      ...prev,
      [tempId]: { isSaving: true },
    }))

    try {
      const response = await fetch(
        `/api/shopping-lists/${listId}/items`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_id: newItem.product_id,
            product_custom_id: newItem.product_custom_id,
            is_catalog: newItem.is_catalog,
            cantidad: newItem.cantidad,
            unidad_medida: newItem.unidad_medida,
            categoria_producto_id: newItem.categoria_producto_id,
            marca: newItem.marca,
            comentario: newItem.comentario,
          }),
        }
      )

      if (!response.ok) throw new Error('Error al crear item')

      const { item: realItem } = await response.json()

      // Replace temp ID with real ID
      setItems((prev) =>
        prev.map((i) =>
          i.id === tempId
            ? { ...realItem, _productName: newItem._productName, nombre: realItem.nombre }
            : i
        )
      )

      setItemSaveState((prev) => {
        const newState = { ...prev }
        delete newState[tempId]
        newState[realItem.id] = { isSaving: false }
        return newState
      })
    } catch (error: any) {
      console.error('Error creating item:', error)
      setItemSaveState((prev) => ({
        ...prev,
        [tempId]: { isSaving: false, error: 'Error al crear' },
      }))
    }
  }

  const updateItemOnServer = async (
    itemId: string,
    updates: { cantidad?: number; comentario?: string }
  ) => {
    console.log('💾 SAVING TO SERVER:', { itemId, updates })

    setItemSaveState((prev) => ({
      ...prev,
      [itemId]: { isSaving: true },
    }))

    try {
      const response = await fetch(
        `/api/shopping-lists/${listId}/items/${itemId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        }
      )

      if (!response.ok) throw new Error('Error al actualizar')

      const responseData = await response.json()
      console.log('✅ SERVER RESPONSE:', responseData)

      // Don't overwrite local state with server response to avoid race conditions
      // Local state is the source of truth during editing
      // Server response is used only for confirmation

      setItemSaveState((prev) => ({
        ...prev,
        [itemId]: { isSaving: false },
      }))
    } catch (error: any) {
      console.error('❌ Error updating item:', error)
      setItemSaveState((prev) => ({
        ...prev,
        [itemId]: { isSaving: false, error: 'Error al guardar' },
      }))
    }
  }

  const deleteItemFromServer = async (itemId: string) => {
    setItemSaveState((prev) => ({
      ...prev,
      [itemId]: { isSaving: true },
    }))

    try {
      const response = await fetch(
        `/api/shopping-lists/${listId}/items/${itemId}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) throw new Error('Error al eliminar')

      // Remove from local state after successful delete
      setItems((prev) => prev.filter((i) => i.id !== itemId))
      setItemSaveState((prev) => {
        const newState = { ...prev }
        delete newState[itemId]
        return newState
      })
    } catch (error: any) {
      console.error('Error deleting item:', error)
      setItemSaveState((prev) => ({
        ...prev,
        [itemId]: { isSaving: false, error: 'Error al eliminar' },
      }))
    }
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

    const newItem: Omit<ListItem, 'id'> & { _productName: string } = {
      shopping_list_id: listId,
      product_id: finalIsCatalog ? finalProductId : undefined,
      product_custom_id: !finalIsCatalog ? finalProductId : undefined,
      is_catalog: finalIsCatalog,
      cantidad: cantidadDecimal,
      unidad_medida: unidad,
      item_order: items.length,
      _productName: productName,
    }

    await createNewItem(newItem)
  }

  const handleDeleteItem = (itemId: string) => {
    deleteItemFromServer(itemId)
  }

  const handleUpdateQuantity = (itemId: string, direction: 'up' | 'down') => {
    const item = items.find((i) => i.id === itemId)
    if (!item) {
      console.error('❌ Item not found:', itemId)
      return
    }

    // CRITICAL: Get current cantidad and convert to proper string format
    const currentDecimal = item.cantidad

    console.log('🔍 BEFORE ADJUSTMENT:', {
      itemId,
      itemName: item.nombre || item._productName,
      direction,
      'currentDecimal (typeof)': typeof currentDecimal,
      'currentDecimal (value)': currentDecimal,
      'currentDecimal (JSON)': JSON.stringify(currentDecimal),
    })

    // Convert decimal to fraction string if applicable (0.25, 0.5, 0.75)
    // Otherwise use the number as string
    let currentQuantity: string
    const fractionStr = decimalToFraction(currentDecimal)
    if (fractionStr) {
      currentQuantity = fractionStr
    } else {
      // For whole numbers or other decimals, use Math.round to ensure integer
      const rounded = Math.round(currentDecimal)
      currentQuantity = String(rounded)
    }

    console.log('🔍 READY TO ADJUST:', {
      currentQuantity,
      'typeof currentQuantity': typeof currentQuantity,
      direction,
    })

    const newQuantityStr = adjustQty(currentQuantity, direction)
    const newQuantity = quantityToDecimal(newQuantityStr)

    console.log('✅ AFTER ADJUSTMENT:', {
      newQuantityStr,
      newQuantity,
      'typeof newQuantity': typeof newQuantity,
    })

    // Update local state
    setItems(
      items.map((i) =>
        i.id === itemId ? { ...i, cantidad: newQuantity } : i
      )
    )

    // Save to server immediately
    if (!itemId.startsWith('temp-')) {
      updateItemOnServer(itemId, { cantidad: newQuantity })
    }
  }

  const handleEditItem = (item: ListItem) => {
    // Ensure we have the latest version of this item from the current items array
    const latestItem = items.find((i) => i.id === item.id) || item
    console.log('📝 OPEN EDIT DRAWER:', {
      itemId: item.id,
      itemName: item.nombre || item._productName,
      cantidad: latestItem.cantidad,
    })
    setSelectedItem(latestItem)
    setEditDrawerOpen(true)
  }

  const handleSaveItemEdit = (cantidad: number, comentario?: string) => {
    if (!selectedItem) return

    console.log('✏️ EDIT ITEM DRAWER:', {
      itemId: selectedItem.id,
      itemName: selectedItem.nombre || selectedItem._productName,
      oldCantidad: selectedItem.cantidad,
      newCantidad: cantidad,
      oldComentario: selectedItem.comentario,
      newComentario: comentario,
    })

    // Update local state immediately
    setItems(
      items.map((i) =>
        i.id === selectedItem.id
          ? { ...i, cantidad, comentario }
          : i
      )
    )

    // Save to server immediately
    if (!selectedItem.id.startsWith('temp-')) {
      updateItemOnServer(selectedItem.id, { cantidad, comentario })
    }
  }

  // Fetch current user ID
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const response = await fetch('/api/auth/session')
        if (response.ok) {
          const session = await response.json()
          if (session?.user?.id) {
            setUserId(session.user.id)
          }
        }
      } catch (error) {
        console.error('Error fetching user ID:', error)
      }
    }
    fetchUserId()
  }, [])

  const handleExecutePurchase = async (config: ExecutionConfig) => {
    if (!data || items.length === 0) {
      notify.error('No hay productos en la lista')
      return
    }

    if (!userId) {
      notify.error('Usuario no identificado')
      return
    }

    try {
      // Create local execution
      const input: CreateLocalExecutionInput = {
        shopping_list_id: listId,
        user_id: userId,
        items: items.map((item, index) => ({
          shopping_list_item_id: item.id.startsWith('temp-') ? undefined : item.id,
          product_id: item.product_id,
          product_custom_id: item.product_custom_id,
          is_catalog: item.is_catalog,
          product_name: item.nombre || item._productName || 'Producto',
          categoria_producto_id: item.categoria_producto_id,
          categoria_producto_nombre: data.categories.find(c => c.id === item.categoria_producto_id)?.nombre,
          cantidad_planeada: item.cantidad,
          unidad_medida: item.unidad_medida,
          marca: item.marca,
          item_order: item.item_order || index,
        })),
        registration: {
          registerInBudget: config.registerInBudget,
          sobre_id: config.sobre_id,
          categoria_sobre_id: config.categoria_id,
          subcategoria_id: config.subcategoria_id,
          store_name: config.store_name,
        },
        budget: {
          enabled: config.budgetEnabled,
          amount: config.budgetAmount,
        },
        settings: {
          showTimer: config.showTimer,
          enablePrices: config.enablePrices,
          showCategories: config.showCategories,
        },
      }

      const execution = await ExecutionStorage.createLocal(input)

      notify.success('¡Compra iniciada!')

      // Redirect to execution screen
      router.push(`/shopping-executions/${execution.localId}`)
    } catch (error) {
      console.error('Error starting execution:', error)
      notify.error('Error al iniciar compra')
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
      <div className="border-b p-4">
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
          <Button
            variant="default"
            size="sm"
            onClick={() => setConfigureExecutionOpen(true)}
            disabled={items.length === 0}
            className="flex items-center gap-2"
          >
            <ShoppingCart size={16} />
            <span className="hidden sm:inline">Ejecutar</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOptionsDrawerOpen(true)}
          >
            <MoreVertical size={20} />
          </Button>
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p>Lista vacía</p>
            <p className="text-sm">Agrega items usando el campo de abajo</p>
          </div>
        ) : flatListMode ? (
          /* FLAT LIST MODE */
          <Card className="p-2">
            <div className="space-y-0">
              {items.map((item) => {
                const saveState = itemSaveState[item.id]
                const isSaving = saveState?.isSaving ?? false
                const hasError = !!saveState?.error

                return (
                  <div
                    key={item.id}
                    onClick={() => handleEditItem(item)}
                    className={`flex items-start gap-2 px-2 py-1 hover:bg-muted cursor-pointer transition-colors ${
                      isSaving ? 'opacity-60' : ''
                    } ${hasError ? 'text-destructive' : ''}`}
                  >
                    <Square size={14} className="flex-shrink-0 mt-0.5" />
                    <span className="font-medium flex-shrink-0">{item.cantidad}</span>
                    <span className="flex-1">
                      {item.nombre || item._productName || item.product_id || item.product_custom_id}
                      {item.comentario && (
                        <span className="text-muted-foreground"> - {item.comentario}</span>
                      )}
                    </span>
                    {isSaving && (
                      <Loader2 size={12} className="animate-spin flex-shrink-0 text-blue-500" />
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        ) : (
          /* NORMAL CARD MODE */
          <div className="space-y-1.5">
            {items.map((item) => {
              const saveState = itemSaveState[item.id]
              const isSaving = saveState?.isSaving ?? false
              const hasError = !!saveState?.error

              return (
                <Card
                  key={item.id}
                  className={`p-2 transition-opacity ${
                    isSaving ? 'opacity-60' : ''
                  } ${hasError ? 'border-destructive/50 bg-destructive/5' : ''}`}
                >
                  <div className="space-y-1">
                    {/* Line 1: Quantity, Name, and buttons */}
                    <div className="flex items-center gap-2">
                      {/* Minus button (if show qty controls) */}
                      {!showInlineQty && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleUpdateQuantity(item.id, 'down')}
                          className="h-7 w-7 flex-shrink-0"
                          disabled={isSaving}
                        >
                          <Minus size={14} />
                        </Button>
                      )}

                      {/* Quantity */}
                      <div className="text-sm font-medium min-w-[2rem] text-center flex-shrink-0">
                        {item.cantidad}
                      </div>

                      {/* Plus button (if show qty controls) */}
                      {!showInlineQty && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleUpdateQuantity(item.id, 'up')}
                          className="h-7 w-7 flex-shrink-0"
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
                        className="h-7 w-7 flex-shrink-0"
                        disabled={isSaving}
                      >
                        <X size={14} />
                      </Button>
                    </div>

                    {/* Line 2: Comment (if exists) */}
                    {item.comentario && (
                      <div className="text-xs text-muted-foreground px-1">
                        {item.comentario}
                      </div>
                    )}

                    {/* Error message */}
                    {hasError && (
                      <div className="flex items-center gap-2 text-xs text-destructive px-1">
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
          availableProducts={[
            // Combine catalog and custom products for autocomplete
            ...(data?.catalog || []).map((p) => ({ ...p, is_catalog: true })),
            ...(data?.customProducts || []).map((p) => ({ ...p, is_catalog: false })),
          ]}
        />
      </div>

      {/* Options Drawer */}
      <ListOptionsDrawer
        open={optionsDrawerOpen}
        onOpenChange={setOptionsDrawerOpen}
        groupByCategory={groupByCategory}
        onGroupByCategoryChange={setGroupByCategory}
        showInlineQty={showInlineQty}
        onShowInlineQtyChange={setShowInlineQty}
        flatListMode={flatListMode}
        onFlatListModeChange={setFlatListMode}
      />

      {/* Edit Item Drawer */}
      {selectedItem && (
        <EditShoppingListItemDrawer
          open={editDrawerOpen}
          onOpenChange={setEditDrawerOpen}
          item={selectedItem}
          onSave={handleSaveItemEdit}
        />
      )}

      {/* Configure Execution Drawer */}
      <ConfigureExecutionDrawer
        open={configureExecutionOpen}
        onOpenChange={setConfigureExecutionOpen}
        userId={userId}
        onConfirm={handleExecutePurchase}
      />
    </div>
  )
}
