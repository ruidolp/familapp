import { randomUUID } from 'crypto'
import type {
  EndpointStats,
  MonitoringSession,
} from '@/types/monitoring'

const MAX_EVENTS_PER_SESSION = 2000

class RequestMonitorStore {
  private sessions: MonitoringSession[] = []
  private activeSessionId?: string

  startSession(name?: string): MonitoringSession {
    if (this.activeSessionId) {
      throw new Error('Ya existe una sesión de monitoreo activa')
    }

    const session: MonitoringSession = {
      id: randomUUID(),
      name: name?.trim() || 'Sesión sin nombre',
      startedAt: new Date().toISOString(),
      totalRequests: 0,
      endpoints: {},
      events: [],
    }

    this.sessions = [session, ...this.sessions]
    this.activeSessionId = session.id
    return session
  }

  stopSession(): MonitoringSession | null {
    if (!this.activeSessionId) {
      return null
    }

    const session = this.sessions.find(
      (item) => item.id === this.activeSessionId
    )
    if (!session) {
      this.activeSessionId = undefined
      return null
    }

    session.finishedAt = new Date().toISOString()
    this.activeSessionId = undefined
    return session
  }

  recordRequest(endpoint: string, method: string, timestamp: number): void {
    if (this.shouldIgnoreEndpoint(endpoint)) {
      return
    }

    const session = this.getActiveSession()
    if (!session) {
      return
    }

    session.totalRequests += 1

    const normalizedEndpoint = endpoint || 'desconocido'
    const normalizedMethod = method?.toUpperCase() || 'GET'
    const stats =
      session.endpoints[normalizedEndpoint] ||
      ({
        total: 0,
        methods: {},
        lastInvokedAt: timestamp,
      } satisfies EndpointStats)

    stats.total += 1
    stats.lastInvokedAt = timestamp
    stats.methods[normalizedMethod] = (stats.methods[normalizedMethod] || 0) + 1
    session.endpoints[normalizedEndpoint] = stats

    session.events.push({
      id: randomUUID(),
      endpoint: normalizedEndpoint,
      method: normalizedMethod,
      timestamp,
    })

    if (session.events.length > MAX_EVENTS_PER_SESSION) {
      session.events.splice(0, session.events.length - MAX_EVENTS_PER_SESSION)
    }
  }

  private shouldIgnoreEndpoint(endpoint: string) {
    return endpoint.startsWith('/api/monitoring')
  }

  getSessions(): MonitoringSession[] {
    return this.sessions
  }

  getActiveSession(): MonitoringSession | null {
    if (!this.activeSessionId) {
      return null
    }

    return (
      this.sessions.find((session) => session.id === this.activeSessionId) ||
      null
    )
  }
}

type GlobalWithMonitor = typeof globalThis & {
  __FAMILAPP_REQUEST_MONITOR__?: RequestMonitorStore
}

const getGlobalStore = (): RequestMonitorStore => {
  const globalWithMonitor = globalThis as GlobalWithMonitor
  if (!globalWithMonitor.__FAMILAPP_REQUEST_MONITOR__) {
    globalWithMonitor.__FAMILAPP_REQUEST_MONITOR__ = new RequestMonitorStore()
  }

  return globalWithMonitor.__FAMILAPP_REQUEST_MONITOR__
}

export const requestMonitor = {
  startSession: (name?: string) => getGlobalStore().startSession(name),
  stopSession: () => getGlobalStore().stopSession(),
  recordRequest: (endpoint: string, method: string, timestamp: number) =>
    getGlobalStore().recordRequest(endpoint, method, timestamp),
  getSessions: () => getGlobalStore().getSessions(),
  getActiveSession: () => getGlobalStore().getActiveSession(),
}
