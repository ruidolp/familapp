import { NextRequest, NextResponse } from 'next/server'

/**
 * Force logout endpoint
 *
 * Borra la sesión de NextAuth sin depender de la BD.
 * Útil cuando la BD fue migrada y las sesiones antiguas no existen.
 */
export async function GET(req: NextRequest) {
  const response = NextResponse.redirect(new URL('/auth/login', req.url), {
    status: 302,
  })

  // Borrar cookie de NextAuth (session)
  response.cookies.set({
    name: 'authjs.session-token',
    value: '',
    maxAge: 0,
    path: '/',
  })

  // Borrar cookie de CSRF de NextAuth
  response.cookies.set({
    name: 'authjs.csrf-token',
    value: '',
    maxAge: 0,
    path: '/',
  })

  // Borrar callback URL si existe
  response.cookies.set({
    name: 'authjs.callback-url',
    value: '',
    maxAge: 0,
    path: '/',
  })

  return response
}

export async function POST(req: NextRequest) {
  return GET(req)
}
