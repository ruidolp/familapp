/**
 * Auth Error Page
 * 
 * Página de error para problemas de autenticación.
 */

import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth' })
  
  return {
    title: t('error.title'),
  }
}

const errorMessages: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: 'Error de Configuración',
    description: 'Hubo un problema con la configuración de autenticación. Por favor, contacta al administrador.',
  },
  AccessDenied: {
    title: 'Acceso Denegado',
    description: 'No tienes permiso para acceder a este recurso.',
  },
  Verification: {
    title: 'Error de Verificación',
    description: 'El token de verificación ha expirado o no es válido.',
  },
  Default: {
    title: 'Error de Autenticación',
    description: 'Ocurrió un error durante el proceso de autenticación. Por favor, intenta nuevamente.',
  },
}

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const errorInfo = errorMessages[error || 'Default'] || errorMessages.Default

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <CardTitle>{errorInfo.title}</CardTitle>
          </div>
          <CardDescription>{errorInfo.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="font-medium">Código de error:</p>
            <p className="text-muted-foreground">{error || 'Unknown'}</p>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/auth/login">Volver al inicio de sesión</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Ir a la página principal</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
