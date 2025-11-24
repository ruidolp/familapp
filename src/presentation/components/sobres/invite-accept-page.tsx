'use client'

/**
 * Invite Accept Page Component
 *
 * Componente para aceptar invitaciones a sobres compartidos
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/presentation/hooks/use-toast'
import { CheckCircle2, XCircle, Loader2, Users, Clock, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface InvitacionData {
  id: string
  sobre_id: string
  rol: string
  estado: string
  expires_at: string
  sobre_nombre: string
  sobre_emoji?: string
  presupuesto_asignado: number
  inviter_name?: string
  inviter_email?: string
  inviter_image?: string
}

interface InviteAcceptPageProps {
  code: string
  userId: string
}

export function InviteAcceptPage({ code, userId }: InviteAcceptPageProps) {
  const [invitacion, setInvitacion] = useState<InvitacionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchInvitacion()
  }, [code])

  const fetchInvitacion = async () => {
    try {
      const res = await fetch(`/api/sobres/invitations/code/${code}`)

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Invitación no encontrada')
      }

      const data = await res.json()
      setInvitacion(data.invitacion)
    } catch (error: any) {
      setError(error.message || 'Error al cargar invitación')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    if (!invitacion) return

    setProcessing(true)
    try {
      const res = await fetch(`/api/sobres/invitations/${invitacion.id}/accept`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al aceptar invitación')
      }

      const data = await res.json()

      toast({
        title: '¡Te uniste al sobre!',
        description: data.message || `Ahora eres parte de "${invitacion.sobre_nombre}"`,
      })

      // Redirigir al dashboard
      router.push('/dashboard')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo aceptar la invitación',
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!invitacion) return

    setProcessing(true)
    try {
      const res = await fetch(`/api/sobres/invitations/${invitacion.id}/reject`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al rechazar invitación')
      }

      const data = await res.json()

      toast({
        title: 'Invitación rechazada',
        description: data.message || `Rechazaste la invitación a "${invitacion.sobre_nombre}"`,
      })

      // Redirigir al dashboard
      router.push('/dashboard')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo rechazar la invitación',
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !invitacion) {
    return (
      <Card className="border-destructive">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-xl font-bold mb-2">Invitación no válida</h2>
          <p className="text-muted-foreground text-center mb-6">
            {error || 'Esta invitación no existe, ha expirado o ya fue utilizada.'}
          </p>
          <Button onClick={() => router.push('/dashboard')}>
            Ir al Dashboard
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Invitación a sobre compartido</h1>
        <p className="text-muted-foreground">
          Has sido invitado a colaborar en un sobre
        </p>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={invitacion.inviter_image} />
                <AvatarFallback>
                  {invitacion.inviter_name?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">
                  {invitacion.inviter_name || 'Usuario'}
                </CardTitle>
                <CardDescription>
                  {invitacion.inviter_email}
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline">
              {invitacion.rol === 'CONTRIBUTOR' ? 'Colaborador' : 'Visualizador'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Sobre Info */}
          <div className="flex items-center gap-4 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border-2 border-blue-200 dark:border-blue-800">
            <span className="text-5xl">{invitacion.sobre_emoji || '📦'}</span>
            <div className="flex-1">
              <h3 className="text-2xl font-bold">{invitacion.sobre_nombre}</h3>
              <p className="text-muted-foreground">
                Te está invitando a colaborar en este sobre
              </p>
            </div>
          </div>

          {/* Permissions Info */}
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <p className="font-medium">Como {invitacion.rol === 'CONTRIBUTOR' ? 'colaborador' : 'visualizador'} podrás:</p>
            {invitacion.rol === 'CONTRIBUTOR' ? (
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Ver el presupuesto y gastos en tiempo real</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Agregar tus propios gastos al sobre</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Ver quién realizó cada gasto</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Recibir notificaciones de cambios</span>
                </li>
              </ul>
            ) : (
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>Ver el presupuesto y gastos en tiempo real</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>Ver quién realizó cada gasto</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span>No podrás agregar gastos (solo lectura)</span>
                </li>
              </ul>
            )}
          </div>

          {/* Time Info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
            <Clock className="h-4 w-4" />
            <span>
              Invitado{' '}
              {formatDistanceToNow(new Date(invitacion.expires_at), {
                addSuffix: true,
                locale: es,
              })}
            </span>
          </div>

          {/* Warning about existing envelope */}
          {(invitacion.sobre_nombre.toUpperCase() === 'HOGAR' ||
            invitacion.sobre_nombre.toUpperCase() === 'PERSONAL') && (
            <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm font-medium mb-1">⚠️ Nota importante:</p>
              <p className="text-sm text-muted-foreground">
                Si ya tienes un sobre "{invitacion.sobre_nombre}", se renombrará automáticamente a
                "{invitacion.sobre_nombre} (old)" para evitar conflictos.
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button
            onClick={handleAccept}
            disabled={processing}
            className="w-full h-12"
            size="lg"
          >
            {processing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Aceptando...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Aceptar invitación
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleReject}
            disabled={processing}
            className="w-full"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Rechazando...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Crear mi propio "{invitacion.sobre_nombre}"
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
