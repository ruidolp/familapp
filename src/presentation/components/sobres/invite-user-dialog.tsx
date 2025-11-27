'use client'

import { useState, useEffect } from 'react'
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
import { Alert, AlertDescription, AlertTitle } from '@/presentation/components/ui/alert'
import { useToast } from '@/presentation/hooks/use-toast'
import { Loader2, Mail, Phone, Shield, Users as UsersIcon, Eye, Check, MessageCircle, UserCircle, X } from 'lucide-react'
import { cn } from '@/infrastructure/lib/utils'
import Image from 'next/image'

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

export type ContactMethod = 'email' | 'whatsapp' | 'contact'

interface MyContact {
  id: string
  name: string | null
  email: string | null
  image: string | null
}

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
  const [successInfo, setSuccessInfo] = useState<{ contact: string; inviteLink?: string | null } | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const { toast } = useToast()

  // Estados para "Mis contactos"
  const [myContacts, setMyContacts] = useState<MyContact[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)

  const baseSobreRoleConfig: Record<'ADMIN' | 'CONTRIBUTOR' | 'VIEWER', RoleInfo> = {
    ADMIN: {
      icon: Shield,
      name: 'Administrador',
      description: 'Gestiona presupuesto, categorías y participantes sin límites.',
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
      icon: UsersIcon,
      name: 'Colaborador',
      description: 'Crea gastos y organiza categorías sin modificar el presupuesto.',
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
      description: 'Solo consulta el sobre y su historial.',
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
      icon: UsersIcon,
      name: 'Editor',
      description: 'Agrega y actualiza productos, además ejecuta compras.',
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
      description: 'Solo marca compras como realizadas.',
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

  // Cargar contactos cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      loadMyContacts()
    }
  }, [open])

  const loadMyContacts = async () => {
    setLoadingContacts(true)
    try {
      const res = await fetch('/api/my-contacts')
      if (!res.ok) throw new Error('No se pudieron cargar los contactos')
      const data = await res.json()
      setMyContacts(data.contacts || [])
    } catch (error) {
      console.error('Error loading contacts:', error)
      setMyContacts([])
    } finally {
      setLoadingContacts(false)
    }
  }

  const buildInvitationLink = (code?: string | null) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')
    if (code) {
      const path = tipo === 'sobre' ? 'invite' : 'invite/lista'
      return `${baseUrl}/${locale}/${path}/${code}`
    }
    return `${baseUrl}/${locale}/invitations`
  }

  const handleInvite = async () => {
    // Para "Mis contactos", validar que se seleccionó un contacto
    if (contactMethod === 'contact') {
      if (!selectedContactId) {
        setErrorMessage('Selecciona un contacto de la lista')
        return
      }
      const selectedContact = myContacts.find(c => c.id === selectedContactId)
      if (!selectedContact || !selectedContact.email) {
        setErrorMessage('El contacto seleccionado no tiene email')
        return
      }
    } else {
      // Validaciones para email y whatsapp
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
    }

    setErrorMessage(null)
    setLoading(true)
    try {
      const methodUsed = contactMethod
      const endpoint = tipo === 'sobre' ? `/api/sobres/${itemId}/invite` : `/api/shopping-lists/${itemId}/invite`

      // Determinar el contacto a enviar
      let contactToSend = contact.trim()
      if (contactMethod === 'contact') {
        const selectedContact = myContacts.find(c => c.id === selectedContactId)
        contactToSend = selectedContact?.email || ''
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: contactToSend, rol }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'No se pudo enviar la invitación')
      }

      const data = await res.json()

      const itemType = tipo === 'sobre' ? 'sobre' : 'lista'
      const inviteLink = data.invitacion?.codigo_invitacion
        ? buildInvitationLink(data.invitacion.codigo_invitacion)
        : null

      // Obtener el nombre del contacto para mostrarlo en la notificación
      let displayContact = contactToSend
      if (methodUsed === 'contact' && selectedContactId) {
        const selectedContact = myContacts.find(c => c.id === selectedContactId)
        displayContact = selectedContact?.name || selectedContact?.email || contactToSend
      }

      if (methodUsed === 'whatsapp') {
        const shareLink = inviteLink ?? buildInvitationLink(data.invitacion?.codigo_invitacion)
        const verb = tipo === 'sobre' ? 'administrar el sobre' : 'colaborar en la lista'
        const message = `Hola, te invito a ${verb} ${itemEmoji || ''} ${itemNombre} en Familapp. Ingresa aquí: ${shareLink}`
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
        window.open(whatsappUrl, '_blank', 'noreferrer')
        handleClose()
        setSuccessInfo(null)
        setCopiedLink(false)
        toast({
          title: '¡Invitación creada!',
          description: `Comparte el enlace desde WhatsApp para que se unan a ${itemType === 'sobre' ? 'al sobre' : 'la lista'}.`,
        })
      } else {
        // Para email y contact, mostrar la notificación en el diálogo
        setSuccessInfo({
          contact: displayContact,
          inviteLink,
        })
        setCopiedLink(false)
        setContact('')
        setSelectedContactId(null)
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
    setSuccessInfo(null)
    setCopiedLink(false)
    setSelectedContactId(null)
    onOpenChange(false)
  }

  const handleDialogChange = (value: boolean) => {
    if (!value) {
      handleClose()
    } else {
      onOpenChange(true)
    }
  }

  const handleCopyInviteLink = async () => {
    if (!successInfo?.inviteLink) return
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        throw new Error('Clipboard not available')
      }
      await navigator.clipboard.writeText(successInfo.inviteLink)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch (error) {
      toast({
        title: 'No se pudo copiar el enlace',
        description: 'Cópialo manualmente y compártelo con tu invitado.',
        variant: 'destructive',
      })
    }
  }

  const contactOptions: Array<{ key: ContactMethod; label: string; description: string; icon: typeof Mail }> = [
    { key: 'contact', label: 'Mis contactos', description: 'Invita a personas que ya participan', icon: UsersIcon },
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

  const permissionsToDisplay = selectedRoleConfig.permissions.filter((perm) => perm.allowed)

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

        <Card className="border border-border bg-card/80 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-2xl text-primary">
              {itemEmoji || (tipo === 'sobre' ? '📦' : '🛒')}
            </div>
            <div>
              <p className="font-semibold leading-tight text-foreground">{itemNombre}</p>
              <p className="text-xs text-muted-foreground">
                {tipo === 'sobre'
                  ? 'Colaboración en un sobre compartido'
                  : 'Colaboración en una lista compartida'}
              </p>
            </div>
          </CardContent>
        </Card>


        <div className="space-y-5">
          <div className="space-y-3">
            <Label>Método de invitación</Label>
            <div className="grid grid-cols-3 gap-2">
              {contactOptions.map((option) => {
                const Icon = option.icon
                const isSelected = contactMethod === option.key
                const isDisabled = loading || (option.key === 'contact' && myContacts.length === 0 && !loadingContacts)
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => {
                      if (contactMethod !== option.key) {
                        setContact('')
                        setSuccessInfo(null)
                        setCopiedLink(false)
                        setSelectedContactId(null)
                      }
                      setContactMethod(option.key)
                    }}
                    disabled={isDisabled}
                    className={cn(
                      'flex flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-center transition',
                      isSelected ? 'border-primary bg-primary/10 shadow-sm' : 'border-border hover:border-primary/40',
                      isDisabled && 'opacity-40 cursor-not-allowed'
                    )}
                  >
                    <Icon className={cn('h-5 w-5', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                    <span className="text-xs font-medium">{option.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Input de email/teléfono o lista de contactos */}
            {contactMethod === 'contact' ? (
              <div className="space-y-2">
                <Label>Selecciona un contacto</Label>
                {loadingContacts ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : myContacts.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No tienes contactos disponibles. Primero invita a personas a tus sobres o listas.
                  </p>
                ) : (
                  <div className="max-h-[200px] overflow-y-auto space-y-2 rounded-lg border p-2">
                    {myContacts.map((contact) => (
                      <button
                        key={contact.id}
                        type="button"
                        onClick={() => setSelectedContactId(contact.id)}
                        disabled={loading}
                        className={cn(
                          'w-full flex items-center gap-3 rounded-lg border p-3 text-left transition',
                          selectedContactId === contact.id
                            ? 'border-primary bg-primary/10 shadow-sm'
                            : 'border-border hover:border-primary/40',
                          loading && 'opacity-60'
                        )}
                      >
                        {contact.image ? (
                          <Image
                            src={contact.image}
                            alt={contact.name || 'Usuario'}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            <UserCircle className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {contact.name || contact.email || 'Sin nombre'}
                          </p>
                          {contact.email && (
                            <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                          )}
                        </div>
                        {selectedContactId === contact.id && (
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
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
            )}
          </div>

          <div className="space-y-3">
            <Label>Selecciona el rol</Label>
            <div className="flex flex-col gap-2">
              {selectableRoles.map((roleKey) => {
                const config = roleConfig[roleKey as keyof typeof roleConfig]
                const Icon = config.icon
                const isSelected = rol === roleKey
                return (
                  <button
                    key={roleKey}
                    type="button"
                    onClick={() => setRol(roleKey)}
                    disabled={loading}
                    className={cn(
                      'w-full rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                      isSelected ? 'border-primary bg-primary/10 shadow-sm' : 'border-border hover:border-primary/40',
                      loading && 'opacity-60'
                    )}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Icon className={cn('h-4 w-4', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                        <span className="font-semibold text-sm">{config.name}</span>
                      </div>
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
                    <p className="text-xs leading-relaxed text-muted-foreground">{selectedRoleConfig.description}</p>
                 </div>
               </div>
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Como {selectedRoleConfig.name} podrás
                  </p>
                  {permissionsToDisplay.map((perm, idx) => (
                    <div key={`${selectedRoleKey}-${idx}`} className="flex items-center gap-2 text-sm">
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-foreground">{formatPermissionLabel(perm.text)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
        </div>

        <DialogFooter className="pt-4">
          {successInfo ? (
            <Alert className="w-full border-emerald-200 bg-emerald-50 text-emerald-900">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <AlertTitle>Invitación enviada</AlertTitle>
                  <AlertDescription className="space-y-3 text-sm mt-2">
                    <p>
                      Invitamos a <span className="font-semibold text-foreground">{successInfo.contact}</span> a{' '}
                      {tipo === 'sobre' ? 'este sobre' : 'esta lista'}.{' '}
                      {successInfo.inviteLink
                        ? 'Si necesita el acceso directo, comparte este enlace.'
                        : 'Recibirá un correo con los pasos para unirse.'}
                    </p>
                    {successInfo.inviteLink && (
                      <div className="flex flex-col gap-2">
                        <div className="break-all rounded-lg border border-emerald-200 bg-white/80 px-3 py-2 text-xs text-muted-foreground">
                          {successInfo.inviteLink}
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="self-start"
                          onClick={handleCopyInviteLink}
                          disabled={copiedLink}
                        >
                          {copiedLink ? 'Link copiado' : 'Copiar link'}
                        </Button>
                      </div>
                    )}
                  </AlertDescription>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setSuccessInfo(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Alert>
          ) : (
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
              ) : contactMethod === 'whatsapp' ? (
                <>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Compartir en WhatsApp
                </>
              ) : (
                <>
                  <UsersIcon className="h-4 w-4 mr-2" />
                  Invitar contacto
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
