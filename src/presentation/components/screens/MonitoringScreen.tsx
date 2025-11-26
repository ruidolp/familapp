'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Loader2, Pause, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { MonitoringSession } from '@/types/monitoring'

type MonitoringResponse = {
  activeSession: MonitoringSession | null
  sessions: MonitoringSession[]
}

const POLLING_INTERVAL = 4000
const TIMELINE_BUCKET_MS = 10000

interface MonitoringScreenProps {
  locale: string
}

export function MonitoringScreen({ locale }: MonitoringScreenProps) {
  const [sessions, setSessions] = useState<MonitoringSession[]>([])
  const [activeSession, setActiveSession] = useState<MonitoringSession | null>(
    null
  )
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [sessionName, setSessionName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastActiveSessionId = useRef<string | null>(null)

  const fetchSessions = useCallback(async () => {
    try {
      setIsFetching(true)
      const response = await fetch('/api/monitoring', { cache: 'no-store' })
      if (!response.ok) {
        throw new Error('fetch_failed')
      }

      const data = (await response.json()) as MonitoringResponse
      setSessions(data.sessions ?? [])
      setActiveSession(data.activeSession ?? null)
      setError(null)

      const activeId = data.activeSession?.id ?? null
      if (activeId) {
        if (lastActiveSessionId.current !== activeId) {
          lastActiveSessionId.current = activeId
          setSelectedSessionId(activeId)
        }
      } else {
        lastActiveSessionId.current = null
        if (
          data.sessions.length > 0 &&
          !data.sessions.find((session) => session.id === selectedSessionId)
        ) {
          setSelectedSessionId(data.sessions[0].id)
        }
      }
    } catch {
      setError('No se pudieron obtener las sesiones de monitoreo')
    } finally {
      setIsFetching(false)
    }
  }, [selectedSessionId])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const activeSessionId = activeSession?.id

  useEffect(() => {
    if (!activeSessionId) {
      return
    }

    const interval = setInterval(() => {
      fetchSessions()
    }, POLLING_INTERVAL)

    return () => clearInterval(interval)
  }, [activeSessionId, fetchSessions])

  const selectedSession =
    sessions.find((session) => session.id === selectedSessionId) ||
    activeSession ||
    sessions[0] ||
    null

  const handleStart = async () => {
    if (isSubmitting || activeSession) return
    setIsSubmitting(true)

    const response = await fetch('/api/monitoring', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        name: sessionName || `Sesión ${new Date().toLocaleString(locale)}`,
      }),
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      setError(payload?.error || 'Error al iniciar el monitoreo')
      setIsSubmitting(false)
      return
    }

    setSessionName('')
    setIsSubmitting(false)
    fetchSessions()
  }

  const handleStop = async () => {
    if (isSubmitting || !activeSession) return
    setIsSubmitting(true)

    const response = await fetch('/api/monitoring', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ action: 'stop' }),
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      setError(payload?.error || 'No se pudo detener la sesión')
      setIsSubmitting(false)
      return
    }

    setIsSubmitting(false)
    fetchSessions()
  }

  const timelineData = useMemo(() => {
    if (!selectedSession) return []

    const buckets = new Map<number, number>()
    selectedSession.events.forEach((event) => {
      const bucket =
        Math.floor(event.timestamp / TIMELINE_BUCKET_MS) * TIMELINE_BUCKET_MS
      buckets.set(bucket, (buckets.get(bucket) || 0) + 1)
    })

    return Array.from(buckets.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([bucketTimestamp, total]) => ({
        time: new Date(bucketTimestamp).toLocaleTimeString([], {
          minute: '2-digit',
          second: '2-digit',
        }),
        total,
      }))
  }, [selectedSession])

  const endpointRanking = useMemo(() => {
    if (!selectedSession) return []
    return Object.entries(selectedSession.endpoints)
      .map(([endpoint, stats]) => ({
        endpoint,
        total: stats.total,
        last: stats.lastInvokedAt,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
  }, [selectedSession])

  const summaryCards = useMemo(() => {
    if (!selectedSession) return null

    const duration = formatDuration(
      new Date(selectedSession.finishedAt ?? Date.now()).getTime() -
        new Date(selectedSession.startedAt).getTime()
    )

    return [
      {
        label: 'Total de requests',
        value: selectedSession.totalRequests.toLocaleString(),
      },
      {
        label: 'Duración',
        value: duration,
      },
      {
        label: 'Endpoints únicos',
        value: Object.keys(selectedSession.endpoints).length.toString(),
      },
    ]
  }, [selectedSession])

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Monitoreo de Endpoints
            </h1>
            <p className="text-muted-foreground">
              Inicia una sesión, ejecuta tus pruebas de carga y revisa el impacto
              por endpoint.
            </p>
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            {!activeSession && (
              <Input
                placeholder="Nombre de la sesión (opcional)"
                value={sessionName}
                onChange={(event) => setSessionName(event.target.value)}
                className="md:w-64"
                disabled={isSubmitting}
              />
            )}
            {activeSession ? (
              <Button
                variant="destructive"
                onClick={handleStop}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Pause className="w-4 h-4" />
                )}
                Detener monitoreo
              </Button>
            ) : (
              <Button
                onClick={handleStart}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Iniciar monitoreo
              </Button>
            )}
          </div>
        </header>

        <div className="flex items-center gap-3">
          <Badge variant={activeSession ? 'default' : 'secondary'}>
            {activeSession ? 'Sesión activa' : 'Sin sesión activa'}
          </Badge>
          {isFetching && (
            <span className="text-xs text-muted-foreground">
              Actualizando métricas...
            </span>
          )}
          {error && (
            <span className="text-xs text-destructive">{error}</span>
          )}
        </div>

        {summaryCards && (
          <div className="grid gap-4 md:grid-cols-3">
            {summaryCards.map((card) => (
              <Card key={card.label}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold tracking-tight">
                    {card.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Timeline de requests</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {timelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData}>
                    <defs>
                      <linearGradient
                        id="requestsGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="time" className="text-xs" />
                    <YAxis allowDecimals={false} className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#2563eb"
                      fill="url(#requestsGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aún no hay eventos en esta sesión.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Endpoints más llamados</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {endpointRanking.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={endpointRanking} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" allowDecimals={false} className="text-xs" />
                    <YAxis
                      dataKey="endpoint"
                      type="category"
                      width={140}
                      className="text-xs"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="total" fill="#16a34a" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay datos disponibles para graficar.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sesiones registradas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aún no existen sesiones guardadas.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {sessions.map((session) => {
                  const isSelected = selectedSession?.id === session.id
                  return (
                    <button
                      key={session.id}
                      className={`flex flex-col md:flex-row md:items-center md:justify-between rounded-lg border px-4 py-3 text-left transition hover:border-primary ${
                        isSelected ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => setSelectedSessionId(session.id)}
                    >
                      <div>
                        <p className="font-medium">{session.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Inicio: {new Date(session.startedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span>{session.totalRequests.toLocaleString()} requests</span>
                        <span>
                          {session.finishedAt
                            ? `Fin: ${new Date(
                                session.finishedAt
                              ).toLocaleTimeString()}`
                            : 'En progreso'}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedSession && (
          <Card>
            <CardHeader>
              <CardTitle>Detalle por endpoint</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="tabla">
                <TabsList>
                  <TabsTrigger value="tabla">Tabla</TabsTrigger>
                  <TabsTrigger value="historial">Historial</TabsTrigger>
                </TabsList>
                <TabsContent value="tabla">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground">
                          <th className="py-2 text-left font-medium">Endpoint</th>
                          <th className="py-2 text-left font-medium">Total</th>
                          <th className="py-2 text-left font-medium">
                            Última llamada
                          </th>
                          <th className="py-2 text-left font-medium">Métodos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(selectedSession.endpoints)
                          .sort((a, b) => b[1].total - a[1].total)
                          .map(([endpoint, stats]) => (
                            <tr key={endpoint} className="border-b last:border-0">
                              <td className="py-2 font-medium">{endpoint}</td>
                              <td className="py-2">{stats.total}</td>
                              <td className="py-2 text-sm text-muted-foreground">
                                {new Date(stats.lastInvokedAt).toLocaleTimeString()}
                              </td>
                              <td className="py-2 text-xs">
                                {Object.entries(stats.methods)
                                  .map(([method, total]) => `${method}: ${total}`)
                                  .join(' · ')}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
                <TabsContent value="historial">
                  <p className="text-sm text-muted-foreground">
                    Usa el timeline superior para entender la distribución temporal
                    de requests. Pronto agregaremos más visualizaciones aquí.
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function formatDuration(milliseconds: number): string {
  if (!milliseconds || milliseconds < 0) {
    return '0s'
  }

  const totalSeconds = Math.floor(milliseconds / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}
