# Sistema de Compartir Sobres - Frontend Completado

## ✅ Componentes Creados

### 1. Vista de Invitaciones (`InvitationsManager`)
**Ubicación**: `src/presentation/components/sobres/invitations-manager.tsx`
**Página**: `src/app/[locale]/invitations/page.tsx`

**Características:**
- ✅ Tabs: Recibidas / Enviadas
- ✅ Lista de invitaciones pendientes con detalles
- ✅ Botones Aceptar / Rechazar
- ✅ Información del invitador (avatar, nombre, email)
- ✅ Detalles del sobre (nombre, emoji, rol asignado)
- ✅ Ventajas de aceptar
- ✅ Contador de invitaciones pendientes en badge
- ✅ Loading states y error handling
- ✅ Auto-refresh al aceptar/rechazar

**Uso:**
```tsx
import { InvitationsManager } from '@/presentation/components/sobres/invitations-manager'

// En una página
<InvitationsManager />

// O navegación directa
router.push('/invitations')
```

**Ruta**: `http://localhost:3000/invitations`

---

### 2. Dialog de Invitar Usuario (`InviteUserDialog`)
**Ubicación**: `src/presentation/components/sobres/invite-user-dialog.tsx`

**Características:**
- ✅ Input para email o teléfono con detección automática
- ✅ Select de rol (Colaborador / Solo lectura)
- ✅ Validación de formato
- ✅ Generación de link único si usuario no existe
- ✅ Botón copiar link al portapapeles
- ✅ Notificación de invitación enviada
- ✅ Loading states

**Uso:**
```tsx
import { InviteUserDialog } from '@/presentation/components/sobres/invite-user-dialog'

const [inviteOpen, setInviteOpen] = useState(false)

// Abrir desde menú del sobre (3 puntos)
<InviteUserDialog
  open={inviteOpen}
  onOpenChange={setInviteOpen}
  sobreId={sobre.id}
  sobreNombre={sobre.nombre}
  sobreEmoji={sobre.emoji}
/>
```

**Integración en menú de sobre:**
```tsx
// En el menú de 3 puntos del sobre
<DropdownMenuItem onClick={() => setInviteOpen(true)}>
  <UserPlus className="h-4 w-4 mr-2" />
  Invitar
</DropdownMenuItem>
```

---

### 3. Dialog Post-Onboarding (`PostOnboardingInvitationsDialog`)
**Ubicación**: `src/presentation/components/sobres/post-onboarding-invitations-dialog.tsx`

**Características:**
- ✅ Muestra invitaciones pendientes después del onboarding
- ✅ Múltiples invitaciones en una sola vista
- ✅ Información detallada de cada invitación
- ✅ Botones Aceptar / Crear mi propio
- ✅ Botón "Decidir después"
- ✅ Auto-close cuando se procesen todas
- ✅ Indicador de sobres base (HOGAR/PERSONAL)

**Uso:**
```tsx
import { PostOnboardingInvitationsDialog } from '@/presentation/components/sobres/post-onboarding-invitations-dialog'

// Después del onboarding
const result = await initializeUserProfile(userId, locale, t)

// Si hay invitaciones, mostrar dialog
{result.data?.invitaciones && result.data.invitaciones.length > 0 && (
  <PostOnboardingInvitationsDialog
    invitaciones={result.data.invitaciones}
    open={showInvitations}
    onOpenChange={setShowInvitations}
  />
)}
```

**Integración sugerida:**
```tsx
// En el componente de onboarding o redirect post-onboarding
useEffect(() => {
  const checkInvitations = async () => {
    const res = await fetch('/api/sobres/invitations')
    const data = await res.json()

    if (data.invitaciones?.length > 0) {
      setShowInvitationsDialog(true)
    }
  }

  checkInvitations()
}, [])
```

---

### 4. Badge de Compartido (`SharedBadge`)
**Ubicación**: `src/presentation/components/sobres/shared-badge.tsx`

**Características:**
- ✅ Badge simple con ícono de usuarios
- ✅ Variante secondary
- ✅ Opcional: mostrar/ocultar ícono
- ✅ Soporte de className custom

**Uso:**
```tsx
import { SharedBadge } from '@/presentation/components/sobres/shared-badge'

// En tarjeta de sobre
{sobre.is_compartido && <SharedBadge />}

// Sin ícono
{sobre.is_compartido && <SharedBadge showIcon={false} />}

// Con clase custom
{sobre.is_compartido && <SharedBadge className="ml-2" />}
```

**Ejemplo en SobreCard:**
```tsx
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle>{sobre.nombre}</CardTitle>
      {sobre.is_compartido && <SharedBadge />}
    </div>
  </CardHeader>
</Card>
```

---

### 5. Transacción con Usuario (`TransactionItemWithUser`)
**Ubicación**: `src/presentation/components/sobres/transaction-item-with-user.tsx`

**Características:**
- ✅ Avatar del usuario que creó la transacción
- ✅ Badge con nombre si no es el usuario actual
- ✅ Categoría y subcategoría
- ✅ Fecha relativa (hace X minutos)
- ✅ Monto con colores (rojo/verde)
- ✅ Hover effect
- ✅ onClick opcional
- ✅ Mostrar/ocultar fecha

**Uso:**
```tsx
import { TransactionItemWithUser } from '@/presentation/components/sobres/transaction-item-with-user'

// Lista de transacciones
{transacciones.map((tx) => (
  <TransactionItemWithUser
    key={tx.id}
    transaction={tx}
    currentUserId={session.user.id}
    onClick={() => handleTransactionClick(tx.id)}
    showDate={true}
  />
))}
```

**Ejemplo completo:**
```tsx
const [transacciones, setTransacciones] = useState([])

useEffect(() => {
  const fetchTransacciones = async () => {
    const res = await fetch(`/api/sobres/${sobreId}/transacciones`)
    const data = await res.json()
    setTransacciones(data.transacciones)
  }

  fetchTransacciones()
}, [sobreId])

return (
  <div className="space-y-2">
    {transacciones.map((tx) => (
      <TransactionItemWithUser
        key={tx.id}
        transaction={tx}
        currentUserId={session.user.id}
      />
    ))}
  </div>
)
```

---

## 📝 Integración Completa

### A. Agregar Link a Invitaciones en Menú Principal

```tsx
// En navigation o drawer
<Link href="/invitations">
  <Button variant="ghost">
    <Mail className="h-4 w-4 mr-2" />
    Invitaciones
    {invitacionesCount > 0 && (
      <Badge variant="destructive" className="ml-2">
        {invitacionesCount}
      </Badge>
    )}
  </Button>
</Link>
```

### B. Agregar Botón "Invitar" en Sobre

```tsx
// En el componente de tarjeta de sobre
import { useState } from 'react'
import { InviteUserDialog } from '@/presentation/components/sobres/invite-user-dialog'

const [inviteDialogOpen, setInviteDialogOpen] = useState(false)

// En el menú de 3 puntos
<DropdownMenu>
  <DropdownMenuTrigger>
    <MoreVertical className="h-4 w-4" />
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => setInviteDialogOpen(true)}>
      <UserPlus className="h-4 w-4 mr-2" />
      Invitar
    </DropdownMenuItem>
    {/* Otros items del menú */}
  </DropdownMenuContent>
</DropdownMenu>

<InviteUserDialog
  open={inviteDialogOpen}
  onOpenChange={setInviteDialogOpen}
  sobreId={sobre.id}
  sobreNombre={sobre.nombre}
  sobreEmoji={sobre.emoji}
/>
```

### C. Mostrar Dialog Post-Onboarding

```tsx
// En el componente después del onboarding
import { useEffect, useState } from 'react'
import { PostOnboardingInvitationsDialog } from '@/presentation/components/sobres/post-onboarding-invitations-dialog'

const [invitations, setInvitations] = useState([])
const [showDialog, setShowDialog] = useState(false)

useEffect(() => {
  const fetchInvitations = async () => {
    try {
      const res = await fetch('/api/sobres/invitations')
      if (res.ok) {
        const data = await res.json()
        if (data.invitaciones?.length > 0) {
          setInvitations(data.invitaciones)
          setShowDialog(true)
        }
      }
    } catch (error) {
      console.error('Error fetching invitations:', error)
    }
  }

  fetchInvitations()
}, [])

return (
  <>
    {/* Tu contenido */}

    <PostOnboardingInvitationsDialog
      invitaciones={invitations}
      open={showDialog}
      onOpenChange={setShowDialog}
    />
  </>
)
```

### D. Usar Badge "Compartido"

```tsx
import { SharedBadge } from '@/presentation/components/sobres/shared-badge'

// En la tarjeta del sobre
<Card>
  <CardHeader>
    <div className="flex items-center gap-2">
      <h3>{sobre.nombre}</h3>
      {sobre.is_compartido && <SharedBadge />}
    </div>
  </CardHeader>
</Card>
```

### E. Mostrar Transacciones con Usuario

```tsx
import { TransactionItemWithUser } from '@/presentation/components/sobres/transaction-item-with-user'
import { useSession } from 'next-auth/react'

const { data: session } = useSession()

// En la lista de transacciones
<div className="space-y-2">
  {transacciones.map((transaction) => (
    <TransactionItemWithUser
      key={transaction.id}
      transaction={transaction}
      currentUserId={session?.user?.id}
      onClick={() => router.push(`/transacciones/${transaction.id}`)}
    />
  ))}
</div>
```

---

## 🎨 Dependencias UI Necesarias

Todos los componentes usan componentes de `shadcn/ui`:

- ✅ `Dialog`
- ✅ `Card`
- ✅ `Button`
- ✅ `Avatar`
- ✅ `Badge`
- ✅ `Input`
- ✅ `Select`
- ✅ `Tabs`
- ✅ `Skeleton`
- ✅ `Label`
- ✅ `DropdownMenu`

Asegúrate de tener instalados:
```bash
npx shadcn-ui@latest add dialog card button avatar badge input select tabs skeleton label dropdown-menu
```

---

## 🔧 Hooks Necesarios

Los componentes usan:
- `useToast` - Para notificaciones
- `useRouter` - Para navegación
- `useState` / `useEffect` - State management

---

## 📱 Testing Manual

### 1. Vista de Invitaciones
1. Navegar a `/invitations`
2. Verificar que se muestren invitaciones pendientes
3. Hacer clic en "Aceptar" → debe unirse al sobre y refrescar
4. Hacer clic en "Crear mi propio" → debe crear sobre y refrescar

### 2. Invitar Usuario
1. Abrir sobre → menú 3 puntos → "Invitar"
2. Ingresar email existente → debe enviar invitación
3. Ingresar email nuevo → debe mostrar link para copiar
4. Verificar notificaciones toast

### 3. Post-Onboarding
1. Crear cuenta nueva con email que tiene invitación pendiente
2. Completar onboarding
3. Debe mostrar dialog con invitaciones
4. Aceptar/rechazar → debe actualizar sobres

### 4. Badge Compartido
1. Crear sobre compartido
2. Verificar que aparezca badge "Compartido"

### 5. Transacciones con Usuario
1. En sobre compartido, crear gasto
2. Otro usuario crea gasto
3. Verificar que se muestre avatar y nombre del usuario que gastó

---

## 🚀 Próximos Pasos (Opcional)

1. **Notificaciones por Email**: Implementar envío de emails cuando se invita
2. **Push Notifications**: Notificaciones móviles para invitaciones
3. **Vista de Participantes**: Mostrar todos los participantes de un sobre
4. **Gestión de Permisos**: Cambiar rol de participantes
5. **Remover Participantes**: Permitir al owner remover usuarios

---

## ✅ Checklist Final

- [x] Migración de base de datos aplicada
- [x] Queries de backend funcionando
- [x] API endpoints implementados
- [x] Servicio de templates creado
- [x] Onboarding inteligente
- [x] Vista de invitaciones creada
- [x] Dialog de invitar creado
- [x] Dialog post-onboarding creado
- [x] Badge de compartido creado
- [x] Componente de transacción con usuario creado
- [x] Query de transacciones enriquecida
- [ ] Integración en sobres existentes
- [ ] Testing end-to-end
- [ ] Documentación de usuario final

---

## 📞 Soporte

Si tienes problemas:
1. Verificar que la migración 033 esté aplicada
2. Verificar que los endpoints de API respondan correctamente
3. Revisar logs de consola para errores
4. Verificar que session.user.id esté disponible

**¡El sistema está listo para usar!** 🎉
