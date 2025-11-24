'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/presentation/components/ui/drawer'
import { Button } from '@/presentation/components/ui/button'
import { Card, CardContent } from '@/presentation/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/presentation/components/ui/avatar'
import { Badge } from '@/presentation/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/presentation/components/ui/select'
import { Loader2, RefreshCw } from 'lucide-react'
import { useToast } from '@/presentation/hooks/use-toast'
import { cn } from '@/infrastructure/lib/utils'

type ListaRole = 'EDITOR' | 'EXECUTION_ONLY'

interface ListaInvitation {
  id: string
  invitado_email_o_telefono: string
  invitado_name?: string | null
  invitado_email?: string | null
  invitado_image?: string | null
  estado: 'PENDIENTE' | 'ACEPTADA' | string
  rol: ListaRole
  invitado_user_id?: string | null
}

interface ManageListInvitationsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  listaId: string
  listaNombre: string
}

export function ManageListInvitationsDrawer({
  open,
  onOpenChange,
  listaId,
  listaNombre,
}: ManageListInvitationsDrawerProps) {
  const { toast } = useToast()
  const [invitaciones, setInvitaciones] = useState<ListaInvitation[]>([])
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [roleSelections, setRoleSelections] = useState<Record<string, ListaRole>>({})

  const fetchInvitaciones = useCallback(async () => {
    if (!listaId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/shopping-lists/${listaId}/invite`)
      if (!res.ok) throw new Error('No se pudieron cargar las invitaciones')
      const data = await res.json()
      const items: ListaInvitation[] = data.invitaciones || []
      setInvitaciones(items)
      const nextRoles: Record<string, ListaRole> = {}
      items.forEach((inv) => {
        if (inv.rol === 'EDITOR' || inv.rol === 'EXECUTION_ONLY') {
          nextRoles[inv.id] = inv.rol
        }
      })
      setRoleSelections(nextRoles)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Ocurrió un problema al cargar las invitaciones',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [listaId, toast])

  useEffect(() => {
    if (open) {
      fetchInvitaciones()
    }
  }, [open, fetchInvitaciones])

  const handleSaveRole = async (invitacionId: string, role: ListaRole) => {
    setSavingId(invitacionId)
    try {
      const res = await fetch(`/api/shopping-lists/invitations/${invitacionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rol: role }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'No se pudo actualizar el rol')
      }

      toast({
        title: 'Permisos actualizados',
        description: 'Se guardó el nuevo rol del invitado.',
      })
      await fetchInvitaciones()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo actualizar el rol',
        variant: 'destructive',
      })
    } finally {
      setSavingId(null)
    }
  }

  const renderStatus = (estado: string) => {
    const base = 'rounded-full border px-2.5 py-0.5 text-xs font-medium'
    switch (estado) {
      case 'ACEPTADA':
        return <span className={cn(base, 'border-emerald-200 bg-emerald-50 text-emerald-700')}>Activa</span>
      case 'PENDIENTE':
        return <span className={cn(base, 'border-amber-200 bg-amber-50 text-amber-700')}>Pendiente</span>
      default:
        return <span className={cn(base, 'border-muted text-muted-foreground')}>{estado}</span>
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] sm:max-w-xl">
        <div className="mx-auto w-full max-w-xl">
          <DrawerHeader className="space-y-2">
            <DrawerTitle>Invitados de la lista</DrawerTitle>
            <DrawerDescription>
              Administra quién puede colaborar en <span className="font-semibold text-foreground">{listaNombre}</span>
            </DrawerDescription>
          </DrawerHeader>

          <DrawerBody className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {invitaciones.length > 0 ? `${invitaciones.length} invitación(es)` : 'Sin invitaciones activas'}
              </p>
              <Button variant="ghost" size="sm" onClick={fetchInvitaciones} disabled={loading}>
                <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
                Actualizar
              </Button>
            </div>

            {loading ? (
              <Card>
                <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando invitaciones...
                </CardContent>
              </Card>
            ) : invitaciones.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No tienes invitaciones activas por ahora.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {invitaciones.map((inv) => {
                  const name = inv.invitado_name || inv.invitado_email || inv.invitado_email_o_telefono
                  return (
                    <div
                      key={inv.id}
                      className="rounded-2xl border border-border bg-background/70 p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={inv.invitado_image || undefined} />
                            <AvatarFallback>{name?.charAt(0)?.toUpperCase() || '?'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold leading-tight">{name}</p>
                            <p className="text-xs text-muted-foreground">{inv.invitado_email_o_telefono}</p>
                            <div className="mt-1 flex flex-wrap gap-2">
                              <Badge variant="outline">
                                {inv.rol === 'EDITOR' ? 'Editor' : 'Solo ejecución'}
                              </Badge>
                              {renderStatus(inv.estado)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <Select
                          value={roleSelections[inv.id] || inv.rol}
                          onValueChange={(value) =>
                            setRoleSelections((prev) => ({
                              ...prev,
                              [inv.id]: value as ListaRole,
                            }))
                          }
                          disabled={savingId === inv.id}
                        >
                          <SelectTrigger className="sm:w-[220px]">
                            <SelectValue placeholder="Selecciona rol" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EDITOR">Editor</SelectItem>
                            <SelectItem value="EXECUTION_ONLY">Solo ejecución</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={
                            savingId === inv.id ||
                            (roleSelections[inv.id] || inv.rol) === inv.rol
                          }
                          onClick={() => {
                            const nextRole = roleSelections[inv.id] || inv.rol
                            handleSaveRole(inv.id, nextRole)
                          }}
                        >
                          {savingId === inv.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Guardando
                            </>
                          ) : (
                            'Guardar'
                          )}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </DrawerBody>

          <DrawerFooter className="border-t border-border">
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                Cerrar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
