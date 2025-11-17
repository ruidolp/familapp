import { auth } from '@/infrastructure/lib/auth'
import { redirect } from 'next/navigation'
import { ListEditorScreen } from '@/presentation/components/screens/ListEditorScreen'

interface ShoppingListPageProps {
  params: Promise<{
    locale: string
    id: string
  }>
}

export default async function ShoppingListPage({ params }: ShoppingListPageProps) {
  // Check authentication
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  const { id } = await params

  return (
    <div className="h-screen w-screen overflow-hidden">
      <ListEditorScreen listId={id} />
    </div>
  )
}
