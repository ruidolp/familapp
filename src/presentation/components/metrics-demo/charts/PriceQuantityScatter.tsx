/**
 * GRÁFICO 8: Scatter/Puntos - Precio vs Cantidad
 *
 * ⚠️ DEMO - Borrar cuando se implemente sistema real
 */

'use client'

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts'
import { Card } from '@/components/ui/card'
import { DUMMY_PRICE_QUANTITY } from '../data/dummy-data'

export function PriceQuantityScatter() {
  return (
    <Card className="p-6">
      <h3 className="typography-h3 mb-4">📊 Precio Unitario vs Cantidad Comprada</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            type="number"
            dataKey="precio"
            name="Precio"
            unit=" $"
            className="text-xs"
            label={{ value: 'Precio Unitario ($)', position: 'insideBottom', offset: -10, style: { fontSize: 11 } }}
          />
          <YAxis
            type="number"
            dataKey="cantidad"
            name="Cantidad"
            unit=" u"
            className="text-xs"
            label={{ value: 'Cantidad', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
          />
          <ZAxis range={[60, 400]} />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload
                return (
                  <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                    <p className="font-semibold typography-body-sm">{data.producto}</p>
                    <p className="typography-metadata">🏪 {data.tienda}</p>
                    <p className="text-xs mt-1">Precio: ${data.precio.toLocaleString()}</p>
                    <p className="text-xs">Cantidad: {data.cantidad} unidades</p>
                  </div>
                )
              }
              return null
            }}
          />
          <Scatter name="Productos" data={DUMMY_PRICE_QUANTITY} fill="#10b981" />
        </ScatterChart>
      </ResponsiveContainer>
      <p className="typography-metadata mt-2">
        {DUMMY_PRICE_QUANTITY.length} productos diferentes • Cada punto representa un producto comprado
      </p>
    </Card>
  )
}
