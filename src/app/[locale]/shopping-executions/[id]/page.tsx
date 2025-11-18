import { auth } from '@/infrastructure/lib/auth'
import { redirect } from 'next/navigation'
import { ExecutionScreen } from '@/presentation/components/screens/ExecutionScreen'

interface ExecutionPageProps {
  params: Promise<{
    locale: string
    id: string
  }>
}

export default async function ExecutionPage({ params }: ExecutionPageProps) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  const { id: executionId } = await params

  // ExecutionScreen will load the execution from IndexedDB
  // and get the shopping_list_id from there
  return (
    <ExecutionScreen
      executionId={executionId}
      userId={session.user.id}
    />
  )
}
