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
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { notify } from '@/infrastructure/lib/notifications'

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

  // Input state
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

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

  // Refs
  const inputRef = useRef<HTMLInputElement>(null)
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
        notify.error('Error al guardar cambios')
      }
    } catch (error) {
      console.error('Error saving changes:', error)
      notify.error('Error al guardar cambios')
    } finally {
      setIsSaving(false)
    }
  }

  // Parse quick text entry (supports multiple formats)
  const parseQuickEntry = (text: string): Array<{
    nombre: string
    cantidad: number
    unidad?: string
  }> => {
    // Format examples:
    // - "leche"
    // - "2 leche"
    // - "leche, pan, queso"
    // - "2 kg manzanas, 1 L leche, pan"

    const lines = text.split(/[,\n]/).map((l) => l.trim()).filter((l) => l)
    const parsed: Array<{ nombre: string; cantidad: number; unidad?: string }> = []

    for (const line of lines) {
      // Try to extract quantity and unit
      const match = line.match(/^(\d+\.?\d*)\s*([a-zA-Z]+)?\s+(.+)$/)
      if (match) {
        const [, cantidadStr, unidad, nombre] = match
        parsed.push({
          nombre: nombre.trim(),
          cantidad: parseFloat(cantidadStr),
          unidad: unidad?.toLowerCase(),
        })
      } else {
        // Just a product name
        parsed.push({
          nombre: line.trim(),
          cantidad: 1,
        })
      }
    }

    return parsed
  }

  // Search for products in all sources
  const searchProducts = useCallback(
    (query: string): Product[] => {
      if (!data || query.length < 1) return []

      const lowerQuery = query.toLowerCase()
      const results: Product[] = []

      // Search in catalog
      const catalogMatches = data.catalog
        .filter((p) => p.nombre.toLowerCase().includes(lowerQuery))
        .slice(0, 10)
        .map((p) => ({ ...p, is_catalog: true }))

      // Search in custom products
      const customMatches = data.customProducts
        .filter((p) => p.nombre.toLowerCase().includes(lowerQuery))
        .slice(0, 10)
        .map((p) => ({ ...p, is_catalog: false }))

      // Combine and prioritize favorites/frequent
      results.push(...catalogMatches, ...customMatches)

      return results.slice(0, 20)
    },
    [data]
  )

  const handleInputChange = (value: string) => {
    setInputValue(value)
    if (value.trim()) {
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }

  const handleAddItem = (productName: string, isCatalog: boolean, productId?: string) => {
    // Parse entrada rápida si hay comas o múltiples líneas
    if (inputValue.includes(',') || inputValue.includes('\n')) {
      const parsed = parseQuickEntry(inputValue)
      for (const entry of parsed) {
        addItemToList(entry.nombre, 1, entry.cantidad, entry.unidad)
      }
    } else {
      addItemToList(productName, isCatalog ? 1 : 0, 1, undefined, productId)
    }

    setInputValue('')
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const addItemToList = async (
    productName: string,
    isCatalog: number,
    cantidad: number = 1,
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

    // Create new item
    const newItem: ListItem = {
      id: `temp-${Date.now()}`, // Temporary ID
      shopping_list_id: listId,
      product_id: finalIsCatalog ? finalProductId : undefined,
      product_custom_id: !finalIsCatalog ? finalProductId : undefined,
      is_catalog: finalIsCatalog,
      cantidad,
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

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
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

  // Suggestions filtered by input
  const suggestions = useMemo(() => {
    return searchProducts(inputValue)
  }, [inputValue, searchProducts])

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

                  {showInlineQty ? (
                    <Input
                      type="number"
                      value={item.cantidad}
                      onChange={(e) =>
                        handleUpdateQuantity(item.id, parseFloat(e.target.value) || 1)
                      }
                      className="w-20"
                      min="0.1"
                      step="0.1"
                    />
                  ) : (
                    <span className="text-sm">{item.cantidad}</span>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteItem(item.id)}
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
        <div className="relative">
          {/* Suggestions Dropdown (above input) */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {suggestions.map((product) => (
                <button
                  key={product.id}
                  className="w-full text-left px-4 py-2 hover:bg-accent transition-colors"
                  onClick={() =>
                    handleAddItem(product.nombre, !!product.is_catalog, product.id)
                  }
                >
                  <p className="font-medium">{product.nombre}</p>
                  {product.descripcion && (
                    <p className="text-xs text-muted-foreground">
                      {product.descripcion}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && inputValue.trim()) {
                  handleAddItem(inputValue.trim(), false)
                }
              }}
              placeholder="Agregar producto (ej: 2 kg manzanas, pan, leche)"
              className="flex-1"
            />
            <Button
              onClick={() => inputValue.trim() && handleAddItem(inputValue.trim(), false)}
              disabled={!inputValue.trim()}
            >
              <Plus size={18} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
