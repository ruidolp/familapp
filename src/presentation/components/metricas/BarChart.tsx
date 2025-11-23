'use client'

interface BarChartProps {
  data: any[]
  labelKey: string
  valueKey: string
  formatValue?: (value: number) => string
  colorClass?: string
}

export function BarChart({
  data,
  labelKey,
  valueKey,
  formatValue = (value) => value.toString(),
  colorClass = 'bg-primary',
}: BarChartProps) {
  if (!data || data.length === 0) {
    return (
      <p className="typography-body-sm text-muted-foreground text-center py-4">
        No hay datos disponibles
      </p>
    )
  }

  // Find max value for scaling
  const maxValue = Math.max(...data.map((item) => Number(item[valueKey])))

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-end justify-between gap-3 min-h-[280px] pb-2">
        {data.map((item, index) => {
          const value = Number(item[valueKey])
          const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0
          const minHeight = 8 // Altura mínima para valores pequeños

          return (
            <div
              key={index}
              className="flex flex-col items-center gap-2 flex-1 min-w-[60px] max-w-[80px]"
            >
              {/* Valor */}
              <span className="typography-body-sm font-medium text-foreground text-center whitespace-nowrap">
                {formatValue(value)}
              </span>

              {/* Barra vertical */}
              <div className="w-full flex flex-col justify-end" style={{ height: '200px' }}>
                <div
                  className={`w-full ${colorClass} rounded-t-lg transition-all duration-500 ease-out`}
                  style={{
                    height: `${Math.max(percentage, minHeight)}%`,
                  }}
                />
              </div>

              {/* Label */}
              <span className="typography-body-sm text-muted-foreground text-center break-words w-full line-clamp-2">
                {item[labelKey]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
