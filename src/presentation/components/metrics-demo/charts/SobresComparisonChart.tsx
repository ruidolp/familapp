/**
 * GRÁFICO 3: Barras Verticales - Comparación Sobres
 *
 * ⚠️ DEMO - Borrar cuando se implemente sistema real
 */

'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card } from '@/components/ui/card'
import { DUMMY_SOBRES_COMPARISON } from '../data/dummy-data'

export function SobresComparisonChart() {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">💰 Presupuesto vs Gastado por Sobre</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={DUMMY_SOBRES_COMPARISON}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="sobre"
            className="text-xs"
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
          <Legend />
          <Bar dataKey="presupuesto" fill="#3b82f6" name="Presupuesto" radius={[8, 8, 0, 0]} />
          <Bar dataKey="gastado" fill="#ef4444" name="Gastado" radius={[8, 8, 0, 0]} />
          <Bar dataKey="disponible" fill="#10b981" name="Disponible" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-muted-foreground mt-2">
        Total presupuestado: ${DUMMY_SOBRES_COMPARISON.reduce((a, b) => a + b.presupuesto, 0).toLocaleString()}
      </p>
    </Card>
  )
}
