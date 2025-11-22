/**
 * GRÁFICO 5: Barras Apiladas - Gastos Semanales por Categoría
 *
 * ⚠️ DEMO - Borrar cuando se implemente sistema real
 */

'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card } from '@/components/ui/card'
import { DUMMY_WEEKLY_SPENDING } from '../data/dummy-data'

export function WeeklyStackedChart() {
  return (
    <Card className="p-6">
      <h3 className="typography-h3 mb-4">📅 Gastos Semanales por Categoría</h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={DUMMY_WEEKLY_SPENDING}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="semana" className="text-xs" />
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
          <Bar dataKey="Supermercado" stackId="a" fill="#10b981" />
          <Bar dataKey="Transporte" stackId="a" fill="#3b82f6" />
          <Bar dataKey="Restaurantes" stackId="a" fill="#f59e0b" />
          <Bar dataKey="Entretenimiento" stackId="a" fill="#8b5cf6" />
          <Bar dataKey="Otros" stackId="a" fill="#6b7280" />
        </BarChart>
      </ResponsiveContainer>
      <p className="typography-metadata mt-2">
        Noviembre 2024 • 4 semanas completas
      </p>
    </Card>
  )
}
