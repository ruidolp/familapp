import { NextRequest, NextResponse } from 'next/server'
import { requestMonitor } from '@/lib/request-monitor'

export async function GET() {
  return NextResponse.json({
    activeSession: requestMonitor.getActiveSession(),
    sessions: requestMonitor.getSessions(),
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as { name?: string }
    const session = requestMonitor.startSession(body.name)
    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 409 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { action?: string }
  if (body.action !== 'stop') {
    return NextResponse.json(
      { error: 'Acción no soportada' },
      { status: 400 }
    )
  }

  const stoppedSession = requestMonitor.stopSession()
  if (!stoppedSession) {
    return NextResponse.json(
      { error: 'No hay una sesión activa' },
      { status: 400 }
    )
  }

  return NextResponse.json(stoppedSession)
}
