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
import { Loader2, Pause, Settings } from 'lucide-react'
import { useExecutionState } from '@/presentation/hooks/useExecutionState'
import { useTimer } from '@/presentation/hooks/useTimer'
import { ExecutionHeader } from '@/presentation/components/execution/ExecutionHeader'
import { ExecutionItem } from '@/presentation/components/execution/ExecutionItem'
import { PriceInputDrawer } from '@/presentation/components/execution/PriceInputDrawer'
import { CalculatorDrawer } from '@/presentation/components/execution/CalculatorDrawer'
import { ExecutionSettingsDrawer } from '@/presentation/components/execution/ExecutionSettingsDrawer'
import { FinalizeExecutionDrawer } from '@/presentation/components/execution/FinalizeExecutionDrawer'
import { PauseExecutionDrawer } from '@/presentation/components/execution/PauseExecutionDrawer'
import type { LocalExecutionItem } from '@/domain/types/shopping-execution'
import { notify } from '@/infrastructure/lib/notifications'

interface ExecutionScreenProps {
  executionId: string
  userId: string
}

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
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const [finalizeOpen, setFinalizeOpen] = useState(false)
  const [pauseDrawerOpen, setPauseDrawerOpen] = useState(false)

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
      // Update manual total if provided
      if (manualTotal !== undefined) {
        await updateBudget({ amount: manualTotal })
      }

      // Finalize and sync
      await finalizeExecution()

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

  // Group items by category if enabled
  const itemsByCategory = execution?.settings.showCategories
    ? groupByCategory([...pendingItems, ...purchasedItems, ...discardedItems])
    : null

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
      />

      {/* Auto-saving indicator */}
      {autoSaving && (
        <div className="px-4 py-2 bg-muted text-xs text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          Guardando...
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 text-sm text-destructive">
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
                <h2 className="text-sm font-semibold text-muted-foreground mb-2 sticky top-0 bg-background py-2">
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
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
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
                <h3 className="text-xs font-semibold uppercase tracking-wide text-success mb-2">
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
                <h3 className="text-xs font-semibold uppercase tracking-wide text-destructive/80 mb-2">
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
            onClick={() => setPauseDrawerOpen(true)}
            title="Pausar"
          >
            <Pause className="h-5 w-5" />
          </Button>
          <Button
            className="flex-1 h-12 text-base font-semibold"
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
    </div>
  )
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
