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
import { Button } from '@/presentation/components/ui/button'
import { Loader2, Plus } from 'lucide-react'
import { useExecutionState } from '@/presentation/hooks/useExecutionState'
import { useTimer } from '@/presentation/hooks/useTimer'
import { ExecutionHeader } from '@/presentation/components/execution/ExecutionHeader'
import { ExecutionItem } from '@/presentation/components/execution/ExecutionItem'
import { PriceInputDrawer } from '@/presentation/components/execution/PriceInputDrawer'
import { CalculatorDrawer } from '@/presentation/components/execution/CalculatorDrawer'
import { SettingsSheet } from '@/presentation/components/execution/SettingsSheet'
import { FinalizeExecutionDrawer } from '@/presentation/components/execution/FinalizeExecutionDrawer'
import type { LocalExecutionItem } from '@/domain/types/shopping-execution'
import { notify } from '@/infrastructure/lib/notifications'

interface ExecutionScreenProps {
  executionId: string
  userId: string
}

export function ExecutionScreen({ executionId, userId }: ExecutionScreenProps) {
  const router = useRouter()

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
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [finalizeOpen, setFinalizeOpen] = useState(false)

  // Redirect if no execution found
  useEffect(() => {
    if (!loading && (!execution || error)) {
      notify.error('Ejecución no encontrada')
      router.push('/shopping-lists')
    }
  }, [loading, execution, error, router])

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
      }
    } else if (item.status === 'purchased' && execution.settings.enablePrices) {
      // Allow editing price
      setSelectedItem(item)
      setPriceDrawerOpen(true)
    }
  }

  // Handle item long press
  const handleItemLongPress = (item: LocalExecutionItem) => {
    if (item.status === 'pending') {
      markItemAs(item.localId, 'discarded')
      notify.success('Producto descartado')
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
      router.push(`/shopping-lists/${execution.shopping_list_id}`)
    } catch (error: any) {
      console.error('Error finalizing:', error)
      notify.error(error.message || 'Error al finalizar compra')
      throw error
    }
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
        onMenuClick={() => setSettingsOpen(true)}
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
        {execution.settings.showCategories && itemsByCategory ? (
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
          // Flat list with sections
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
                <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 mb-2">
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
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 opacity-60">
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
        <Button
          className="w-full h-12 text-base font-semibold"
          onClick={() => setFinalizeOpen(true)}
        >
          Finalizar Compra
        </Button>
      </div>

      {/* Drawers and Sheets */}
      <PriceInputDrawer
        open={priceDrawerOpen}
        onOpenChange={setPriceDrawerOpen}
        item={selectedItem}
        onSave={handlePriceSave}
      />

      <CalculatorDrawer
        open={calculatorOpen}
        onOpenChange={setCalculatorOpen}
      />

      <SettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
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
    </div>
  )
}

// Helper function to group items by category
function groupByCategory(items: LocalExecutionItem[]): Record<string, LocalExecutionItem[]> {
  return items.reduce((acc, item) => {
    // Get category name: prefer user category name, then global category ID, then "Sin categoría"
    const category = item.categoria_producto_nombre ||
                     (item.categoria_global_id ? `Categoría ${item.categoria_global_id.substring(0, 8)}` : '') ||
                     'Sin categoría'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(item)
    return acc
  }, {} as Record<string, LocalExecutionItem[]>)
}
