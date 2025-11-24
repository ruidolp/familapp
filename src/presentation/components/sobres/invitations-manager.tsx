'use client'

/**
 * Invitations Manager Component
 *
 * Gestiona las invitaciones a sobres y listas compartidas
 * - Recibidas: Invitaciones pendientes que puedo aceptar/rechazar
 * - Enviadas: Invitaciones que he enviado
 * - Sobres/Listas: Selector para elegir tipo de invitación
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

interface InvitacionListaRecibida {
  id: string
  lista_id: string
  lista_nombre: string
  rol: string
  created_at: string
  expires_at: string
  inviter_name?: string
  inviter_email?: string
  inviter_image?: string
}

interface InvitacionListaEnviada {
  id: string
  lista_id: string
  lista_nombre: string
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
  // Sobres invitations
  const [invitacionesRecibidas, setInvitacionesRecibidas] = useState<InvitacionRecibida[]>([])
  const [invitacionesEnviadas, setInvitacionesEnviadas] = useState<InvitacionEnviada[]>([])

  // Listas invitations
  const [invitacionesListasRecibidas, setInvitacionesListasRecibidas] = useState<InvitacionListaRecibida[]>([])
  const [invitacionesListasEnviadas, setInvitacionesListasEnviadas] = useState<InvitacionListaEnviada[]>([])

  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [deleteDrawerOpen, setDeleteDrawerOpen] = useState(false)
  const [selectedInvitation, setSelectedInvitation] = useState<InvitacionEnviada | InvitacionListaEnviada | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'recibidas' | 'enviadas'>('recibidas')
  const [tipo, setTipo] = useState<'sobre' | 'lista'>('sobre')
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
      // Fetch sobres invitations
      const resSobres = await fetch('/api/sobres/invitations')
      if (resSobres.ok) {
        const dataSobres = await resSobres.json()
        setInvitacionesRecibidas(dataSobres.recibidas || [])
        setInvitacionesEnviadas(dataSobres.enviadas || [])
      }

      // Fetch listas invitations
      const resListas = await fetch('/api/shopping-lists/invitations')
      if (resListas.ok) {
        const dataListas = await resListas.json()
        setInvitacionesListasRecibidas(dataListas.recibidas || [])
        setInvitacionesListasEnviadas(dataListas.enviadas || [])
      }
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
      const endpoint = tipo === 'sobre'
        ? `/api/sobres/invitations/${invitacionId}/accept`
        : `/api/shopping-lists/invitations/${invitacionId}/accept`

      const res = await fetch(endpoint, {
        method: 'POST',
      })

      if (!res.ok) throw new Error('Error al aceptar invitación')

      const data = await res.json()

      toast({
        title: tipo === 'sobre' ? '¡Te uniste al sobre!' : '¡Te uniste a la lista!',
        description: data.message || (tipo === 'sobre'
          ? `Ahora eres parte de "${data.sobre?.nombre}"`
          : `Ahora eres parte de "${data.lista?.nombre}"`),
      })

      // Refrescar lista
      await fetchInvitaciones()

      // Refrescar página para mostrar nuevo elemento
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

  const handleReject = async (invitacionId: string, itemNombre: string) => {
    setProcessingId(invitacionId)
    try {
      const endpoint = tipo === 'sobre'
        ? `/api/sobres/invitations/${invitacionId}/reject`
        : `/api/shopping-lists/invitations/${invitacionId}/reject`

      const res = await fetch(endpoint, {
        method: 'POST',
      })

      if (!res.ok) throw new Error('Error al rechazar invitación')

      const data = await res.json()

      toast({
        title: 'Invitación rechazada',
        description: data.message || (tipo === 'sobre'
          ? `Rechazaste la invitación a "${itemNombre}"`
          : `Rechazaste la invitación a "${itemNombre}"`),
      })

      // Refrescar lista
      await fetchInvitaciones()

      // Si se creó un item, refrescar página
      if (data.sobre_creado || data.lista_creada) {
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
      const endpoint = tipo === 'sobre'
        ? `/api/sobres/invitations/${selectedInvitation.id}`
        : `/api/shopping-lists/invitations/${selectedInvitation.id}`

      const res = await fetch(endpoint, {
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
      const endpoint = tipo === 'sobre'
        ? `/api/sobres/invitations/${invitacionId}`
        : `/api/shopping-lists/invitations/${invitacionId}`

      const res = await fetch(endpoint, {
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

  // Variables dinámicas según el tipo seleccionado
  const currentRecibidas = tipo === 'sobre' ? invitacionesRecibidas : invitacionesListasRecibidas
  const currentEnviadas = tipo === 'sobre' ? invitacionesEnviadas : invitacionesListasEnviadas
  const itemEmoji = tipo === 'sobre' ? '📦' : '🛒'
  const itemTypeLabel = tipo === 'sobre' ? 'Sobre' : 'Lista'
  const titleLabel = tipo === 'sobre' ? 'sobres' : 'listas'

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
            Gestiona tus invitaciones a sobres y listas compartidas
          </p>
        </div>
      </div>

      {/* Tabs para seleccionar tipo: Sobres o Listas */}
      <Tabs
        value={tipo}
        onValueChange={(value) => setTipo(value as 'sobre' | 'lista')}
        className="w-full"
      >
        <Card className="bg-card/80 border border-border/80 shadow-sm">
          <CardContent className="space-y-2 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Tipo de invitación
            </p>
            <TabsList className="grid w-full grid-cols-2 gap-2 bg-transparent p-0">
              <TabsTrigger
                value="sobre"
                className="h-9 rounded-2xl border border-transparent bg-muted/30 text-[11px] font-semibold tracking-wide data-[state=active]:border-tertiary/40 data-[state=active]:bg-tertiary/20 data-[state=active]:text-foreground"
              >
                <span className="flex items-center gap-2">
                  Sobres
                  {(invitacionesRecibidas.length + invitacionesEnviadas.length) > 0 && (
                    <Badge variant="secondary" className="ml-1 text-[10px]">
                      {invitacionesRecibidas.length + invitacionesEnviadas.length}
                    </Badge>
                  )}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="lista"
                className="h-9 rounded-2xl border border-transparent bg-muted/30 text-[11px] font-semibold tracking-wide data-[state=active]:border-primary/40 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
              >
                <span className="flex items-center gap-2">
                  Listas
                  {(invitacionesListasRecibidas.length + invitacionesListasEnviadas.length) > 0 && (
                    <Badge className="ml-1 text-[10px]">
                      {invitacionesListasRecibidas.length + invitacionesListasEnviadas.length}
                    </Badge>
                  )}
                </span>
              </TabsTrigger>
            </TabsList>
          </CardContent>
        </Card>

        <TabsContent value="sobre" className="mt-4">
          <InvitacionesTabs />
        </TabsContent>

        <TabsContent value="lista" className="mt-4">
          <InvitacionesTabs />
        </TabsContent>
      </Tabs>

      {/* Drawer for deleting invitations */}
      <DrawerComponent />
    </div>
  )

  // Componente interno para las tabs de Recibidas/Enviadas
  function InvitacionesTabs() {
    return (
      <Card className="border border-border/80 bg-card/80 shadow-sm">
        <CardContent className="space-y-4 p-4">
          <Tabs
            value={activeTab}
            onValueChange={(value) => handleTabChange(value as 'recibidas' | 'enviadas')}
            className="w-full"
          >
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Filtrar invitaciones
              </p>
              <TabsList className="grid w-full grid-cols-2 gap-2 bg-transparent p-0">
                <TabsTrigger
                  value="recibidas"
                  className="h-9 rounded-2xl border border-transparent bg-muted/30 text-[11px] font-semibold tracking-wide data-[state=active]:border-tertiary/40 data-[state=active]:bg-tertiary/20 data-[state=active]:text-foreground"
                >
                  <span className="flex items-center gap-2">
                    Recibidas
                    {currentRecibidas.length > 0 && (
                      <Badge variant="destructive" className="ml-1 text-[10px]">
                        {currentRecibidas.length}
                      </Badge>
                    )}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="enviadas"
                  className="h-9 rounded-2xl border border-transparent bg-muted/30 text-[11px] font-semibold tracking-wide data-[state=active]:border-primary/40 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                >
                  <span className="flex items-center gap-2">
                    Enviadas
                    {currentEnviadas.length > 0 && (
                      <Badge className="ml-1 text-[10px]">
                        {currentEnviadas.length}
                      </Badge>
                    )}
                  </span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="recibidas" className="space-y-4 pt-2">
              {currentRecibidas.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">
                      No tienes invitaciones pendientes
                    </p>
                  </CardContent>
                </Card>
              ) : (
                currentRecibidas.map((inv: any) => (
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
                          {tipo === 'sobre'
                            ? (inv.rol === 'ADMIN' ? 'Administrador' : inv.rol === 'CONTRIBUTOR' ? 'Colaborador' : 'Visualizador')
                            : (inv.rol === 'EDITOR' ? 'Editor' : 'Solo Ejecución')}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                        <span className="text-3xl">{tipo === 'sobre' ? (inv.sobre_emoji || '📦') : '🛒'}</span>
                        <div>
                          <p className="font-medium">{itemTypeLabel}: {inv.sobre_nombre || inv.lista_nombre}</p>
                          <p className="text-sm text-muted-foreground">
                            Te invitó a colaborar en {tipo === 'sobre' ? 'este sobre' : 'esta lista'}
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
                          {tipo === 'sobre' ? (
                            <>
                              <li>✓ Presupuesto compartido en tiempo real</li>
                              <li>✓ Todos ven los gastos del sobre</li>
                              <li>✓ Sincronización automática</li>
                            </>
                          ) : (
                            <>
                              <li>✓ Lista compartida en tiempo real</li>
                              <li>✓ Todos ven las compras</li>
                              <li>✓ Sincronización automática</li>
                            </>
                          )}
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
                        onClick={() => handleReject(inv.id, inv.sobre_nombre || inv.lista_nombre)}
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
                            Crear mi {tipo === 'sobre' ? 'propio' : 'propia'} {inv.sobre_nombre || inv.lista_nombre}
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="enviadas" className="space-y-4 pt-2">
              {currentEnviadas.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">
                      No has enviado invitaciones aún
                    </p>
                  </CardContent>
                </Card>
              ) : (
                currentEnviadas.map((inv: any) => {
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
                            <span className="text-3xl">{tipo === 'sobre' ? (inv.sobre_emoji || '📦') : '🛒'}</span>
                            <div>
                              <CardTitle className="text-lg">{inv.sobre_nombre || inv.lista_nombre}</CardTitle>
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
                            Enviada{' '}
                            {formatDistanceToNow(new Date(inv.created_at), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Eye className="h-4 w-4" />
                          <span>
                            {isExpired
                              ? 'Expirada'
                              : `Expira el ${new Date(inv.expires_at).toLocaleDateString('es-CL')}`}
                          </span>
                        </div>

                        {inv.codigo_invitacion && (
                          <div className="rounded-lg border border-dashed border-muted-foreground/40 p-3">
                            <p className="text-xs text-muted-foreground mb-1">Código</p>
                            <p className="font-mono text-sm">{inv.codigo_invitacion}</p>
                          </div>
                        )}
                      </CardContent>

                      <CardFooter className="flex justify-end gap-2">
                        {inv.estado === 'PENDIENTE' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDrawer(inv)}
                          >
                            Cancelar invitación
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  )
                })
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    )
  }


  // Componente interno para el Drawer de eliminación
  function DrawerComponent() {
    return (
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
                  ? `Esta persona dejará de tener acceso ${tipo === 'sobre' ? 'al sobre' : 'a la lista'}. Se removerá su permiso inmediatamente.`
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
    )
  }
}
