'use client'

/**
 * Post-Onboarding Invitations Dialog
 *
 * Dialog que se muestra después del onboarding si el usuario tiene invitaciones pendientes
 */

import { useState } from 'react'
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
import { useLocale } from 'next-intl'

interface Invitacion {
  id: string
  sobre_nombre: string
  sobre_emoji?: string
  inviter_name?: string
  inviter_image?: string
  rol: string
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
  const locale = useLocale()

  const remainingInvitations = invitaciones.filter(
    (inv) => !processedIds.has(inv.id)
  )

  const handleAccept = async (invitacion: Invitacion) => {
    setProcessingId(invitacion.id)
    try {
      const res = await fetch(`/api/sobres/invitations/${invitacion.id}/accept`, {
        method: 'POST',
      })

      if (!res.ok) throw new Error('Error al aceptar invitación')

      const data = await res.json()

      toast({
        title: '¡Te uniste al sobre!',
        description: `Ahora eres parte de "${invitacion.sobre_nombre}"`,
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
      const res = await fetch(`/api/sobres/invitations/${invitacion.id}/reject`, {
        method: 'POST',
      })

      if (!res.ok) throw new Error('Error al rechazar invitación')

      const data = await res.json()

      toast({
        title: 'Invitación rechazada',
        description: data.message,
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

  const handleSkip = () => {
    onOpenChange(false)
    router.push(`/${locale}/invitations`)
  }

  if (remainingInvitations.length === 0 && processedIds.size > 0) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <PartyPopper className="h-6 w-6 text-primary" />
            ¡Tienes invitaciones pendientes!
          </DialogTitle>
          <DialogDescription>
            Te invitaron a colaborar en sobres compartidos. ¿Quieres aceptar?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {remainingInvitations.map((inv) => (
            <Card key={inv.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={inv.inviter_image} />
                      <AvatarFallback>
                        {inv.inviter_name?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">
                        {inv.inviter_name || 'Usuario'}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Te invitó a colaborar
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {inv.rol === 'ADMIN' ? 'Administrador' : inv.rol === 'CONTRIBUTOR' ? 'Colaborador' : 'Visualizador'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <span className="text-3xl">{inv.sobre_emoji || '📦'}</span>
                  <div>
                    <p className="font-medium">Sobre: {inv.sobre_nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      Presupuesto compartido
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                  <p className="text-xs font-medium mb-1">Ventajas:</p>
                  <ul className="text-xs space-y-0.5 text-muted-foreground">
                    <li>✓ Presupuesto compartido en tiempo real</li>
                    <li>✓ Todos ven los gastos</li>
                    <li>✓ Sincronización automática</li>
                  </ul>
                </div>

                {inv.sobre_nombre.toUpperCase() === 'HOGAR' && (
                  <p className="text-xs text-muted-foreground italic">
                    💡 Si rechazas, crearemos tu propio sobre "HOGAR" con categorías básicas
                  </p>
                )}
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
            </Card>
          ))}
        </div>

        <div className="flex flex-col items-center gap-2">
          <Button variant="ghost" onClick={handleSkip} size="sm">
            Ver luego
          </Button>
          <p className="text-xs text-muted-foreground">
            Podrás gestionar tus invitaciones en Configuración → Invitaciones
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
