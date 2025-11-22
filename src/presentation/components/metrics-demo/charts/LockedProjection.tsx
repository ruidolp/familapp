/**
 * GRÁFICO 12: Proyección BLOQUEADO - Línea con Proyección
 *
 * ⚠️ DEMO - Borrar cuando se implemente sistema real
 */

'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { Card } from '@/components/ui/card'
import { LockedMetric } from '../LockedMetric'
import { DUMMY_PROJECTION } from '../data/dummy-data'

export function LockedProjection() {
  const chart = (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">🔮 Proyección de Fin de Mes</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={DUMMY_PROJECTION}>
          <defs>
            <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorProyectado" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="dia"
            className="text-xs"
            label={{ value: 'Día del Mes', position: 'insideBottom', offset: -5, style: { fontSize: 11 } }}
          />
          <YAxis className="text-xs" />
          <Tooltip
            formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="real"
            stroke="#10b981"
            fill="url(#colorReal)"
            name="Gasto Real"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="proyectado"
            stroke="#3b82f6"
            strokeDasharray="5 5"
            fill="url(#colorProyectado)"
            name="Proyección"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Proyección basada en tendencia actual • Fin de mes estimado: $450.000
      </p>
    </Card>
  )

  return (
    <LockedMetric
      isLocked={true}
      progress={{ current: 5, required: 12, label: 'días de historia' }}
      message="🔓 Necesitas 7 días más de uso para ver tu proyección de fin de mes"
    >
      {chart}
    </LockedMetric>
  )
}
