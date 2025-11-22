/**
 * GRÁFICO 6: Barras Horizontales - Top Tiendas
 *
 * ⚠️ DEMO - Borrar cuando se implemente sistema real
 */

'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card } from '@/components/ui/card'
import { DUMMY_STORES_SPENDING } from '../data/dummy-data'

export function StoresBarChart() {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">🏪 Top Tiendas - Donde Más Compras</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={DUMMY_STORES_SPENDING} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis type="number" className="text-xs" />
          <YAxis
            dataKey="tienda"
            type="category"
            width={100}
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
          <Bar dataKey="monto" fill="#06b6d4" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-muted-foreground mt-2">
        {DUMMY_STORES_SPENDING.reduce((a, b) => a + b.compras, 0)} compras en total • Ticket promedio: ${Math.round(DUMMY_STORES_SPENDING.reduce((a, b) => a + b.monto, 0) / DUMMY_STORES_SPENDING.reduce((a, b) => a + b.compras, 0)).toLocaleString()}
      </p>
    </Card>
  )
}
