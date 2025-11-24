/**
 * Login Page
 */

import { redirect } from 'next/navigation'
import { getSession } from '@/infrastructure/lib/auth'
import { LoginForm } from '@/presentation/components/auth/login-form'

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ inviteLista?: string; invite?: string }>
}) {
  const { locale } = await params
  const search = await searchParams
  const session = await getSession()

  // Si ya está autenticado, redirigir según el contexto
  if (session?.user) {
    // Si viene de una invitación de lista, redirigir al link de aceptación
    if (search.inviteLista) {
      redirect(`/${locale}/invite/lista/${search.inviteLista}`)
    }
    // Si viene de una invitación de sobre, redirigir al link de aceptación
    if (search.invite) {
      redirect(`/${locale}/invite/${search.invite}`)
    }
    // Si no, ir al dashboard
    redirect(`/${locale}/dashboard`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-secondary/30">
      <LoginForm
        inviteListaCode={search.inviteLista}
        inviteSobreCode={search.invite}
      />
    </div>
  )
}
