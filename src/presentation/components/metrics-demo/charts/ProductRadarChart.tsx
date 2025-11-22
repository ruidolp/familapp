/**
 * GRÁFICO 7: Radar - Productos Más Comprados
 *
 * ⚠️ DEMO - Borrar cuando se implemente sistema real
 */

'use client'

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip, ResponsiveContainer } from 'recharts'
import { Card } from '@/components/ui/card'
import { DUMMY_PRODUCT_RADAR } from '../data/dummy-data'

export function ProductRadarChart() {
  return (
    <Card className="p-6">
      <h3 className="typography-h3 mb-4">🎯 Análisis de Productos - Frecuencia vs Gasto</h3>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={DUMMY_PRODUCT_RADAR}>
          <PolarGrid stroke="hsl(var(--muted))" />
          <PolarAngleAxis dataKey="producto" className="text-xs" />
          <PolarRadiusAxis angle={90} domain={[0, 100]} className="text-xs" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Radar
            name="Frecuencia de Compra"
            dataKey="frecuencia"
            stroke="#8b5cf6"
            fill="#8b5cf6"
            fillOpacity={0.6}
          />
          <Radar
            name="Nivel de Gasto"
            dataKey="gasto"
            stroke="#f59e0b"
            fill="#f59e0b"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
      <p className="typography-metadata mt-2">
        Análisis basado en últimos 3 meses
      </p>
    </Card>
  )
}
