'use client'

/**
 * Invitations Manager Component
 *
 * Gestiona las invitaciones a sobres compartidos
 * - Recibidas: Invitaciones pendientes que puedo aceptar/rechazar
 * - Enviadas: Invitaciones que he enviado, organizadas por sobre
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/presentation/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Clock, Users, CheckCircle2, XCircle, Loader2, ArrowLeft, MoreVertical, Shield, Eye } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface InvitacionRecibida {
  id: string
  sobre_id: string
  sobre_nombre: string
  sobre_emoji?: string
  sobre_color?: string
  rol: string
  created_at: string
  expires_at: string
  inviter_name?: string
  inviter_email?: string
  inviter_image?: string
}

interface InvitacionEnviada {
  id: string
  sobre_id: string
  sobre_nombre: string
  sobre_emoji?: string
  sobre_color?: string
  rol: string
  estado: string
  created_at: string
  expires_at: string
  invitado_email_o_telefono: string
  codigo_invitacion?: string
  invitado_name?: string
  invitado_email?: string
  invitado_image?: string
  invitado_user_id?: string | null
}

export function InvitationsManager() {
  const [invitacionesRecibidas, setInvitacionesRecibidas] = useState<InvitacionRecibida[]>([])
  const [invitacionesEnviadas, setInvitacionesEnviadas] = useState<InvitacionEnviada[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [deleteDrawerOpen, setDeleteDrawerOpen] = useState(false)
  const [selectedInvitation, setSelectedInvitation] = useState<InvitacionEnviada | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'recibidas' | 'enviadas'>('recibidas')
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchInvitaciones()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('tab')
    if (tab === 'enviadas') {
      setActiveTab('enviadas')
    }
  }, [])

  const fetchInvitaciones = async () => {
    try {
      const res = await fetch('/api/sobres/invitations')
      if (!res.ok) throw new Error('Error al cargar invitaciones')

      const data = await res.json()
      setInvitacionesRecibidas(data.recibidas || [])
      setInvitacionesEnviadas(data.enviadas || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las invitaciones',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (invitacionId: string) => {
    setProcessingId(invitacionId)
    try {
      const res = await fetch(`/api/sobres/invitations/${invitacionId}/accept`, {
        method: 'POST',
      })

      if (!res.ok) throw new Error('Error al aceptar invitación')

      const data = await res.json()

      toast({
        title: '¡Te uniste al sobre!',
        description: data.message || `Ahora eres parte de "${data.sobre?.nombre}"`,
      })

      // Refrescar lista
      await fetchInvitaciones()

      // Refrescar página para mostrar nuevo sobre
      router.refresh()
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

  const handleReject = async (invitacionId: string, sobreNombre: string) => {
    setProcessingId(invitacionId)
    try {
      const res = await fetch(`/api/sobres/invitations/${invitacionId}/reject`, {
        method: 'POST',
      })

      if (!res.ok) throw new Error('Error al rechazar invitación')

      const data = await res.json()

      toast({
        title: 'Invitación rechazada',
        description: data.message || `Rechazaste la invitación a "${sobreNombre}"`,
      })

      // Refrescar lista
      await fetchInvitaciones()

      // Si se creó un sobre, refrescar página
      if (data.sobre_creado) {
        router.refresh()
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

  const openDeleteDrawer = (inv: InvitacionEnviada) => {
    setSelectedInvitation(inv)
    setDeleteDrawerOpen(true)
  }

  const closeDeleteDrawer = () => {
    setDeleteDrawerOpen(false)
    setSelectedInvitation(null)
    setDeleteLoading(false)
  }

  const handleTabChange = (value: 'recibidas' | 'enviadas') => {
    setActiveTab(value)
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    if (value === 'recibidas') {
      params.delete('tab')
    } else {
      params.set('tab', value)
    }

    const query = params.toString()
    const newUrl = `${window.location.pathname}${query ? `?${query}` : ''}`
    router.replace(newUrl, { scroll: false })
  }

  const handleDeleteInvitation = async () => {
    if (!selectedInvitation) return

    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/sobres/invitations/${selectedInvitation.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'No se pudo eliminar la invitación')
      }

      const data = await res.json()
      toast({
        title: 'Invitación eliminada',
        description: data.message || 'La invitación fue eliminada correctamente',
      })

      await fetchInvitaciones()
      router.refresh()
      closeDeleteDrawer()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo eliminar la invitación'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
      setDeleteLoading(false)
    }
  }

  const handleUpdateRole = async (invitacionId: string, newRole: string) => {
    setUpdatingRoleId(invitacionId)
    try {
      const res = await fetch(`/api/sobres/invitations/${invitacionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rol: newRole }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'No se pudo actualizar el rol')
      }

      // Refrescar lista sin mostrar notificación
      await fetchInvitaciones()
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo actualizar el rol'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setUpdatingRoleId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Invitaciones</h2>
          <p className="text-muted-foreground">
            Gestiona tus invitaciones a sobres compartidos
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => handleTabChange(value as 'recibidas' | 'enviadas')}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recibidas">
            Recibidas
            {invitacionesRecibidas.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {invitacionesRecibidas.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="enviadas">
            Enviadas
            {invitacionesEnviadas.length > 0 && (
              <Badge className="ml-2">
                {invitacionesEnviadas.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recibidas" className="space-y-4">
          {invitacionesRecibidas.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No tienes invitaciones pendientes
                </p>
              </CardContent>
            </Card>
          ) : (
            invitacionesRecibidas.map((inv) => (
              <Card key={inv.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={inv.inviter_image} />
                        <AvatarFallback>
                          {inv.inviter_name?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">
                          {inv.inviter_name || 'Usuario'}
                        </CardTitle>
                        <CardDescription>
                          {inv.inviter_email}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {inv.rol === 'ADMIN' ? 'Administrador' : inv.rol === 'CONTRIBUTOR' ? 'Colaborador' : 'Visualizador'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <span className="text-3xl">{inv.sobre_emoji || '📦'}</span>
                    <div>
                      <p className="font-medium">Sobre: {inv.sobre_nombre}</p>
                      <p className="text-sm text-muted-foreground">
                        Te invitó a colaborar en este sobre
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      Invitado{' '}
                      {formatDistanceToNow(new Date(inv.created_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-2">
                    <p className="font-medium text-sm">Ventajas de aceptar:</p>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>✓ Presupuesto compartido en tiempo real</li>
                      <li>✓ Todos ven los gastos del sobre</li>
                      <li>✓ Sincronización automática</li>
                    </ul>
                  </div>
                </CardContent>

                <CardFooter className="flex gap-2">
                  <Button
                    onClick={() => handleAccept(inv.id)}
                    disabled={processingId === inv.id}
                    className="flex-1"
                  >
                    {processingId === inv.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Aceptando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Aceptar
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleReject(inv.id, inv.sobre_nombre)}
                    disabled={processingId === inv.id}
                    className="flex-1"
                  >
                    {processingId === inv.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Rechazando...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Crear mi propio {inv.sobre_nombre}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="enviadas" className="space-y-4">
          {invitacionesEnviadas.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No has enviado invitaciones aún
                </p>
              </CardContent>
            </Card>
          ) : (
            invitacionesEnviadas.map((inv) => {
              const estadoBadge = {
                PENDIENTE: { label: 'Pendiente', variant: 'default' as const },
                ACEPTADA: { label: 'Aceptada', variant: 'default' as const, className: 'bg-green-500' },
                RECHAZADA: { label: 'Rechazada', variant: 'destructive' as const },
                CANCELADA: { label: 'Cancelada', variant: 'secondary' as const },
              }[inv.estado] || { label: inv.estado, variant: 'outline' as const }

              const isExpired = new Date(inv.expires_at) < new Date()

              return (
                <Card key={inv.id} className="overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{inv.sobre_emoji || '📦'}</span>
                        <div>
                          <CardTitle className="text-lg">{inv.sobre_nombre}</CardTitle>
                          <CardDescription>
                            Invitado: {inv.invitado_name || inv.invitado_email_o_telefono}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={estadoBadge.variant} className={estadoBadge.className}>
                          {estadoBadge.label}
                        </Badge>
                        {(inv.estado === 'PENDIENTE' || inv.estado === 'ACEPTADA') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openDeleteDrawer(inv)}
                            title="Eliminar invitación"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        Enviado{' '}
                        {formatDistanceToNow(new Date(inv.created_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                    </div>

                    {inv.estado === 'PENDIENTE' && isExpired && (
                      <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          ⚠️ Esta invitación ha expirado
                        </p>
                      </div>
                    )}

                    {inv.estado === 'PENDIENTE' && !isExpired && inv.codigo_invitacion && (
                      <div className="bg-muted p-3 rounded-lg space-y-2">
                        <p className="text-sm font-medium">Link de invitación:</p>
                        <div className="flex gap-2">
                          <Input
                            readOnly
                            value={`${window.location.origin}/${window.location.pathname.split('/')[1]}/invite/${inv.codigo_invitacion}`}
                            className="font-mono text-xs"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `${window.location.origin}/${window.location.pathname.split('/')[1]}/invite/${inv.codigo_invitacion}`
                              )
                              toast({
                                title: 'Link copiado',
                                description: 'El link de invitación se copió al portapapeles',
                              })
                            }}
                          >
                            Copiar
                          </Button>
                        </div>
                      </div>
                    )}

                    {inv.invitado_name && (
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <Avatar>
                          <AvatarImage src={inv.invitado_image} />
                          <AvatarFallback>
                            {inv.invitado_name?.[0]?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{inv.invitado_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {inv.invitado_email}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {inv.estado === 'ACEPTADA' ? (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Permisos:</p>
                          <Select
                            value={inv.rol}
                            onValueChange={(value) => handleUpdateRole(inv.id, value)}
                            disabled={updatingRoleId === inv.id}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ADMIN">
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4 text-orange-600" />
                                  <span>Administrador</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="CONTRIBUTOR">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-blue-600" />
                                  <span>Colaborador</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="VIEWER">
                                <div className="flex items-center gap-2">
                                  <Eye className="h-4 w-4 text-gray-600" />
                                  <span>Visualizador</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <Badge variant="outline">
                          {inv.rol === 'ADMIN' ? 'Administrador' : inv.rol === 'CONTRIBUTOR' ? 'Colaborador' : 'Visualizador'}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>
      </Tabs>

      <Drawer
        open={deleteDrawerOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDeleteDrawer()
          } else {
            setDeleteDrawerOpen(true)
          }
        }}
      >
        <DrawerContent>
          <div className="mx-auto w-full max-w-md space-y-4 px-4 py-6">
          <DrawerHeader className="px-0">
            <DrawerTitle>Eliminar invitación</DrawerTitle>
            <DrawerDescription>
              {selectedInvitation?.estado === 'ACEPTADA'
                ? 'Esta persona dejará de tener acceso al sobre. '
                  + 'Se removerá su permiso inmediatamente.'
                : 'La invitación se cancelará y el link dejará de funcionar.'}
            </DrawerDescription>
          </DrawerHeader>

            <DrawerFooter className="px-0">
              <Button
                variant="destructive"
                onClick={handleDeleteInvitation}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  'Eliminar invitación'
                )}
              </Button>
              <Button variant="outline" onClick={closeDeleteDrawer}>
                Cancelar
              </Button>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
