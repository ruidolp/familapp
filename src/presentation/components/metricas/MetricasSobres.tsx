'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, TrendingUp, Wallet, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MonthYearSelector } from './MonthYearSelector'
import { BarChart } from './BarChart'
import { LockedMetricCard } from './LockedMetricCard'
import { cn } from '@/infrastructure/lib/utils'
import {
  getCurrentBudgetCycle,
  getPreviousCycle,
  getNextCycle,
  type BudgetCycle,
} from '@/infrastructure/utils/budget-cycle'

interface MetricasSobresProps {
  userId: string
  onBack: () => void
}

export function MetricasSobres({ userId, onBack }: MetricasSobresProps) {
  const [diaInicioPeriodo, setDiaInicioPeriodo] = useState<number>(1)
  const [currentCycle, setCurrentCycle] = useState<BudgetCycle | null>(null)
  const [loading, setLoading] = useState(false)
  const [distribucionGastos, setDistribucionGastos] = useState<any[]>([])
  const [topMarcas, setTopMarcas] = useState<any[]>([])
  const [balanceActual, setBalanceActual] = useState<any>(null)
  const [hasData, setHasData] = useState(true)
  const [sobres, setSobres] = useState<Array<{ id: string; nombre: string; emoji?: string | null }>>([])
  const [selectedSobreId, setSelectedSobreId] = useState<string>('all')

  // Cargar configuración del usuario
  useEffect(() => {
    const fetchUserConfig = async () => {
      try {
        const response = await fetch('/api/user/config')
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.config) {
            const dia = data.config.dia_inicio_periodo || 1
            setDiaInicioPeriodo(dia)
            setCurrentCycle(getCurrentBudgetCycle(dia))
          }
        }
      } catch (error) {
        console.error('Error al cargar configuración:', error)
        // Usar valores por defecto
        setCurrentCycle(getCurrentBudgetCycle(1))
      }
    }
    fetchUserConfig()
  }, [])

  useEffect(() => {
    const fetchSobres = async () => {
      try {
        const response = await fetch('/api/sobres')
        if (response.ok) {
          const data = await response.json()
          setSobres(data.sobres || [])
        }
      } catch (error) {
        console.error('Error al cargar sobres:', error)
      }
    }

    fetchSobres()
  }, [])

  useEffect(() => {
    if (currentCycle) {
      fetchMetrics()
    }
  }, [currentCycle, selectedSobreId])

  useEffect(() => {
    if (selectedSobreId !== 'all' && sobres.length > 0) {
      const exists = sobres.some((sobre) => sobre.id === selectedSobreId)
      if (!exists) {
        setSelectedSobreId('all')
      }
    }
  }, [sobres, selectedSobreId])

  const fetchMetrics = async () => {
    if (!currentCycle) return

    setLoading(true)
    try {
      const startDate = currentCycle.startDate.toISOString()
      const endDate = currentCycle.endDate.toISOString()

      const params = new URLSearchParams({ startDate, endDate })
      if (selectedSobreId !== 'all') {
        params.append('sobreId', selectedSobreId)
      }

      // Fetch distribución de gastos por categoría
      const distribucionRes = await fetch(
        `/api/metricas/sobres/distribucion-gastos?${params.toString()}`
      )
      if (distribucionRes.ok) {
        const data = await distribucionRes.json()
        setDistribucionGastos(data.categorias || [])
        setHasData(data.categorias && data.categorias.length > 0)
      }

      // Fetch top marcas
      const marcasRes = await fetch(
        `/api/metricas/sobres/top-marcas?${params.toString()}`
      )
      if (marcasRes.ok) {
        const data = await marcasRes.json()
        setTopMarcas(data.marcas || [])
      }

      // Fetch balance actual (solo para ciclo actual)
      const now = new Date()
      if (now >= currentCycle.startDate && now <= currentCycle.endDate) {
        const balanceQuery = selectedSobreId !== 'all' ? `?sobreId=${selectedSobreId}` : ''
        const balanceRes = await fetch(`/api/metricas/sobres/balance-actual${balanceQuery}`)
        if (balanceRes.ok) {
          const data = await balanceRes.json()
          setBalanceActual(data.balance)
        }
      } else {
        setBalanceActual(null)
      }
    } catch (error) {
      console.error('Error fetching metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrevCycle = () => {
    if (!currentCycle) return
    setCurrentCycle(getPreviousCycle(currentCycle, diaInicioPeriodo))
  }

  const handleNextCycle = () => {
    if (!currentCycle) return
    setCurrentCycle(getNextCycle(currentCycle, diaInicioPeriodo))
  }

  if (!currentCycle) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <p className="typography-body text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  const isCurrentCycle = () => {
    const now = new Date()
    return now >= currentCycle.startDate && now <= currentCycle.endDate
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b sticky top-0 bg-background z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          aria-label="Volver"
        >
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <h1 className="typography-h3 text-foreground">Sobres</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        {/* Month Selector */}
        <MonthYearSelector
          currentCycle={currentCycle}
          onPrev={handlePrevCycle}
          onNext={handleNextCycle}
        />

        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Selecciona el sobre</p>
            <Select value={selectedSobreId} onValueChange={setSelectedSobreId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos los sobres" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los sobres</SelectItem>
                {sobres.map((sobre) => (
                  <SelectItem key={sobre.id} value={sobre.id}>
                    <span className="flex items-center gap-2">
                      <span>{sobre.emoji || '📁'}</span>
                      <span className="truncate">{sobre.nombre}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {!hasData && !loading ? (
          <Card className="p-8 text-center">
            <p className="typography-body text-muted-foreground">
              No hay datos disponibles para este mes
            </p>
          </Card>
        ) : (
          <>
            {/* Balance Actual (solo ciclo actual) */}
            {isCurrentCycle() && balanceActual && (
              <Card className="p-6 bg-primary/5 border-primary/20">
                <div className="flex items-center gap-3 mb-2">
                  <Wallet size={24} className="text-primary" />
                  <h3 className="typography-h4 text-foreground">Balance Actual</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="typography-body-sm text-muted-foreground">Total Disponible</span>
                    <span className="typography-h3 text-success">
                      ${balanceActual.total_disponible?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="typography-body-sm text-muted-foreground">Total Gastado</span>
                    <span className="typography-body text-destructive">
                      ${balanceActual.total_gastado?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {/* Active Metrics */}
            <div className="space-y-6">
              {/* Distribución de Gastos por Categoría */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={20} className="text-primary" />
                  <h3 className="typography-h4 text-foreground">Distribución de Gastos por Categoría</h3>
                </div>
                {loading ? (
                  <p className="typography-body-sm text-muted-foreground">Cargando...</p>
                ) : distribucionGastos.length > 0 ? (
                  <BarChart
                    data={distribucionGastos}
                    labelKey="categoria"
                    valueKey="total"
                    formatValue={(value) => `$${value.toLocaleString()}`}
                    colorClass="bg-primary"
                  />
                ) : (
                  <p className="typography-body-sm text-muted-foreground">No hay datos</p>
                )}
              </Card>

              {/* Top Marcas con Gastos */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={20} className="text-primary" />
                  <h3 className="typography-h4 text-foreground">Top Marcas con Gastos</h3>
                </div>
                {loading ? (
                  <p className="typography-body-sm text-muted-foreground">Cargando...</p>
                ) : topMarcas.length > 0 ? (
                  <BarChart
                    data={topMarcas}
                    labelKey="marca"
                    valueKey="total"
                    formatValue={(value) => `$${value.toLocaleString()}`}
                    colorClass="bg-warning"
                  />
                ) : (
                  <p className="typography-body-sm text-muted-foreground">No hay datos</p>
                )}
              </Card>
            </div>

            {/* Predictive Metrics (Locked) */}
            <div className="space-y-4">
              <h3 className="typography-h4 text-foreground">Métricas Predictivas</h3>

              <LockedMetricCard
                title="Predicción de Gastos por Categoría"
                message="Acumula más meses de datos para que podamos predecir tus gastos futuros por categoría basándonos en tus patrones"
                icon={<Lock size={32} className="text-muted-foreground" />}
              />

              <LockedMetricCard
                title="Alertas de Sobregasto"
                message="Con más historial, te avisaremos cuando estés cerca de exceder el presupuesto de tus sobres para que puedas ajustar tus gastos"
                icon={<Lock size={32} className="text-muted-foreground" />}
              />

              <LockedMetricCard
                title="Análisis de Tendencias de Marcas"
                message="Sigue registrando tus compras para ver qué marcas están aumentando en tus gastos y recibir sugerencias de optimización"
                icon={<Lock size={32} className="text-muted-foreground" />}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
