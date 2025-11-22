/**
 * GRÁFICO 13: Health Score BLOQUEADO - Score Circular
 *
 * ⚠️ DEMO - Borrar cuando se implemente sistema real
 */

'use client'

import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer, Legend } from 'recharts'
import { Card } from '@/components/ui/card'
import { LockedMetric } from '../LockedMetric'
import { DUMMY_HEALTH_SCORE } from '../data/dummy-data'

export function LockedHealthScore() {
  const data = [
    { name: 'Adherencia', value: DUMMY_HEALTH_SCORE.componentes[0].valor, fill: '#10b981' },
    { name: 'Tendencia', value: DUMMY_HEALTH_SCORE.componentes[1].valor, fill: '#3b82f6' },
    { name: 'Ahorro', value: DUMMY_HEALTH_SCORE.componentes[2].valor, fill: '#f59e0b' },
  ]

  const chart = (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">🏆 Score de Salud Financiera</h3>
      <ResponsiveContainer width="100%" height={280}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="20%"
          outerRadius="90%"
          barSize={15}
          data={data}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar
            background
            dataKey="value"
            cornerRadius={10}
          />
          <Legend
            iconSize={10}
            layout="vertical"
            verticalAlign="bottom"
            align="center"
          />
          <text
            x="50%"
            y="45%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-foreground"
          >
            <tspan x="50%" fontSize="48" fontWeight="bold">
              {DUMMY_HEALTH_SCORE.score}
            </tspan>
          </text>
          <text
            x="50%"
            y="55%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted-foreground"
            fontSize="12"
          >
            Score Global
          </text>
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="mt-2 text-center">
        <p className="text-sm font-semibold text-primary">¡Buen trabajo!</p>
        <p className="text-xs text-muted-foreground">Tu salud financiera está en buen estado</p>
      </div>
    </Card>
  )

  return (
    <LockedMetric
      isLocked={true}
      progress={{ current: 8, required: 21, label: 'días de uso continuo' }}
      message="🔓 Necesitas 13 días más para desbloquear tu Score de Salud Financiera"
    >
      {chart}
    </LockedMetric>
  )
}
