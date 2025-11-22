/**
 * GRÁFICO 2: Pie/Dona - Distribución por Categoría
 *
 * ⚠️ DEMO - Borrar cuando se implemente sistema real
 */

'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Card } from '@/components/ui/card'
import { DUMMY_CATEGORIES_SPENDING } from '../data/dummy-data'

export function CategoriesPieChart() {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">🎯 Distribución de Gastos</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={DUMMY_CATEGORIES_SPENDING}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ categoria, porcentaje }) => `${categoria.slice(0, 3)} ${porcentaje}%`}
            outerRadius={90}
            fill="#8884d8"
            dataKey="monto"
          >
            {DUMMY_CATEGORIES_SPENDING.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => `$${value.toLocaleString()}`}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry: any) => `${entry.payload.emoji} ${value}`}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  )
}
