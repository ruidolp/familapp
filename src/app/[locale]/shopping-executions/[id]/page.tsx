import { auth } from '@/infrastructure/lib/auth'
import { redirect } from 'next/navigation'
import { ExecutionScreen } from '@/presentation/components/screens/ExecutionScreen'
import { getShoppingListById } from '@/infrastructure/database/queries/shopping-lists.queries'

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

  const { id: listId } = await params

  // Get list info
  const list = await getShoppingListById(listId)

  if (!list) {
    redirect('/shopping-lists')
  }

  // Verify ownership
  if (list.user_id !== session.user.id) {
    // TODO: Check collaborator permissions
    redirect('/shopping-lists')
  }

  return (
    <ExecutionScreen
      listId={listId}
      listName={list.nombre}
      userId={session.user.id}
    />
  )
}
