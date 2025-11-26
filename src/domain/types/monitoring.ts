export type MonitoringEvent = {
  id: string
  endpoint: string
  method: string
  timestamp: number
}

export type EndpointStats = {
  total: number
  methods: Record<string, number>
  lastInvokedAt: number
}

export type MonitoringSession = {
  id: string
  name: string
  startedAt: string
  finishedAt?: string
  totalRequests: number
  endpoints: Record<string, EndpointStats>
  events: MonitoringEvent[]
}
