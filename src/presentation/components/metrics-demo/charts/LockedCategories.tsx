/**
 * GRÁFICO 14: Categorías BLOQUEADO - Barras Horizontales
 *
 * ⚠️ DEMO - Borrar cuando se implemente sistema real
 */

'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card } from '@/components/ui/card'
import { LockedMetric } from '../LockedMetric'
import { DUMMY_LOCKED_CATEGORIES } from '../data/dummy-data'

export function LockedCategories() {
  const chart = (
    <Card className="p-6">
      <h3 className="typography-h3 mb-4">📊 Análisis Detallado por Categoría</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={DUMMY_LOCKED_CATEGORIES} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis type="number" className="text-xs" />
          <YAxis
            dataKey="categoria"
            type="category"
            width={120}
            className="text-xs"
          />
          <Tooltip
            formatter={(value: number) => `$${value.toLocaleString()}`}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }}
          />
          <Bar dataKey="monto" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <p className="typography-metadata mt-2 text-center">
        Análisis completo con tendencias, comparaciones y proyecciones
      </p>
    </Card>
  )

  return (
    <LockedMetric
      isLocked={true}
      progress={{ current: 2, required: 3, label: 'transacciones en diferentes categorías' }}
      message="🔓 Registra 1 gasto más en otra categoría para desbloquear"
    >
      {chart}
    </LockedMetric>
  )
}
