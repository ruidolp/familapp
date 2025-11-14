/**
 * Home Page (Root)
 *
 * Página principal que redirige según el estado de autenticación
 */

import { redirect } from 'next/navigation'
import { getSession } from '@/infrastructure/lib/auth'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const session = await getSession()

  // Si está autenticado, ir al dashboard
  if (session?.user) {
    redirect(`/${locale}/dashboard`)
  }

  // Si no está autenticado, ir al login
  redirect(`/${locale}/auth/login`)
}
