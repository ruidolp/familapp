/**
 * GRÁFICO 4: Línea/Área - Evolución de Gastos
 *
 * ⚠️ DEMO - Borrar cuando se implemente sistema real
 */

'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card } from '@/components/ui/card'
import { DUMMY_SPENDING_TIMELINE } from '../data/dummy-data'

export function SpendingTimelineChart() {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">📈 Evolución Diaria de Gastos</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={DUMMY_SPENDING_TIMELINE}>
          <defs>
            <linearGradient id="colorGasto" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="fecha"
            className="text-xs"
            interval="preserveStartEnd"
            tick={{ fontSize: 10 }}
          />
          <YAxis className="text-xs" />
          <Tooltip
            formatter={(value: number) => `$${value.toLocaleString()}`}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }}
          />
          <Area
            type="monotone"
            dataKey="gasto"
            stroke="#8b5cf6"
            fillOpacity={1}
            fill="url(#colorGasto)"
          />
        </AreaChart>
      </ResponsiveContainer>
      <p className="text-xs text-muted-foreground mt-2">
        Últimos 21 días • Promedio diario: ${Math.round(DUMMY_SPENDING_TIMELINE.reduce((a, b) => a + b.gasto, 0) / DUMMY_SPENDING_TIMELINE.length).toLocaleString()}
      </p>
    </Card>
  )
}
