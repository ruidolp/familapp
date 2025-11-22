/**
 * GRÁFICO 11: Burn Rate BLOQUEADO - Gauge Circular
 *
 * ⚠️ DEMO - Borrar cuando se implemente sistema real
 */

'use client'

import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import { Card } from '@/components/ui/card'
import { LockedMetric } from '../LockedMetric'
import { DUMMY_BURN_RATE } from '../data/dummy-data'

export function LockedBurnRate() {
  const data = [{ name: 'Usado', value: DUMMY_BURN_RATE.porcentaje_usado, fill: '#ef4444' }]

  const chart = (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">🔥 Burn Rate - Días Restantes</h3>
      <ResponsiveContainer width="100%" height={250}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="60%"
          outerRadius="90%"
          barSize={20}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar
            background
            dataKey="value"
            cornerRadius={10}
          />
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-foreground"
          >
            <tspan x="50%" dy="-0.5em" fontSize="32" fontWeight="bold">
              {DUMMY_BURN_RATE.dias_restantes}
            </tspan>
            <tspan x="50%" dy="1.5em" fontSize="14" className="fill-muted-foreground">
              días restantes
            </tspan>
          </text>
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="text-center mt-4">
        <p className="text-sm text-muted-foreground">
          Gasto diario: ${DUMMY_BURN_RATE.gasto_diario.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {DUMMY_BURN_RATE.porcentaje_usado}% del presupuesto usado
        </p>
      </div>
    </Card>
  )

  return (
    <LockedMetric
      isLocked={true}
      progress={{ current: 2, required: 5, label: 'transacciones' }}
      message="🔓 Necesitas 3 transacciones más para ver cuántos días te queda de presupuesto"
    >
      {chart}
    </LockedMetric>
  )
}
