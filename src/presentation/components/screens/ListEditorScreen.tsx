'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Search,
  Grid3x3,
  List as ListIcon,
  Save,
  X,
  Plus,
  Minus,
  Check,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { notify } from '@/infrastructure/lib/notifications'
import { adjustQty, quantityToDecimal, isValidQuantity } from '@/infrastructure/utils/quantity'
import { ProductQuantityInput } from '@/components/inputs/ProductQuantityInput'

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

// Debounce helper
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
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

  // Autosave state
  const [pendingChanges, setPendingChanges] = useState<{
    creates: any[]
    updates: any[]
    deletes: string[]
  }>({
    creates: [],
    updates: [],
    deletes: [],
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)

  // Refs
  const saveTimeoutRef = useRef<NodeJS.Timeout>()

  // Load data on mount
  useEffect(() => {
    loadEditorData()
  }, [listId])

  // Autosave debounced changes
  const debouncedChanges = useDebounce(pendingChanges, 15000)

  useEffect(() => {
    if (
      debouncedChanges.creates.length > 0 ||
      debouncedChanges.updates.length > 0 ||
      debouncedChanges.deletes.length > 0
    ) {
      saveChanges()
    }
  }, [debouncedChanges])

  // Flush on unmount (navigation away)
  useEffect(() => {
    return () => {
      flushChanges()
    }
  }, [])

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

  const flushChanges = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    if (
      pendingChanges.creates.length > 0 ||
      pendingChanges.updates.length > 0 ||
      pendingChanges.deletes.length > 0
    ) {
      saveChanges()
    }
  }

  const saveChanges = async () => {
    if (isSaving) return

    setIsSaving(true)
    setSaveError(false)
    try {
      const response = await fetch(`/api/shopping-lists/${listId}/items/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pendingChanges),
      })

      if (response.ok) {
        // Clear pending changes
        setPendingChanges({
          creates: [],
          updates: [],
          deletes: [],
        })
        // Optionally reload to get server state
        // await loadEditorData()
      } else {
        setSaveError(true)
        notify.error('Error al guardar cambios')
      }
    } catch (error) {
      console.error('Error saving changes:', error)
      setSaveError(true)
      notify.error('Error al guardar cambios')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRetry = () => {
    setSaveError(false)
    saveChanges()
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
    // Check if product exists in catalog or custom
    let finalProductId = productId
    let finalIsCatalog = !!isCatalog

    if (!finalProductId) {
      // Search in catalog first
      const catalogMatch = data?.catalog.find(
        (p) => p.nombre.toLowerCase() === productName.toLowerCase()
      )

      if (catalogMatch) {
        finalProductId = catalogMatch.id
        finalIsCatalog = true
      } else {
        // Search in custom products
        const customMatch = data?.customProducts.find(
          (p) => p.nombre.toLowerCase() === productName.toLowerCase()
        )

        if (customMatch) {
          finalProductId = customMatch.id
          finalIsCatalog = false
        } else {
          // Create new custom product
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

              // Add to local custom products
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

    // Convert quantity to decimal
    const cantidadDecimal = quantityToDecimal(quantity)

    // Create new item
    const newItem: ListItem = {
      id: `temp-${Date.now()}`, // Temporary ID
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

    // Add to pending creates
    setPendingChanges((prev) => ({
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
    // Remove from local state
    setItems(items.filter((i) => i.id !== itemId))

    // Add to pending deletes (if not a temporary item)
    if (!itemId.startsWith('temp-')) {
      setPendingChanges((prev) => ({
        ...prev,
        deletes: [...prev.deletes, itemId],
      }))
    }
  }

  const handleUpdateQuantity = (itemId: string, direction: 'up' | 'down') => {
    // Find the item
    const item = items.find((i) => i.id === itemId)
    if (!item) return

    // Get current quantity as string
    const currentQuantity = item.cantidad.toString()

    // Adjust quantity
    const newQuantityStr = adjustQty(currentQuantity, direction)

    // Convert to decimal for storage
    const newQuantity = quantityToDecimal(newQuantityStr)

    // Update local state
    setItems(
      items.map((i) =>
        i.id === itemId ? { ...i, cantidad: newQuantity } : i
      )
    )

    // Add to pending updates
    if (!itemId.startsWith('temp-')) {
      setPendingChanges((prev) => ({
        ...prev,
        updates: [
          ...prev.updates.filter((u) => u.id !== itemId),
          { id: itemId, cantidad: newQuantity },
        ],
      }))
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
              flushChanges()
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
          {isSaving && (
            <Badge variant="secondary" className="gap-1">
              <Save size={14} />
              Guardando...
            </Badge>
          )}
          {saveError && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle size={14} />
              Error al guardar
            </Badge>
          )}
        </div>

        {/* Error banner with retry */}
        {saveError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-3">
            <AlertCircle size={18} className="text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive flex-1">
              No se pudieron guardar los cambios. Verifica tu conexión.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              disabled={isSaving}
              className="gap-1"
            >
              <RefreshCw size={14} />
              Reintentar
            </Button>
          </div>
        )}

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
              id="inline-qty"
              checked={showInlineQty}
              onCheckedChange={setShowInlineQty}
            />
            <Label htmlFor="inline-qty">Edición inline cantidad</Label>
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
            {items.map((item) => (
              <Card key={item.id} className="p-3">
                <div className="flex items-center gap-3">
                  {/* Quantity (large, bold, on left) */}
                  <div className="text-2xl font-bold min-w-[3rem] text-center">
                    {item.cantidad}
                  </div>

                  {/* Product name */}
                  <div className="flex-1">
                    <p className="font-medium">
                      {item._productName || item.product_id || item.product_custom_id}
                    </p>
                    {item.unidad_medida && (
                      <p className="text-sm text-muted-foreground">
                        {item.unidad_medida}
                      </p>
                    )}
                  </div>

                  {/* Minus button */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleUpdateQuantity(item.id, 'down')}
                    className="h-9 w-9"
                  >
                    <Minus size={16} />
                  </Button>

                  {/* Plus button */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleUpdateQuantity(item.id, 'up')}
                    className="h-9 w-9"
                  >
                    <Plus size={16} />
                  </Button>

                  {/* Delete button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteItem(item.id)}
                    className="h-9 w-9"
                  >
                    <X size={16} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Input Fixed at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <ProductQuantityInput
          onAddProduct={(name, qty) => handleAddItem(name, false, undefined, qty)}
        />
      </div>
    </div>
  )
}
