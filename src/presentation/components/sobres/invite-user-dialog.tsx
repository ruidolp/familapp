'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/presentation/components/ui/dialog'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { Card, CardContent } from '@/presentation/components/ui/card'
import { Badge } from '@/presentation/components/ui/badge'
import { Alert, AlertDescription } from '@/presentation/components/ui/alert'
import { useToast } from '@/presentation/hooks/use-toast'
import { Loader2, Mail, Phone, Shield, Users, Eye, Check, X, AlertTriangle, MessageCircle } from 'lucide-react'
import { cn } from '@/infrastructure/lib/utils'

interface InviteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tipo: 'sobre' | 'lista'
  itemId: string
  itemNombre: string
  itemEmoji?: string
  onSuccess?: (method: ContactMethod) => void
}

type RolSobre = 'ADMIN' | 'CONTRIBUTOR' | 'VIEWER' | 'OWNER'
type RolLista = 'EDITOR' | 'EXECUTION_ONLY' | 'OWNER'
type RolOption = RolSobre | RolLista

export type ContactMethod = 'email' | 'whatsapp'

interface RoleInfo {
  icon: typeof Shield
  name: string
  description: string
  accentColor: string
  accentBg: string
  permissions: Array<{ text: string; allowed: boolean }>
  tag?: string
}

export function InviteUserDialog({
  open,
  onOpenChange,
  tipo,
  itemId,
  itemNombre,
  itemEmoji,
  onSuccess,
}: InviteUserDialogProps) {
  const locale = useLocale()
  const [contact, setContact] = useState('')
  const [contactMethod, setContactMethod] = useState<ContactMethod>('email')
  const [rol, setRol] = useState<RolOption>(tipo === 'sobre' ? 'CONTRIBUTOR' : 'EDITOR')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { toast } = useToast()

  const baseSobreRoleConfig: Record<'ADMIN' | 'CONTRIBUTOR' | 'VIEWER', RoleInfo> = {
    ADMIN: {
      icon: Shield,
      name: 'Administrador',
      description: 'Control total del presupuesto y configuraciones del sobre.',
      accentColor: 'text-orange-600',
      accentBg: 'bg-orange-100 dark:bg-orange-950/40',
      permissions: [
        { text: 'Modificar presupuesto', allowed: true },
        { text: 'Crear gastos', allowed: true },
        { text: 'Agregar categorías', allowed: true },
        { text: 'Editar nombre/color', allowed: true },
      ],
    },
    CONTRIBUTOR: {
      icon: Users,
      name: 'Colaborador',
      description: 'Colabora agregando gastos y categorías sin tocar el presupuesto.',
      accentColor: 'text-blue-600',
      accentBg: 'bg-blue-100 dark:bg-blue-950/40',
      permissions: [
        { text: 'Crear gastos', allowed: true },
        { text: 'Agregar categorías', allowed: true },
        { text: 'Modificar presupuesto', allowed: false },
        { text: 'Editar nombre/color', allowed: false },
      ],
      tag: 'Recomendada',
    },
    VIEWER: {
      icon: Eye,
      name: 'Visualizador',
      description: 'Ideal para quienes solo necesitan visibilidad y seguimiento.',
      accentColor: 'text-gray-600',
      accentBg: 'bg-gray-100 dark:bg-gray-950/40',
      permissions: [
        { text: 'Ver transacciones', allowed: true },
        { text: 'Crear gastos', allowed: false },
        { text: 'Modificar presupuesto', allowed: false },
        { text: 'Editar sobre', allowed: false },
      ],
    },
  }

  const baseListaRoleConfig: Record<'EDITOR' | 'EXECUTION_ONLY', RoleInfo> = {
    EDITOR: {
      icon: Users,
      name: 'Editor',
      description: 'Puede editar productos y ejecutar compras.',
      accentColor: 'text-blue-600',
      accentBg: 'bg-blue-100 dark:bg-blue-950/40',
      permissions: [
        { text: 'Agregar productos', allowed: true },
        { text: 'Editar productos', allowed: true },
        { text: 'Ejecutar compras', allowed: true },
        { text: 'Cambiar nombre/descripción', allowed: false },
        { text: 'Eliminar lista', allowed: false },
      ],
      tag: 'Recomendada',
    },
    EXECUTION_ONLY: {
      icon: Eye,
      name: 'Solo Ejecución',
      description: 'Solo puede realizar las compras.',
      accentColor: 'text-gray-600',
      accentBg: 'bg-gray-100 dark:bg-gray-950/40',
      permissions: [
        { text: 'Ejecutar compras', allowed: true },
        { text: 'Ver productos', allowed: true },
        { text: 'Editar productos', allowed: false },
        { text: 'Modificar lista', allowed: false },
      ],
    },
  }

  const sobreRoleConfig: Record<RolSobre, RoleInfo> = {
    ...baseSobreRoleConfig,
    OWNER: {
      ...baseSobreRoleConfig.ADMIN,
      name: 'Propietario',
      description: 'Creador del sobre con todos los permisos.',
    },
  }

  const listaRoleConfig: Record<RolLista, RoleInfo> = {
    ...baseListaRoleConfig,
    OWNER: {
      ...baseListaRoleConfig.EDITOR,
      name: 'Propietario',
      description: 'Creador de la lista con todos los permisos.',
      permissions: [
        { text: 'Agregar productos', allowed: true },
        { text: 'Editar productos', allowed: true },
        { text: 'Ejecutar compras', allowed: true },
        { text: 'Cambiar nombre/descripción', allowed: true },
        { text: 'Eliminar lista', allowed: true },
      ],
    },
  }

  const roleConfig = tipo === 'sobre' ? sobreRoleConfig : listaRoleConfig

  const buildInvitationLink = (code?: string | null) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')
    if (code) {
      const path = tipo === 'sobre' ? 'invite' : 'invite/lista'
      return `${baseUrl}/${locale}/${path}/${code}`
    }
    return `${baseUrl}/${locale}/invitations`
  }

  const handleInvite = async () => {
    const trimmed = contact.trim()
    if (!trimmed) {
      setErrorMessage('Ingresa un email o teléfono válido')
      return
    }

    if (contactMethod === 'email' && !trimmed.includes('@')) {
      setErrorMessage('Ingresa un correo electrónico válido')
      return
    }

    if (contactMethod === 'whatsapp') {
      const digits = trimmed.replace(/\D/g, '')
      if (digits.length < 8) {
        setErrorMessage('Ingresa un número de WhatsApp válido (código de país incluido)')
        return
      }
    }

    setErrorMessage(null)
    setLoading(true)
    try {
      const methodUsed = contactMethod
      const endpoint = tipo === 'sobre' ? `/api/sobres/${itemId}/invite` : `/api/shopping-lists/${itemId}/invite`
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: trimmed, rol }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'No se pudo enviar la invitación')
      }

      const data = await res.json()

      const itemType = tipo === 'sobre' ? 'sobre' : 'lista'
      toast({
        title: '¡Invitación creada!',
        description:
          contactMethod === 'email'
            ? 'Enviamos un correo con la invitación.'
            : `Comparte el enlace desde WhatsApp para que se unan a ${itemType === 'sobre' ? 'al sobre' : 'la lista'}.`,
      })

      if (methodUsed === 'whatsapp') {
        const inviteLink = buildInvitationLink(data.invitacion?.codigo_invitacion)
        const verb = tipo === 'sobre' ? 'administrar el sobre' : 'colaborar en la lista'
        const message = `Hola, te invito a ${verb} ${itemEmoji || ''} ${itemNombre} en Familapp. Ingresa aquí: ${inviteLink}`
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
        window.open(whatsappUrl, '_blank', 'noreferrer')
        handleClose()
      }

      onSuccess?.(methodUsed)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo enviar la invitación'
      setErrorMessage(message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setContact('')
    setRol(tipo === 'sobre' ? 'CONTRIBUTOR' : 'EDITOR')
    setContactMethod('email')
    setErrorMessage(null)
    onOpenChange(false)
  }

  const handleDialogChange = (value: boolean) => {
    if (!value) {
      handleClose()
    } else {
      onOpenChange(true)
    }
  }

  const contactOptions: Array<{ key: ContactMethod; label: string; description: string; icon: typeof Mail }> = [
    { key: 'email', label: 'Mail', description: 'Enviamos un correo automático', icon: Mail },
    { key: 'whatsapp', label: 'WhatsApp', description: 'Comparte el link por chat', icon: MessageCircle },
  ]

  const selectableRoles: RolOption[] = tipo === 'sobre'
    ? (['ADMIN', 'CONTRIBUTOR', 'VIEWER'] as RolSobre[])
    : (['EDITOR', 'EXECUTION_ONLY'] as RolLista[])

  const selectedRoleKey = rol === 'OWNER'
    ? (tipo === 'sobre' ? 'ADMIN' : 'EDITOR')
    : rol
  const selectedRoleConfig = roleConfig[selectedRoleKey as keyof typeof roleConfig]
  const SelectedRoleIcon = selectedRoleConfig.icon

  const permissionsToDisplay = tipo === 'lista'
    ? selectedRoleConfig.permissions.filter(perm => perm.allowed)
    : selectedRoleConfig.permissions

  const formatPermissionLabel = (text: string) => text

  const getStatusBadge = (estado: string) => {
    const base = 'border px-2.5 py-0.5 text-xs font-medium rounded-full'
    switch (estado) {
      case 'ACEPTADA':
        return <span className={cn(base, 'border-emerald-200 bg-emerald-50 text-emerald-700')}>Activa</span>
      case 'PENDIENTE':
        return <span className={cn(base, 'border-amber-200 bg-amber-50 text-amber-700')}>Pendiente</span>
      case 'RECHAZADA':
        return <span className={cn(base, 'border-rose-200 bg-rose-50 text-rose-700')}>Rechazada</span>
      default:
        return <span className={cn(base, 'border-muted text-muted-foreground')}>{estado}</span>
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{itemEmoji || (tipo === 'sobre' ? '📦' : '🛒')}</span>
            <span className="truncate">Invitar a {itemNombre}</span>
          </DialogTitle>
          <DialogDescription>
            {tipo === 'sobre'
              ? 'Comparte este sobre con otra persona para gestionar el presupuesto juntos'
              : 'Comparte esta lista con otra persona para gestionar las compras juntos'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-3">
            <Label>Método de invitación</Label>
            <div className="grid grid-cols-2 gap-2">
              {contactOptions.map((option) => {
                const Icon = option.icon
                const isSelected = contactMethod === option.key
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setContactMethod(option.key)}
                    disabled={loading}
                    className={cn(
                      'rounded-2xl border p-3 text-left transition',
                      isSelected ? 'border-primary bg-primary/10 shadow-sm' : 'border-border hover:border-primary/40',
                      loading && 'opacity-60'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={cn('h-4 w-4', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                      <span className="font-semibold">{option.label}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
                  </button>
                )
              })}
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact">
                {contactMethod === 'email' ? 'Correo electrónico' : 'Número de WhatsApp'}
              </Label>
              <div className="relative">
                <Input
                  id="contact"
                  type={contactMethod === 'email' ? 'email' : 'tel'}
                  placeholder={contactMethod === 'email' ? 'email@ejemplo.com' : '+56912345678'}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  disabled={loading}
                  className="pl-10"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  {contactMethod === 'email' ? (
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {contactMethod === 'email'
                  ? `Enviaremos un correo con el enlace para unirse ${tipo === 'sobre' ? 'al sobre' : 'a la lista'}.`
                  : 'Usa código de país. Se abrirá WhatsApp con un mensaje listo para enviar.'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Selecciona el rol</Label>
              {selectedRoleConfig.tag && (
                <Badge variant="outline" className="border-primary/30 text-primary">
                  {selectedRoleConfig.tag}
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {selectableRoles.map((roleKey) => {
                const config = roleConfig[roleKey]
                const Icon = config.icon
                const isSelected = rol === roleKey
                return (
                  <button
                    key={roleKey}
                    type="button"
                    onClick={() => setRol(roleKey)}
                    disabled={loading}
                    className={cn(
                      'rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                      isSelected ? 'border-primary bg-primary/10 shadow-sm' : 'border-border hover:border-primary/40',
                      loading && 'opacity-60'
                    )}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Icon className={cn('h-4 w-4', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                        <span className="font-semibold text-sm">{config.name}</span>
                      </div>
                      {((tipo === 'sobre' && roleKey === 'CONTRIBUTOR') || (tipo === 'lista' && roleKey === 'EDITOR')) && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                          Recomendado
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
            <Card className="border border-border bg-muted/40">
              <CardContent className="space-y-3 pt-4">
                <div className="flex items-center gap-3">
                  <div className={cn('rounded-full p-2', selectedRoleConfig.accentBg)}>
                    <SelectedRoleIcon className={cn('h-5 w-5', selectedRoleConfig.accentColor)} />
                  </div>
                  <div>
                    <p className="font-semibold">{selectedRoleConfig.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedRoleConfig.description}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {permissionsToDisplay.map((perm, idx) => (
                    <div key={`${selectedRoleKey}-${idx}`} className="flex items-center gap-2 text-sm">
                      {perm.allowed ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      <span className={perm.allowed ? 'text-foreground' : 'text-muted-foreground line-through'}>
                        {formatPermissionLabel(perm.text)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {tipo === 'sobre' && rol === 'ADMIN' && (
            <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-sm text-orange-900 dark:text-orange-100">
                Este rol puede agregar o quitar presupuesto del sobre.
              </AlertDescription>
            </Alert>
          )}

          <div className="rounded-2xl border border-border bg-muted/50 p-4">
            <p className="mb-2 text-sm font-medium text-foreground">Al aceptar la invitación:</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {tipo === 'sobre' ? (
                <>
                  <li>✓ Verán el presupuesto en tiempo real</li>
                  <li>✓ Accederán al historial de gastos</li>
                  <li>✓ Los cambios se sincronizan automáticamente</li>
                </>
              ) : (
                <>
                  <li>✓ Verán la lista en tiempo real</li>
                  <li>✓ Accederán al historial de compras</li>
                  <li>✓ Los cambios se sincronizan automáticamente</li>
                </>
              )}
            </ul>
          </div>

          {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
        </div>

        <DialogFooter className="pt-4">
          <Button onClick={handleInvite} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : contactMethod === 'email' ? (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Enviar por mail
              </>
            ) : (
              <>
                <MessageCircle className="h-4 w-4 mr-2" />
                Compartir en WhatsApp
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
