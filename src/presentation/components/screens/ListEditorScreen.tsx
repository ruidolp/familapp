'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import {
  ArrowLeft,
  X,
  Plus,
  Minus,
  AlertCircle,
  Loader2,
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
import {
  getPreferences,
  savePreferences,
  type ListEditorPreferences,
} from '@/infrastructure/utils/user-preferences'
import type { CreateLocalExecutionInput } from '@/domain/types/shopping-execution'
import type { DB } from '@/infrastructure/database/types'
import type { Selectable } from 'kysely'

// Types - Use DB types as source of truth
type ShoppingListItemTable = DB['shopping_list_items']
type ShoppingListTable = DB['shopping_lists']
type ProductCatalogTable = DB['product_catalog']
type ProductUserCustomTable = DB['product_user_custom']
type ProductCategoriesUserTable = DB['product_categories_user']

// Selectable types for application use (not for queries)
type ShoppingListItem = Selectable<ShoppingListItemTable>

// Extended type for list items with joined product names
interface ListItemWithProduct extends Omit<ShoppingListItem, 'created_at' | 'updated_at' | 'deleted_at' | 'created_by' | 'item_type'> {
  nombre?: string  // From joined product_catalog or product_user_custom
  final_category_id?: string | null  // Category ID (prioritizes user-assigned, falls back to catalog)
  _productName?: string  // Fallback product name
}

// Simplified Product type for UI (combines catalog + custom)
interface Product {
  id: string
  nombre: string
  descripcion?: string
  is_catalog?: boolean
  category_id?: string | null  // Category from catalog product
}

// Simplified Category type for UI
interface Category {
  id: string
  nombre: string
  color?: string
  emoji?: string
}

interface EditorData {
  listInfo: {
    id: string
    nombre: string
    descripcion?: string
    purchase_count: number
    user_role?: string
    is_owner?: boolean
  }
  items: ListItemWithProduct[]
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
  const tSummary = useTranslations('shopping.listEditor.summary')

  // Data state
  const [data, setData] = useState<EditorData | null>(null)
  const [items, setItems] = useState<ListItemWithProduct[]>([])
  const [loading, setLoading] = useState(true)

  // UI preferences - Initialize with defaults (will be loaded from IndexedDB)
  const [groupByCategory, setGroupByCategory] = useState(true)
  const [showInlineQty, setShowInlineQty] = useState(false)
  const [flatListMode, setFlatListMode] = useState(false)
  const [preferencesLoaded, setPreferencesLoaded] = useState(false)
  const [lastAddedItemId, setLastAddedItemId] = useState<string | null>(null)
  const [inputFocused, setInputFocused] = useState(false)

  // Drawers state
  const [optionsDrawerOpen, setOptionsDrawerOpen] = useState(false)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ListItemWithProduct | null>(null)

  // Execute purchase drawer state
  const [configureExecutionOpen, setConfigureExecutionOpen] = useState(false)
  const { data: session } = useSession()
  const userId = session?.user?.id || ''

  // Save state per item
  const [itemSaveState, setItemSaveState] = useState<ItemSaveState>({})

  // Ref for items container (for auto-scroll)
  const itemsContainerRef = useRef<HTMLDivElement>(null)

  // Touch/pointer tracking for scroll detection
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)
  const MOVEMENT_THRESHOLD = 10 // pixels - if movement exceeds this, it's a scroll, not a click

  const totalQuantity = useMemo(() => {
    return items.reduce((sum, item) => {
      const rawQuantity = item.cantidad as unknown
      let numericValue = 0

      if (typeof rawQuantity === 'number') {
        numericValue = rawQuantity
      } else if (typeof rawQuantity === 'string') {
        const parsed = Number(rawQuantity)
        numericValue = Number.isNaN(parsed) ? quantityToDecimal(rawQuantity) : parsed
      } else if (rawQuantity !== null && rawQuantity !== undefined) {
        const parsed = Number(rawQuantity)
        numericValue = Number.isNaN(parsed) ? 0 : parsed
      }

      return sum + (Number.isFinite(numericValue) ? numericValue : 0)
    }, 0)
  }, [items])

  const formattedTotalQuantity = useMemo(() => {
    return new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 }).format(totalQuantity)
  }, [totalQuantity])

  // Load preferences from IndexedDB on mount
  useEffect(() => {
    const loadPreferences = async () => {
      const defaults: ListEditorPreferences = {
        groupByCategory: true,
        showInlineQty: false,
        flatListMode: false,
      }
      const prefs = await getPreferences('listEditor', defaults)
      setGroupByCategory(prefs.groupByCategory)
      setShowInlineQty(prefs.showInlineQty)
      setFlatListMode(prefs.flatListMode)
      setPreferencesLoaded(true)
    }
    loadPreferences()
  }, [])

  // Load data on mount
  useEffect(() => {
    loadEditorData()
  }, [listId])

  // Auto-scroll to the last item added so it is visible above the keyboard/input
  useEffect(() => {
    if (!lastAddedItemId || !itemsContainerRef.current) return

    const container = itemsContainerRef.current
    const target = container.querySelector<HTMLElement>(`[data-item-id="${lastAddedItemId}"]`)

    if (target) {
      const bottomPadding = 160 // leave room for input fijo + teclado
      const targetBottom = target.offsetTop + target.offsetHeight
      const scrollTop = Math.max(0, targetBottom - container.clientHeight + bottomPadding)

      container.scrollTo({
        top: scrollTop,
        behavior: 'smooth',
      })
    }

    setLastAddedItemId(null)
  }, [items, lastAddedItemId])

  // Auto-scroll when input is focused (for first 1-4 products only)
  // This positions the products in a more natural viewing position
  useEffect(() => {
    if (!itemsContainerRef.current) return

    const container = itemsContainerRef.current

    if (inputFocused && items.length > 0 && items.length < 5) {
      // Scroll to center the first product in the visible area
      // The spacer creates space above, so we scroll to show products nicely
      const targetScrollPosition = 200 // Scroll down 200px to show products in comfortable position

      setTimeout(() => {
        container.scrollTo({
          top: targetScrollPosition,
          behavior: 'smooth',
        })
      }, 100) // Small delay to ensure spacer is rendered
    } else if (!inputFocused) {
      // When input loses focus, scroll back to top smoothly
      container.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    }
  }, [inputFocused, items.length])

  // Save to localStorage as backup (not for restoration)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        `list:${listId}:draft`,
        JSON.stringify({ items, updatedAt: new Date().toISOString() })
      )
    }
  }, [items, listId])

  // Save UI preferences to IndexedDB when they change (only after initial load)
  useEffect(() => {
    if (preferencesLoaded) {
      savePreferences('listEditor', {
        groupByCategory,
        showInlineQty,
        flatListMode,
      })
    }
  }, [groupByCategory, showInlineQty, flatListMode, preferencesLoaded])

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
        setData(data)
        setItems(data.items)
        // Clear any draft conflict indicators
        setItemSaveState({})
      } else {
        notify.error('Error al cargar datos', { position: 'bottom-center' })
        router.back()
      }
    } catch (error) {
      console.error('Error loading editor data:', error)
      notify.error('Error al cargar datos', { position: 'bottom-center' })
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const createNewItem = async (
    newItem: Omit<ListItemWithProduct, 'id'> & { _productName: string }
  ) => {
    const tempId = `temp-${Date.now()}`
    const itemWithTempId: ListItemWithProduct = {
      ...newItem,
      id: tempId,
    }

    setLastAddedItemId(tempId)
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
            categoria_global_id: newItem.final_category_id, // Enviar categoría del catálogo
            marca: newItem.marca,
            comentario: newItem.comentario,
          }),
        }
      )

      if (!response.ok) throw new Error('Error al crear item')

      const { item: realItem } = await response.json()

      // Replace temp ID with real ID
      // Use the server's final_category_id if available (it includes catalog category)
      setItems((prev) =>
        prev.map((i) =>
          i.id === tempId
            ? {
                ...realItem,
                _productName: newItem._productName,
                nombre: realItem.nombre,
                final_category_id: realItem.final_category_id, // Ensure we use server's calculated category
              }
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
    updates: { cantidad?: number; comentario?: string; categoria_producto_id?: string | null }
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
    let catalogProduct: Product | undefined

    if (!finalProductId) {
      // Primero buscar en productos custom del usuario
      const customMatch = data?.customProducts.find(
        (p) => p.nombre.toLowerCase() === productName.toLowerCase()
      )

      // SIEMPRE buscar en catálogo global para obtener categoría
      const catalogMatch = data?.catalog.find(
        (p) => p.nombre.toLowerCase() === productName.toLowerCase()
      )

      if (catalogMatch) {
        catalogProduct = catalogMatch
      }

      if (customMatch) {
        // Ya existe como producto custom
        finalProductId = customMatch.id
        finalIsCatalog = false
      } else {

        // Siempre crear copia en product_user_custom (ya sea del catálogo o nuevo)
        try {
          const response = await fetch('/api/products/custom', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: productName }),
          })

          if (response.ok) {
            const result = await response.json()
            finalProductId = result.product.id
            finalIsCatalog = false // SIEMPRE false, solo usamos product_custom_id

            if (data) {
              // Solo agregar si no existía (existed: false)
              if (!result.existed) {
                setData({
                  ...data,
                  customProducts: [...data.customProducts, result.product],
                })
              }
            }
          }
        } catch (error) {
          console.error('Error creating custom product:', error)
          notify.error('Error al crear producto', { position: 'bottom-center' })
          return
        }
      }
    } else if (finalIsCatalog && finalProductId) {
      // Si viene con productId del catálogo, buscar producto en catálogo para obtener categoría
      const catalogMatch = data?.catalog.find(
        (p) => p.nombre.toLowerCase() === productName.toLowerCase()
      )

      if (catalogMatch) {
        catalogProduct = catalogMatch
      }

      // Crear copia en product_user_custom
      try {
        const response = await fetch('/api/products/custom', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre: productName }),
        })

        if (response.ok) {
          const result = await response.json()
          finalProductId = result.product.id
          finalIsCatalog = false // SIEMPRE usar product_custom_id

          if (data && !result.existed) {
            setData({
              ...data,
              customProducts: [...data.customProducts, result.product],
            })
          }
        }
      } catch (error) {
        console.error('Error creating custom product:', error)
        notify.error('Error al crear producto', { position: 'bottom-center' })
        return
      }
    }

    // Check for duplicates in the list (ahora solo compara product_custom_id)
    const isDuplicate = items.some((item) => {
      return item.product_custom_id === finalProductId
    })

    if (isDuplicate) {
      notify.warning(`${productName} ya está en la lista`, undefined, { position: 'bottom-center' })
      return
    }

    const cantidadDecimal = quantityToDecimal(quantity)

    // If it's a catalog product, try to get its category_id for final_category_id
    const finalCategoryId = catalogProduct && 'category_id' in catalogProduct
      ? (catalogProduct as any).category_id
      : null

    const newItem = {
      shopping_list_id: listId,
      product_id: null, // NUNCA usar product_id con FK
      product_custom_id: finalProductId ?? null, // SIEMPRE usar product_custom_id
      is_catalog: false, // SIEMPRE false
      cantidad: cantidadDecimal,
      unidad_medida: unidad ?? null,
      categoria_producto_id: null,
      categoria_global_id: null,
      final_category_id: finalCategoryId, // Set final_category_id from catalog product
      marca: null,
      comentario: null,
      item_order: items.length,
      _productName: productName,
    } as unknown as Omit<ListItemWithProduct, 'id'> & { _productName: string }

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
    const fractionStr = decimalToFraction(typeof currentDecimal === 'string' ? parseFloat(currentDecimal) : currentDecimal)
    if (fractionStr) {
      currentQuantity = fractionStr
    } else {
      // For whole numbers or other decimals, use Math.round to ensure integer
      const numericValue = typeof currentDecimal === 'string' ? parseFloat(currentDecimal) : currentDecimal
      const rounded = Math.round(numericValue)
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
        i.id === itemId ? { ...i, cantidad: newQuantity } as unknown as ListItemWithProduct : i
      )
    )

    // Save to server immediately
    if (!itemId.startsWith('temp-')) {
      updateItemOnServer(itemId, { cantidad: newQuantity })
    }
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerStartRef.current) return

    const deltaX = Math.abs(e.clientX - pointerStartRef.current.x)
    const deltaY = Math.abs(e.clientY - pointerStartRef.current.y)

    // If movement exceeds threshold, mark as scrolling (nullify start position)
    if (deltaX > MOVEMENT_THRESHOLD || deltaY > MOVEMENT_THRESHOLD) {
      pointerStartRef.current = null
    }
  }

  const handleItemClick = (item: ListItemWithProduct, e: React.MouseEvent) => {
    // If pointer start is null, it means there was significant movement (scroll)
    if (!pointerStartRef.current) {
      e.preventDefault()
      e.stopPropagation()
      return
    }

    // Reset pointer tracking
    pointerStartRef.current = null

    // Proceed with edit
    handleEditItem(item)
  }

  const handleEditItem = (item: ListItemWithProduct) => {
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

  const handleSaveItemEdit = (cantidad: number, comentario?: string, categoriaId?: string | null) => {
    if (!selectedItem) return

    console.log('✏️ EDIT ITEM DRAWER:', {
      itemId: selectedItem.id,
      itemName: selectedItem.nombre || selectedItem._productName,
      oldCantidad: selectedItem.cantidad,
      newCantidad: cantidad,
      oldComentario: selectedItem.comentario,
      newComentario: comentario,
      oldCategoria: selectedItem.categoria_producto_id,
      newCategoria: categoriaId,
    })

    // Update local state immediately
    setItems(
      items.map((i) =>
        i.id === selectedItem.id
          ? { ...i, cantidad, comentario: comentario ?? null, categoria_producto_id: categoriaId ?? null } as unknown as ListItemWithProduct
          : i
      )
    )

    // Save to server immediately
    if (!selectedItem.id.startsWith('temp-')) {
      updateItemOnServer(selectedItem.id, { cantidad, comentario, categoria_producto_id: categoriaId ?? null })
    }
  }

  // No longer needed - userId comes from useSession() hook

  const handleExecutePurchase = async (config: ExecutionConfig) => {
    if (!data || items.length === 0) {
      notify.error('No hay productos en la lista', { position: 'bottom-center' })
      return
    }

    if (!userId) {
      notify.error('Usuario no identificado', { position: 'bottom-center' })
      return
    }

    try {
      // Create local execution
      const input: CreateLocalExecutionInput = {
        shopping_list_id: listId,
        user_id: userId,
        items: items.map((item, index) => ({
          shopping_list_item_id: item.id.startsWith('temp-') ? undefined : item.id,
          product_id: item.product_id ?? undefined,
          product_custom_id: item.product_custom_id ?? undefined,
          is_catalog: item.is_catalog,
          product_name: item.nombre || item._productName || 'Producto',
          categoria_producto_id: item.categoria_producto_id ?? undefined,
          categoria_producto_nombre:
            // Use final_category_id which prioritizes: user-assigned > global > catalog
            data?.categories?.find(c => c.id === item.final_category_id)?.nombre ||
            undefined,
          categoria_global_id: item.categoria_global_id ?? undefined,
          cantidad_planeada: typeof item.cantidad === 'string' ? parseFloat(item.cantidad) : item.cantidad,
          unidad_medida: item.unidad_medida ?? undefined,
          marca: item.marca ?? undefined,
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
          flatListMode: false,
        },
      }

      const execution = await ExecutionStorage.createLocal(input)

      notify.success('¡Compra iniciada!', undefined, { position: 'bottom-center' })

      // Redirect to execution screen
      router.push(`/shopping-executions/${execution.localId}`)
    } catch (error) {
      console.error('Error starting execution:', error)
      notify.error('Error al iniciar compra', { position: 'bottom-center' })
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
      <div ref={itemsContainerRef} className="flex-1 overflow-y-auto p-4 pb-32 space-y-4">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-start gap-3">
            <Button
              variant="ghost"
              size="icon"
              aria-label={tSummary('backLabel')}
              onClick={() => {
                router.back()
              }}
            >
              <ArrowLeft size={20} />
            </Button>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs uppercase text-muted-foreground">
                <span className="whitespace-nowrap">{tSummary('activeLabel')}</span>
                <span className="whitespace-nowrap">
                  {tSummary('productsTitle')}
                </span>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <div className="flex-1 min-w-[200px]">
                  <h1 className="typography-h3 text-foreground">{data.listInfo.nombre}</h1>
                </div>
                <p className="typography-h3 text-foreground leading-tight text-right min-w-[80px]">
                  {items.length}
                </p>
              </div>
              {data.listInfo.descripcion && (
                <p className="typography-body-sm text-muted-foreground">
                  {data.listInfo.descripcion}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="default"
              className="flex-1 gap-2"
              onClick={() => setConfigureExecutionOpen(true)}
              disabled={items.length === 0}
            >
              <ShoppingCart size={18} />
              {tSummary('executeButton')}
            </Button>
          </div>
        </div>

        {/* Invisible spacer - creates scroll space for first 4 items (only when input is focused) */}
        {inputFocused && items.length > 0 && items.length < 5 && (
          <div style={{ height: '350px' }} aria-hidden="true" />
        )}

        {/* Items List */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p>Lista vacía</p>
            <p className="typography-body-sm">Agrega items usando el campo de abajo</p>
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
                    data-item-id={item.id}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onClick={(e) => handleItemClick(item, e)}
                    className={`flex items-start gap-2 px-2 py-1 hover:bg-muted cursor-pointer transition-colors ${
                      isSaving ? 'opacity-60' : ''
                    } ${hasError ? 'text-destructive' : ''}`}
                  >
                    <div className="flex-shrink-0 mt-1 w-2 h-2 rounded-full bg-muted-foreground/40" />
                    <span className="font-medium flex-shrink-0">
                      {decimalToFraction(typeof item.cantidad === 'string' ? parseFloat(item.cantidad) : item.cantidad) || Math.round(typeof item.cantidad === 'string' ? parseFloat(item.cantidad) : item.cantidad)}
                    </span>
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
        ) : groupByCategory ? (
          /* GROUPED BY CATEGORY MODE */
          <div className="space-y-4">
            {(() => {
              // Group items by category (prioritize final_category_id which includes catalog categories)
              const grouped = items.reduce((acc, item) => {
                const catId = item.final_category_id || 'sin-categoria'
                if (!acc[catId]) acc[catId] = []
                acc[catId].push(item)
                return acc
              }, {} as Record<string, typeof items>)

              return Object.entries(grouped).map(([catId, categoryItems]) => {
                const category = data?.categories?.find(c => c.id === catId)
                const categoryName = category?.nombre || 'Sin categoría'

                return (
                  <div key={catId}>
                    {/* Category Header */}
                    <h3 className="typography-body-sm font-semibold text-muted-foreground mb-2 px-1">
                      {categoryName}
                    </h3>

                    {/* Items in this category */}
                    <div className="space-y-1.5">
                      {categoryItems.map((item) => {
                        const saveState = itemSaveState[item.id]
                        const isSaving = saveState?.isSaving ?? false
                        const hasError = !!saveState?.error

                        return (
                          <Card
                            key={item.id}
                            data-item-id={item.id}
                            className={`p-2 transition-opacity ${
                              isSaving ? 'opacity-60' : ''
                            } ${hasError ? 'border-destructive/50 bg-destructive/5' : ''}`}
                          >
                            <div className="space-y-0.5">
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
                                <div className="typography-label min-w-[2.6ch] px-0.5 text-center flex-shrink-0">
                                  {decimalToFraction(typeof item.cantidad === 'string' ? parseFloat(item.cantidad) : item.cantidad) || Math.round(typeof item.cantidad === 'string' ? parseFloat(item.cantidad) : item.cantidad)}
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
                                  onPointerDown={handlePointerDown}
                                  onPointerMove={handlePointerMove}
                                  onClick={(e) => handleItemClick(item, e)}
                                  className="flex-1 h-auto justify-start text-left px-2 py-0.5 font-medium hover:bg-muted"
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

                              {/* Line 2: Comment (if exists) - indented */}
                              {item.comentario && (
                                <div className="typography-metadata pl-12 leading-tight">
                                  {item.comentario}
                                </div>
                              )}

                              {/* Error message */}
                              {hasError && (
                                <div className="flex items-center gap-2 text-xs text-destructive pl-12">
                                  <AlertCircle size={12} />
                                  <span>Error al guardar. Intenta de nuevo.</span>
                                </div>
                              )}
                            </div>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                )
              })
            })()}
          </div>
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
                  data-item-id={item.id}
                  className={`p-2 transition-opacity ${
                    isSaving ? 'opacity-60' : ''
                  } ${hasError ? 'border-destructive/50 bg-destructive/5' : ''}`}
                >
                  <div className="space-y-0.5">
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
                      <div className="typography-label min-w-[2.6ch] px-0.5 text-center flex-shrink-0">
                        {decimalToFraction(typeof item.cantidad === 'string' ? parseFloat(item.cantidad) : item.cantidad) || Math.round(typeof item.cantidad === 'string' ? parseFloat(item.cantidad) : item.cantidad)}
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
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onClick={(e) => handleItemClick(item, e)}
                        className="flex-1 h-auto justify-start text-left px-2 py-0.5 font-medium hover:bg-muted"
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

                    {/* Line 2: Comment (if exists) - indented under product name */}
                    {item.comentario && (
                      <div className="typography-metadata pl-12 leading-tight">
                        {item.comentario}
                      </div>
                    )}

                    {/* Error message */}
                    {hasError && (
                      <div className="flex items-center gap-2 text-xs text-destructive pl-12">
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
        {data?.listInfo?.user_role === 'EXECUTION_ONLY' ? (
          <div className="flex items-center justify-center gap-2 p-4 bg-muted rounded-lg border border-border">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground font-medium">
              No puedes agregar productos
            </p>
          </div>
        ) : (
          <ProductQuantityInput
            onAddProduct={(name, qty) => handleAddItem(name, false, undefined, qty)}
            availableProducts={(() => {
              // Show catalog products first (they have categories)
              const catalogProducts = (data?.catalog || []).map((p) => ({ ...p, is_catalog: true }))

              // Only show custom products that are NOT in the catalog (to avoid duplicates)
              const catalogNames = new Set(catalogProducts.map(p => p.nombre.toLowerCase()))
              const uniqueCustomProducts = (data?.customProducts || [])
                .filter(p => !catalogNames.has(p.nombre.toLowerCase()))
                .map((p) => ({ ...p, is_catalog: false }))

              return [...catalogProducts, ...uniqueCustomProducts]
            })()}
            onSettingsClick={() => setOptionsDrawerOpen(true)}
            onFocusChange={setInputFocused}
          />
        )}
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
          item={{
            ...selectedItem,
            cantidad: typeof selectedItem.cantidad === 'string' ? parseFloat(selectedItem.cantidad) : selectedItem.cantidad,
          }}
          categories={data?.categories || []}
          onSave={handleSaveItemEdit}
          onDelete={() => handleDeleteItem(selectedItem.id)}
        />
      )}

      {/* Configure Execution Drawer */}
      <ConfigureExecutionDrawer
        open={configureExecutionOpen}
        onOpenChange={setConfigureExecutionOpen}
        userId={userId}
        onConfirm={handleExecutePurchase}
        isSharedList={data?.listInfo?.user_role !== undefined && data?.listInfo?.user_role !== 'OWNER'}
        isListOwner={data?.listInfo?.is_owner ?? true}
      />
    </div>
  )
}
