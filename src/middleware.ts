import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)
const COLLECTOR_HEADER = 'x-monitoring-collector'
const MONITORING_PREFIXES = ['/api/monitoring']

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isApiRoute = pathname.startsWith('/api')
  const isCollectorRequest = request.headers.get(COLLECTOR_HEADER) === '1'
  const isMonitoringRoute = MONITORING_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  )

  if (isApiRoute && !isCollectorRequest && !isMonitoringRoute) {
    sendMonitoringEvent(request)
  }

  if (isApiRoute) {
    return NextResponse.next()
  }

  return intlMiddleware(request)
}

function sendMonitoringEvent(request: NextRequest) {
  const collectorUrl = new URL('/api/monitoring/collect', request.nextUrl.origin)
  const payload = {
    endpoint: request.nextUrl.pathname,
    method: request.method,
    timestamp: Date.now(),
  }

  const reportPromise = fetch(collectorUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      [COLLECTOR_HEADER]: '1',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  })

  reportPromise.catch(() => {
    // Evitar que un error de logging rompa la request original
  })
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)', '/api/:path*'],
}
