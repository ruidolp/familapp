/**
 * Register Page
 */

import { redirect } from 'next/navigation'
import { getSession } from '@/infrastructure/lib/auth'
import { RegisterForm } from '@/presentation/components/auth/register-form'

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const session = await getSession()

  // Si ya está autenticado, redirigir al dashboard
  if (session?.user) {
    redirect(`/${locale}/dashboard`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-secondary/30">
      <RegisterForm />
    </div>
  )
}
