/**
 * GRÁFICO 1: Barras Horizontales - Top Categorías
 *
 * ⚠️ DEMO - Borrar cuando se implemente sistema real
 */

'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card } from '@/components/ui/card'
import { DUMMY_CATEGORIES_SPENDING } from '../data/dummy-data'

export function CategoriesBarChart() {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">📊 Top Categorías por Gasto</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={DUMMY_CATEGORIES_SPENDING} layout="vertical">
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
          <Bar dataKey="monto" radius={[0, 8, 8, 0]}>
            {DUMMY_CATEGORIES_SPENDING.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-muted-foreground mt-2">
        Últimos 30 días • Total: ${DUMMY_CATEGORIES_SPENDING.reduce((a, b) => a + b.monto, 0).toLocaleString()}
      </p>
    </Card>
  )
}
