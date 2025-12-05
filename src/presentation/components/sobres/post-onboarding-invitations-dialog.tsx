'use client'

/**
 * Post-Onboarding Invitations Dialog
 *
 * Dialog que se muestra después del onboarding si el usuario tiene invitaciones pendientes
 */

import { useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/presentation/components/ui/dialog'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/presentation/components/ui/avatar'
import { Badge } from '@/presentation/components/ui/badge'
import { useToast } from '@/presentation/hooks/use-toast'
import { Loader2, CheckCircle2, XCircle, PartyPopper } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Invitacion {
  id: string
  tipo: 'sobre' | 'lista' | 'notificacion'
  nombre: string
  emoji?: string
  descripcion?: string | null
  inviter_name?: string
  inviter_image?: string
  rol?: string
  notificacion_tipo?: string
  notificacion_titulo?: string
  notificacion_mensaje?: string
}

interface PostOnboardingInvitationsDialogProps {
  invitaciones: Invitacion[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PostOnboardingInvitationsDialog({
  invitaciones,
  open,
  onOpenChange,
}: PostOnboardingInvitationsDialogProps) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set())
  const { toast } = useToast()
  const router = useRouter()

  const remainingInvitations = invitaciones.filter(
    (inv) => !processedIds.has(inv.id)
  )

  const handleAccept = async (invitacion: Invitacion) => {
    setProcessingId(invitacion.id)
    try {
      const endpoint =
        invitacion.tipo === 'sobre'
          ? `/api/sobres/invitations/${invitacion.id}/accept`
          : `/api/shopping-lists/invitations/${invitacion.id}/accept`
      const res = await fetch(endpoint, { method: 'POST' })

      if (!res.ok) throw new Error('Error al aceptar invitación')

      const data = await res.json()

      toast({
        title: invitacion.tipo === 'sobre' ? '¡Te uniste al sobre!' : '¡Te uniste a la lista!',
        description:
          data.message ||
          (invitacion.tipo === 'sobre'
            ? `Ahora eres parte de "${invitacion.nombre}"`
            : `Ya puedes colaborar en "${invitacion.nombre}"`),
      })

      // Marcar como procesada
      setProcessedIds((prev) => new Set(prev).add(invitacion.id))

      // Si no quedan más invitaciones, cerrar y refrescar
      if (remainingInvitations.length === 1) {
        setTimeout(() => {
          onOpenChange(false)
          router.refresh()
        }, 1500)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo aceptar la invitación',
        variant: 'destructive',
      })
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (invitacion: Invitacion) => {
    setProcessingId(invitacion.id)
    try {
      const endpoint =
        invitacion.tipo === 'sobre'
          ? `/api/sobres/invitations/${invitacion.id}/reject`
          : `/api/shopping-lists/invitations/${invitacion.id}/reject`
      const res = await fetch(endpoint, { method: 'POST' })

      if (!res.ok) throw new Error('Error al rechazar invitación')

      const data = await res.json()

      toast({
        title: 'Invitación rechazada',
        description:
          data.message ||
          (invitacion.tipo === 'sobre'
            ? `Rechazaste la invitación a "${invitacion.nombre}"`
            : `Rechazaste la invitación a la lista "${invitacion.nombre}"`),
      })

      // Marcar como procesada
      setProcessedIds((prev) => new Set(prev).add(invitacion.id))

      // Si no quedan más invitaciones, cerrar y refrescar
      if (remainingInvitations.length === 1) {
        setTimeout(() => {
          onOpenChange(false)
          router.refresh()
        }, 1500)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo rechazar la invitación',
        variant: 'destructive',
      })
    } finally {
      setProcessingId(null)
    }
  }

  const handleDismissNotification = async (notificacionId: string) => {
    setProcessingId(notificacionId)
    try {
      const res = await fetch(`/api/notifications/${notificacionId}`, {
        method: 'PATCH',
      })

      if (!res.ok) throw new Error('Error al marcar notificación')

      toast({
        title: 'Notificación leída',
        description: 'La notificación ha sido marcada como leída',
      })

      // Marcar como procesada
      setProcessedIds((prev) => new Set(prev).add(notificacionId))

      // Si no quedan más invitaciones/notificaciones, cerrar y refrescar
      if (remainingInvitations.length === 1) {
        setTimeout(() => {
          onOpenChange(false)
          router.refresh()
        }, 1500)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo marcar la notificación',
        variant: 'destructive',
      })
    } finally {
      setProcessingId(null)
    }
  }

  const invitationTypeLabel = useMemo(() => {
    const hasSobre = remainingInvitations.some((inv) => inv.tipo === 'sobre')
    const hasLista = remainingInvitations.some((inv) => inv.tipo === 'lista')

    if (hasSobre && hasLista) return 'sobres y listas'
    if (hasSobre) return 'un sobre'
    if (hasLista) return 'una lista de compras'
    return 'nuevos elementos'
  }, [remainingInvitations])

  if (remainingInvitations.length === 0 && processedIds.size > 0) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto border-none bg-transparent p-0 shadow-none">
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-background/95 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background/80 to-background" />
          <div className="relative flex flex-col gap-4 p-6">
            <DialogHeader className="p-0">
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <PartyPopper className="h-6 w-6 text-primary" />
                ¡Nueva invitación!
              </DialogTitle>
              <DialogDescription>
                ¡Felicidades! Te han invitado a colaborar en {invitationTypeLabel}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {remainingInvitations.map((inv) => (
                <Card key={inv.id} className="overflow-hidden">
                  {inv.tipo === 'notificacion' ? (
                    // Renderizado para notificaciones
                    <>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                            <span className="text-xl">{inv.emoji || '📢'}</span>
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-base">{inv.notificacion_titulo || 'Notificación'}</CardTitle>
                            <p className="text-sm text-muted-foreground">Sistema</p>
                          </div>
                          <Badge variant="outline" className="bg-orange-50 dark:bg-orange-900/20">
                            Importante
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
                          <p className="text-sm leading-relaxed">{inv.notificacion_mensaje}</p>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button
                          onClick={() => handleDismissNotification(inv.id)}
                          disabled={processingId === inv.id}
                          className="w-full"
                          size="sm"
                        >
                          {processingId === inv.id ? (
                            <>
                              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                              Marcando...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="mr-1 h-4 w-4" />
                              Entendido
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </>
                  ) : (
                    // Renderizado original para invitaciones
                    <>
                      <CardHeader className="pb-3">
                        <div className="space-y-0.5">
                          <CardTitle className="text-base leading-tight">
                            {inv.inviter_name || 'Usuario'}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground leading-tight">
                            Te invito a colaborar en:
                          </p>
                        </div>
                      </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-2xl">
                    {inv.emoji || (inv.tipo === 'sobre' ? '📦' : '🛒')}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-semibold">
                      {inv.tipo === 'sobre' ? 'Sobre' : 'Lista'}: {inv.nombre}
                    </p>
                    {inv.tipo === 'lista' && (
                      <p className="text-xs text-muted-foreground">
                        {inv.descripcion || 'Lista colaborativa'}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Has sido invitado como:{' '}
                      <Badge variant="secondary" className="align-middle">
                        {inv.tipo === 'sobre'
                          ? inv.rol === 'ADMIN'
                            ? 'Administrador'
                            : inv.rol === 'CONTRIBUTOR'
                              ? 'Colaborador'
                              : 'Visualizador'
                          : inv.rol === 'EDITOR'
                            ? 'Editor'
                            : 'Solo ejecutar'}
                      </Badge>
                    </p>
                  </div>
                </div>
                <div className="border-t border-border/60 pt-3">
                  <p className="text-xs font-medium mb-1">Ventajas:</p>
                  {inv.tipo === 'sobre' ? (
                    <ul className="text-xs space-y-0.5 text-foreground">
                      <li className="text-muted-foreground">✓ Presupuesto compartido en tiempo real</li>
                      <li className="text-muted-foreground">✓ Todos ven los gastos</li>
                      <li className="text-muted-foreground">✓ Sincronización automática</li>
                    </ul>
                  ) : (
                    <ul className="text-xs space-y-0.5 text-foreground">
                      <li className="text-muted-foreground">✓ Comparte y actualiza la lista en equipo</li>
                      <li className="text-muted-foreground">✓ Marca compras y deja notas en tiempo real</li>
                      <li className="text-muted-foreground">✓ Evita compras duplicadas</li>
                    </ul>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex gap-2">
                <Button
                  onClick={() => handleAccept(inv)}
                  disabled={processingId === inv.id}
                  className="flex-1"
                  size="sm"
                >
                  {processingId === inv.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Aceptando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Aceptar
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleReject(inv)}
                  disabled={processingId === inv.id}
                  className="flex-1"
                  size="sm"
                >
                  {processingId === inv.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Rechazando...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-1" />
                      Rechazar
                    </>
                  )}
                </Button>
              </CardFooter>
                    </>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
