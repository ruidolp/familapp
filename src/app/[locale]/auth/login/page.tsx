/**
 * Login Page
 */

import { redirect } from 'next/navigation'
import { getSession } from '@/infrastructure/lib/auth'
import { LoginForm } from '@/presentation/components/auth/login-form'

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const session = await getSession()

  // Si ya está autenticado, redirigir al dashboard
  if (session?.user) {
    redirect(`/${locale}/dashboard`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-secondary/30">
      <LoginForm />
    </div>
  )
}
