import { redirect } from 'next/navigation'
import { getSession } from '@/infrastructure/lib/auth'
import { MailTestForm } from '@/presentation/components/config/MailTestForm'

export default async function MailTestPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await getSession()

  if (!session?.user) {
    redirect(`/${locale}/auth/login`)
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="typography-h2 text-foreground">Test de Email</h1>
        <p className="typography-body-sm text-muted-foreground">
          Envía un correo de prueba usando MailerSend para validar las credenciales configuradas.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <MailTestForm targetEmail={session.user.email || ''} />
      </div>
    </div>
  )
}
