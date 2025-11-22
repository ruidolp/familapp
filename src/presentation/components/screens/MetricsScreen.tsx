/**
 * SCREEN: Métricas - Demo de Gráficos
 *
 * ⚠️ TEMPORAL - Solo para evaluación de diseños
 * Borrar cuando se implemente el sistema real de métricas
 */

'use client'

import { Separator } from '@/components/ui/separator'

// Gráficos de Transacciones/Sobres
import { CategoriesBarChart } from '../metrics-demo/charts/CategoriesBarChart'
import { CategoriesPieChart } from '../metrics-demo/charts/CategoriesPieChart'
import { SobresComparisonChart } from '../metrics-demo/charts/SobresComparisonChart'
import { SpendingTimelineChart } from '../metrics-demo/charts/SpendingTimelineChart'
import { WeeklyStackedChart } from '../metrics-demo/charts/WeeklyStackedChart'

// Gráficos de Listas/Shopping
import { StoresBarChart } from '../metrics-demo/charts/StoresBarChart'
import { ProductRadarChart } from '../metrics-demo/charts/ProductRadarChart'
import { PriceQuantityScatter } from '../metrics-demo/charts/PriceQuantityScatter'
import { ShoppingTrendLine } from '../metrics-demo/charts/ShoppingTrendLine'
import { TreemapChart } from '../metrics-demo/charts/TreemapChart'

// Gráficos Bloqueados
import { LockedBurnRate } from '../metrics-demo/charts/LockedBurnRate'
import { LockedProjection } from '../metrics-demo/charts/LockedProjection'
import { LockedHealthScore } from '../metrics-demo/charts/LockedHealthScore'
import { LockedCategories } from '../metrics-demo/charts/LockedCategories'

export function MetricsScreen() {
  return (
    <div className="h-full overflow-y-auto pb-20">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">📊 Métricas</h1>
          <p className="text-sm text-muted-foreground">
            Demo de gráficos - Evaluación de formatos y diseños
          </p>
        </div>

        <Separator />

        {/* SECCIÓN 1: TRANSACCIONES Y SOBRES */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">🏷️ Transacciones y Sobres</h2>
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
              5 gráficos
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CategoriesBarChart />
            <CategoriesPieChart />
            <SobresComparisonChart />
            <SpendingTimelineChart />
          </div>

          {/* Full width */}
          <WeeklyStackedChart />
        </div>

        <Separator />

        {/* SECCIÓN 2: LISTAS Y COMPRAS */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">🛒 Listas y Compras</h2>
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
              5 gráficos
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StoresBarChart />
            <ProductRadarChart />
            <PriceQuantityScatter />
            <ShoppingTrendLine />
          </div>

          {/* Full width */}
          <TreemapChart />
        </div>

        <Separator />

        {/* SECCIÓN 3: EJEMPLOS BLOQUEADOS */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">🔒 Métricas Bloqueadas</h2>
            <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-full">
              4 ejemplos
            </span>
          </div>

          <p className="text-sm text-muted-foreground">
            Estos gráficos muestran el efecto de desbloqueo progresivo con overlay y blur
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LockedBurnRate />
            <LockedProjection />
            <LockedHealthScore />
            <LockedCategories />
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border">
          <h3 className="text-sm font-semibold mb-2">ℹ️ Acerca de esta demo</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• 14 gráficos totales usando Recharts</li>
            <li>• 10 gráficos normales (5 transacciones + 5 listas)</li>
            <li>• 4 gráficos con efecto de desbloqueo (blur + overlay)</li>
            <li>• Todos los datos son dummy para evaluación de diseño</li>
            <li>• Componentes ubicados en: <code className="bg-muted px-1 py-0.5 rounded">src/presentation/components/metrics-demo/</code></li>
          </ul>
        </div>
      </div>
    </div>
  )
}
