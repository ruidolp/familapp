/**
 * GRÁFICO 10: Treemap - Distribución Jerárquica
 *
 * ⚠️ DEMO - Borrar cuando se implemente sistema real
 */

'use client'

import { Treemap, ResponsiveContainer, Tooltip } from 'recharts'
import { Card } from '@/components/ui/card'
import { DUMMY_TREEMAP_DATA } from '../data/dummy-data'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']

export function TreemapChart() {
  return (
    <Card className="p-6">
      <h3 className="typography-h3 mb-4">🗺️ Mapa de Gastos por Tienda y Categoría</h3>
      <ResponsiveContainer width="100%" height={350}>
        <Treemap
          data={DUMMY_TREEMAP_DATA}
          dataKey="size"
          aspectRatio={4 / 3}
          stroke="#fff"
          fill="#8884d8"
          content={({ root, depth, x, y, width, height, index, name, value }: any) => {
            return (
              <g>
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  style={{
                    fill: depth < 2 ? COLORS[index % COLORS.length] : COLORS[(index + 3) % COLORS.length],
                    stroke: '#fff',
                    strokeWidth: 2,
                    opacity: depth === 1 ? 0.9 : 0.7,
                  }}
                />
                {width > 60 && height > 30 && (
                  <>
                    <text
                      x={x + width / 2}
                      y={y + height / 2 - 7}
                      textAnchor="middle"
                      fill="#fff"
                      fontSize={depth === 1 ? 14 : 11}
                      fontWeight={depth === 1 ? 'bold' : 'normal'}
                    >
                      {name}
                    </text>
                    <text
                      x={x + width / 2}
                      y={y + height / 2 + 9}
                      textAnchor="middle"
                      fill="#fff"
                      fontSize={10}
                    >
                      ${(value || 0).toLocaleString()}
                    </text>
                  </>
                )}
              </g>
            )
          }}
        >
          <Tooltip
            formatter={(value: number) => `$${value.toLocaleString()}`}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }}
          />
        </Treemap>
      </ResponsiveContainer>
      <p className="typography-metadata mt-2">
        Distribución jerárquica: Tienda → Categoría de Producto
      </p>
    </Card>
  )
}
