/**
 * GRÁFICO 9: Línea - Tendencia de Gasto en Compras
 *
 * ⚠️ DEMO - Borrar cuando se implemente sistema real
 */

'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card } from '@/components/ui/card'
import { DUMMY_SHOPPING_TREND } from '../data/dummy-data'

export function ShoppingTrendLine() {
  return (
    <Card className="p-6">
      <h3 className="typography-h3 mb-4">📈 Tendencia Mensual de Compras</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={DUMMY_SHOPPING_TREND}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="mes" className="text-xs" />
          <YAxis className="text-xs" />
          <Tooltip
            formatter={(value: number) => `$${value.toLocaleString()}`}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }}
          />
          <Line
            type="monotone"
            dataKey="gasto"
            stroke="#ec4899"
            strokeWidth={3}
            dot={{ fill: '#ec4899', strokeWidth: 2, r: 5 }}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex justify-between items-center mt-2">
        <p className="typography-metadata">Últimos 5 meses</p>
        <p className="typography-caption">
          Promedio: ${Math.round(DUMMY_SHOPPING_TREND.reduce((a, b) => a + b.gasto, 0) / DUMMY_SHOPPING_TREND.length).toLocaleString()}
        </p>
      </div>
    </Card>
  )
}
