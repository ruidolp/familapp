'use client'

/**
 * ExecutionScreen Component
 *
 * Main screen for shopping execution (purchase flow)
 * Features:
 * - Offline-first with IndexedDB
 * - Real-time timer
 * - Product list with tap/long-press actions
 * - Price input drawer
 * - Calculator
 * - Settings menu
 * - Budget tracking
 * - Category grouping
 * - Finalize and sync
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Button } from '@/presentation/components/ui/button'
import { Loader2, Plus, Settings } from 'lucide-react'
import { useExecutionState } from '@/presentation/hooks/useExecutionState'
import { useTimer } from '@/presentation/hooks/useTimer'
import { ExecutionHeader } from '@/presentation/components/execution/ExecutionHeader'
import { ExecutionItem } from '@/presentation/components/execution/ExecutionItem'
import { PriceInputDrawer } from '@/presentation/components/execution/PriceInputDrawer'
import { AddProductOnTheFlyDrawer } from '@/presentation/components/execution/AddProductOnTheFlyDrawer'
import { CalculatorDrawer } from '@/presentation/components/execution/CalculatorDrawer'
import { ExecutionSettingsDrawer } from '@/presentation/components/execution/ExecutionSettingsDrawer'
import { FinalizeExecutionDrawer } from '@/presentation/components/execution/FinalizeExecutionDrawer'
import { PauseExecutionDrawer } from '@/presentation/components/execution/PauseExecutionDrawer'
import type { LocalExecutionItem, LocalShoppingExecution } from '@/domain/types/shopping-execution'
import { notify } from '@/infrastructure/lib/notifications'

interface ExecutionScreenProps {
  executionId: string
  userId: string
}

type AvailableProduct = { id: string; nombre: string; is_catalog?: boolean }

export function ExecutionScreen({ executionId, userId }: ExecutionScreenProps) {
  const router = useRouter()
  const locale = useLocale()

  // Main state
  const {
    execution,
    loading,
    autoSaving,
    error,
    markItemAs,
    updateItemPrice,
    addItemOnTheFly,
    updateSettings,
    updateBudget,
    updateManualTotal,
    finalizeExecution,
    pendingItems,
    purchasedItems,
    discardedItems,
    budgetRemaining,
    budgetPercentage,
  } = useExecutionState(executionId)

  // Timer
  const timer = useTimer(execution?.localId || null)

  // UI state
  const [priceDrawerOpen, setPriceDrawerOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<LocalExecutionItem | null>(null)
  const [addProductDrawerOpen, setAddProductDrawerOpen] = useState(false)
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const [finalizeOpen, setFinalizeOpen] = useState(false)
  const [pauseDrawerOpen, setPauseDrawerOpen] = useState(false)
  const [availableProducts, setAvailableProducts] = useState<AvailableProduct[]>([])

  // Keep suggestions updated with items already in the execution (user products / on-the-fly)
  useEffect(() => {
    if (!execution) {
      setAvailableProducts([])
      return
    }

    const executionProducts = buildAvailableProductsFromExecution(execution)
    setAvailableProducts((prev) => mergeProducts(prev, executionProducts))
  }, [execution, execution?.availableProducts, execution?.items])

  // Load global + user catalog the same way as the list editor input
  useEffect(() => {
    if (!execution?.shopping_list_id) return

    let cancelled = false

    const loadProducts = async () => {
      try {
        const response = await fetch(`/api/shopping-lists/${execution.shopping_list_id}/editor-data`)
        if (!response.ok) {
          console.error('Failed to load available products for execution:', response.statusText)
          return
        }

        const data = await response.json()
        const productsFromEditor = buildAvailableProductsFromEditorData(data)

        if (!cancelled && productsFromEditor.length > 0) {
          setAvailableProducts((prev) => mergeProducts(productsFromEditor, prev))
        }
      } catch (err) {
        console.error('Error loading available products for execution:', err)
      }
    }

    loadProducts()

    return () => {
      cancelled = true
    }
  }, [execution?.shopping_list_id])

  // Redirect if no execution found
  useEffect(() => {
    if (!loading && (!execution || error)) {
      notify.error('Ejecución no encontrada')
      router.push(`/${locale}/dashboard`)
    }
  }, [loading, execution, error, router, locale])

  // Handle item tap
  const handleItemTap = (item: LocalExecutionItem) => {
    if (!execution) return

    if (item.status === 'pending') {
      // If prices enabled, open price drawer
      if (execution.settings.enablePrices) {
        setSelectedItem(item)
        setPriceDrawerOpen(true)
      } else {
        // Otherwise, mark as purchased immediately
        markItemAs(item.localId, 'purchased')
        notify.success('Producto comprado')
      }
    } else if (item.status === 'purchased') {
      if (execution.settings.enablePrices) {
        // Allow editing price
        setSelectedItem(item)
        setPriceDrawerOpen(true)
      } else {
        // Allow unmarking as purchased (back to pending)
        markItemAs(item.localId, 'pending')
        notify.success('Producto marcado como no comprado')
      }
    }
  }

  // Handle item long press
  const handleItemLongPress = (item: LocalExecutionItem) => {
    if (item.status === 'pending') {
      markItemAs(item.localId, 'discarded')
      notify.success('Producto descartado')
    } else if (item.status === 'discarded') {
      markItemAs(item.localId, 'pending')
      notify.success('Producto disponible nuevamente')
    }
  }

  // Handle price save
  const handlePriceSave = async (data: {
    unitario?: number
    total?: number
    cantidad?: number
  }) => {
    if (!selectedItem) return

    try {
      await updateItemPrice(selectedItem.localId, data)
      notify.success('Precio guardado')
    } catch (error) {
      notify.error('Error al guardar precio')
    }
  }

  // Handle finalize
  const handleFinalize = async (manualTotal?: number) => {
    if (!execution) return

    try {
      // Finalize and sync (pass manualTotal directly to avoid state timing issues)
      await finalizeExecution(manualTotal)

      notify.success('¡Compra finalizada!')
      router.push(`/${locale}/dashboard`)
    } catch (error: any) {
      console.error('Error finalizing:', error)
      notify.error(error.message || 'Error al finalizar compra')
      throw error
    }
  }

  // Handle pause and return to lists
  const handlePause = () => {
    notify.info('Compra pausada')
    router.push(`/${locale}/dashboard`)
  }

  // Handle add product on the fly
  const handleAddProduct = async (data: {
    nombre: string
    cantidad: number
    unitario?: number
    total?: number
  }) => {
    if (!execution) return

    console.log('🎯 ExecutionScreen: handleAddProduct called with:', data)

    try {
      // 1. Create product on-the-fly (initially pending)
      const itemLocalId = await addItemOnTheFly({
        product_name: data.nombre,
        cantidad_planeada: data.cantidad,
        unidad_medida: 'unidad(es)',
        marca: undefined,
        is_catalog: false,
        product_id: undefined,
        product_custom_id: undefined,
        categoria_producto_id: undefined,
        categoria_producto_nombre: undefined,
        categoria_global_id: undefined,
      })

      console.log('✅ ExecutionScreen: Item added with localId:', itemLocalId)
      console.log('📊 Current pending items:', pendingItems.length)

      // 2. If prices provided, update them and mark as purchased
      if (data.unitario || data.total) {
        console.log('💰 Updating price for item:', itemLocalId)
        await updateItemPrice(itemLocalId, {
          cantidad: data.cantidad,
          unitario: data.unitario,
          total: data.total,
        })
      }

      notify.success(`${data.nombre} agregado`)
    } catch (error) {
      console.error('❌ Error adding product:', error)
      notify.error('Error al agregar producto')
    }
  }

  // Group items by category if enabled
  const itemsByCategory = execution?.settings.showCategories
    ? groupByCategory([...pendingItems, ...purchasedItems, ...discardedItems])
    : null

  // Debug log for items
  useEffect(() => {
    if (execution) {
      console.log('🔍 ExecutionScreen render:', {
        totalItems: execution.items.length,
        pending: pendingItems.length,
        purchased: purchasedItems.length,
        discarded: discardedItems.length,
      })
    }
  }, [execution, pendingItems, purchasedItems, discardedItems])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!execution) {
    return null
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <ExecutionHeader
        listName="Ejecutando compra"
        storeName={execution.registration.store_name}
        showTimer={execution.settings.showTimer}
        timerFormatted={timer.formattedTime}
        budgetEnabled={execution.budget.enabled}
        budgetAmount={execution.budget.amount}
        totalSpent={execution.totalSpent}
        budgetPercentage={budgetPercentage}
        onCalculatorClick={() => setCalculatorOpen(true)}
        onBackClick={() => setPauseDrawerOpen(true)}
      />

      {/* Error message */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 typography-body-sm text-destructive">
          {error}
        </div>
      )}

      {/* Items List */}
      <div className="flex-1 overflow-y-auto px-4 pb-28">
        {execution.settings.flatListMode ? (
          // Flat List Mode - Simplified text view
          <div className="mt-4">
            <div className="bg-background border rounded-lg p-2">
              <div className="space-y-0">
                {[...pendingItems, ...purchasedItems, ...discardedItems].map(item => (
                  <ExecutionItem
                    key={item.localId}
                    item={item}
                    enablePrices={execution.settings.enablePrices}
                    flatListMode={true}
                    onTap={handleItemTap}
                    onLongPress={handleItemLongPress}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : execution.settings.showCategories && itemsByCategory ? (
          // Grouped by category
          <div className="space-y-6 mt-4">
            {Object.entries(itemsByCategory).map(([category, items]) => (
              <div key={category}>
                <h2 className="typography-body-sm font-semibold text-muted-foreground mb-2 sticky top-0 bg-background py-2">
                  {category || 'Sin categoría'} ({items.length})
                </h2>
                <div className="space-y-2">
                  {items.map(item => (
                    <ExecutionItem
                      key={item.localId}
                      item={item}
                      enablePrices={execution.settings.enablePrices}
                      onTap={handleItemTap}
                      onLongPress={handleItemLongPress}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Regular list with sections
          <div className="space-y-4 mt-4">
            {/* Pending items section */}
            {pendingItems.length > 0 && (
              <div>
                <h3 className="typography-caption uppercase tracking-wide text-muted-foreground mb-2">
                  Por Comprar ({pendingItems.length})
                </h3>
                <div className="space-y-2">
                  {pendingItems.map(item => (
                    <ExecutionItem
                      key={item.localId}
                      item={item}
                      enablePrices={execution.settings.enablePrices}
                      onTap={handleItemTap}
                      onLongPress={handleItemLongPress}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Purchased items section */}
            {purchasedItems.length > 0 && (
              <div>
                <h3 className="typography-caption uppercase tracking-wide text-success mb-2">
                  ✓ Comprados ({purchasedItems.length})
                </h3>
                <div className="space-y-2">
                  {purchasedItems.map(item => (
                    <ExecutionItem
                      key={item.localId}
                      item={item}
                      enablePrices={execution.settings.enablePrices}
                      onTap={handleItemTap}
                      onLongPress={handleItemLongPress}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Discarded items section */}
            {discardedItems.length > 0 && (
              <div>
                <h3 className="typography-caption uppercase tracking-wide text-destructive/80 mb-2">
                  ✗ Descartados ({discardedItems.length})
                </h3>
                <div className="space-y-2">
                  {discardedItems.map(item => (
                    <ExecutionItem
                      key={item.localId}
                      item={item}
                      enablePrices={execution.settings.enablePrices}
                      onTap={handleItemTap}
                      onLongPress={handleItemLongPress}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {execution.items.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-muted-foreground">No hay productos en esta lista</p>
          </div>
        )}
      </div>

      {/* Bottom Actions - Fixed footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 safe-area-inset-bottom">
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 flex-shrink-0"
            onClick={() => setAddProductDrawerOpen(true)}
            title="Agregar producto"
          >
            <Plus className="h-5 w-5" />
          </Button>
          <Button
            className="flex-1 h-12 typography-label-lg"
            onClick={() => setFinalizeOpen(true)}
          >
            Finalizar Compra
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 flex-shrink-0"
            onClick={() => setConfigOpen(true)}
            title="Configuración"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Drawers and Sheets */}
      <PriceInputDrawer
        open={priceDrawerOpen}
        onOpenChange={setPriceDrawerOpen}
        item={selectedItem}
        onSave={handlePriceSave}
        onMarkAsNotPurchased={() => {
          if (selectedItem) {
            markItemAs(selectedItem.localId, 'pending')
            notify.success('Producto marcado como no comprado')
          }
        }}
      />

      <AddProductOnTheFlyDrawer
        open={addProductDrawerOpen}
        onOpenChange={setAddProductDrawerOpen}
        onSave={handleAddProduct}
        availableProducts={availableProducts}
      />

      <CalculatorDrawer
        open={calculatorOpen}
        onOpenChange={setCalculatorOpen}
      />

      <ExecutionSettingsDrawer
        open={configOpen}
        onOpenChange={setConfigOpen}
        settings={execution.settings}
        onSettingsChange={updateSettings}
      />

      <FinalizeExecutionDrawer
        open={finalizeOpen}
        onOpenChange={setFinalizeOpen}
        totalCalculated={execution.totalSpent}
        purchasedCount={purchasedItems.length}
        discardedCount={discardedItems.length}
        pendingCount={pendingItems.length}
        timerFormatted={timer.formattedTime}
        onConfirm={handleFinalize}
      />

      <PauseExecutionDrawer
        open={pauseDrawerOpen}
        onOpenChange={setPauseDrawerOpen}
        onConfirm={handlePause}
      />

      {/* Auto-saving indicator as overlay so it doesn't shift the list */}
      {autoSaving && (
        <div className="fixed right-4 bottom-24 z-30 pointer-events-none">
          <div className="inline-flex items-center gap-2 rounded-full bg-muted/90 px-3 py-2 shadow-lg backdrop-blur-sm typography-metadata">
            <Loader2 className="h-3 w-3 animate-spin" />
            Guardando...
          </div>
        </div>
      )}
    </div>
  )
}

// Build available products from execution payload and items (keeps on-the-fly additions)
function buildAvailableProductsFromExecution(
  execution?: LocalShoppingExecution | null
): AvailableProduct[] {
  if (!execution) return []

  const map = new Map<string, AvailableProduct>()

  execution.availableProducts?.forEach((p) => {
    if (!p.nombre) return
    const key = p.nombre.toLowerCase()
    if (!map.has(key)) {
      map.set(key, { id: p.id, nombre: p.nombre, is_catalog: p.is_catalog })
    }
  })

  execution.items.forEach((item) => {
    const name = item.product_name?.trim()
    if (!name) return
    const key = name.toLowerCase()
    if (!map.has(key)) {
      map.set(key, {
        id: item.product_id || item.product_custom_id || item.localId,
        nombre: name,
        is_catalog: item.is_catalog,
      })
    }
  })

  return Array.from(map.values())
}

// Mirror list editor combination: catalog first, then unique custom products
function buildAvailableProductsFromEditorData(data: any): AvailableProduct[] {
  if (!data) return []

  const catalogProducts: AvailableProduct[] = (data.catalog || []).map((p: any) => ({
    id: p.id,
    nombre: p.nombre,
    is_catalog: true,
  }))

  const catalogNames = new Set(catalogProducts.map((p) => p.nombre.toLowerCase()))

  const uniqueCustomProducts: AvailableProduct[] = (data.customProducts || [])
    .filter((p: any) => p?.nombre && !catalogNames.has(p.nombre.toLowerCase()))
    .map((p: any) => ({
      id: p.id,
      nombre: p.nombre,
      is_catalog: false,
    }))

  return [...catalogProducts, ...uniqueCustomProducts]
}

// Merge without duplicates by product name (preserves order from first array)
function mergeProducts(primary: AvailableProduct[], secondary: AvailableProduct[]): AvailableProduct[] {
  const map = new Map<string, AvailableProduct>()

  for (const product of [...primary, ...secondary]) {
    if (!product?.nombre) continue
    const key = product.nombre.toLowerCase()
    if (!map.has(key)) {
      map.set(key, product)
    }
  }

  return Array.from(map.values())
}

// Helper function to group items by category
// Separates purchased items into a floating "Productos Comprados" category at the end
function groupByCategory(items: LocalExecutionItem[]): Record<string, LocalExecutionItem[]> {
  const result: Record<string, LocalExecutionItem[]> = {}
  const purchasedItems: LocalExecutionItem[] = []

  for (const item of items) {
    // Separate purchased items for floating category
    if (item.status === 'purchased') {
      purchasedItems.push(item)
    } else {
      // Group pending and discarded items by their original category
      // Get category name: use the stored name (which can be from user or global categories)
      // The categoria_producto_nombre field is populated during execution creation with the actual
      // category name, regardless of whether it's a user or global category
      const category = item.categoria_producto_nombre || 'Sin categoría'
      if (!result[category]) {
        result[category] = []
      }
      result[category].push(item)
    }
  }

  // Add purchased items at the end as a floating category
  if (purchasedItems.length > 0) {
    result['✓ Productos Comprados'] = purchasedItems
  }

  return result
}
