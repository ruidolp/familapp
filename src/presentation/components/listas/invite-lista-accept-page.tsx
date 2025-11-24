'use client'

/**
 * Invite Lista Accept Page Component
 *
 * Componente para aceptar invitaciones a listas compartidas
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/presentation/hooks/use-toast'
import { CheckCircle2, Loader2, Clock, AlertCircle, ShoppingCart, XCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface InvitacionData {
  id: string
  lista_id: string
  rol: string
  estado: string
  expires_at: string
  lista_nombre: string
  lista_descripcion?: string
  inviter_name?: string
  inviter_email?: string
  inviter_image?: string
}

interface InviteListaAcceptPageProps {
  code: string
  userId: string
}

export function InviteListaAcceptPage({ code, userId }: InviteListaAcceptPageProps) {
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
      const res = await fetch(`/api/shopping-lists/invitations/code/${code}`)

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
      const res = await fetch(`/api/shopping-lists/invitations/${invitacion.id}/accept`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al aceptar invitación')
      }

      const data = await res.json()

      toast({
        title: '¡Te uniste a la lista!',
        description: data.message || `Ahora eres parte de "${invitacion.lista_nombre}"`,
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
      const res = await fetch(`/api/shopping-lists/invitations/${invitacion.id}/reject`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al rechazar invitación')
      }

      const data = await res.json()

      toast({
        title: 'Invitación rechazada',
        description: data.message || `Rechazaste la invitación a "${invitacion.lista_nombre}"`,
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

  const roleName = invitacion.rol === 'EDITOR' ? 'Editor' : 'Solo comprar'
  const isEditor = invitacion.rol === 'EDITOR'

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Invitación a lista compartida</h1>
        <p className="text-muted-foreground">
          Has sido invitado a colaborar en una lista de compras
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
              {roleName}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Lista Info */}
          <div className="flex items-center gap-4 rounded-lg border border-border bg-card/80 p-6 shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShoppingCart className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-foreground">{invitacion.lista_nombre}</h3>
              {invitacion.lista_descripcion && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {invitacion.lista_descripcion}
                </p>
              )}
              <p className="mt-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{invitacion.inviter_name || 'Alguien'}</span> te está invitando a colaborar en esta lista.
              </p>
            </div>
          </div>

          {/* Permissions Info */}
          <div className="space-y-3 rounded-lg border border-border bg-muted/50 p-4">
            <p className="font-medium">Como {roleName.toLowerCase()} podrás:</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span>Ver todos los productos de la lista</span>
              </li>
              {isEditor ? (
                <>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span>Agregar, editar y eliminar productos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span>Ejecutar compras y marcar productos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span>Revisar el historial de compras</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-blue-500 flex-shrink-0" />
                    <span>Ejecutar compras y marcar productos comprados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-blue-500 flex-shrink-0" />
                    <span>Recibir actualizaciones en tiempo real</span>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Expiration Info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              Esta invitación expira{' '}
              {formatDistanceToNow(new Date(invitacion.expires_at), {
                addSuffix: true,
                locale: es,
              })}
            </span>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-6 sm:flex-row">
          <Button
            onClick={handleAccept}
            disabled={processing}
            className="w-full"
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
            size="lg"
          >
            {processing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 mr-2" />
                Rechazar
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
