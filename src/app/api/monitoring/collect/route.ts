import { NextRequest, NextResponse } from 'next/server'
import { requestMonitor } from '@/lib/request-monitor'

const COLLECTOR_HEADER = 'x-monitoring-collector'

export async function POST(request: NextRequest) {
  if (request.headers.get(COLLECTOR_HEADER) !== '1') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = await request.json()
    const endpoint =
      typeof payload?.endpoint === 'string' ? payload.endpoint : 'desconocido'
    const method =
      typeof payload?.method === 'string' ? payload.method : request.method
    const timestamp =
      typeof payload?.timestamp === 'number' ? payload.timestamp : Date.now()

    requestMonitor.recordRequest(endpoint, method, timestamp)
    return NextResponse.json({ recorded: true })
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}
