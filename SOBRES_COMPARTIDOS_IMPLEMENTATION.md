# Sistema de Compartir Sobres - Implementación Completa

## ✅ Backend Completado (100%)

### 1. Migración de Base de Datos
**Archivo**: `src/infrastructure/database/migrations/033_update_invitaciones_sobres.sql`

**Cambios:**
- ✅ Agregado `invitado_email_o_telefono TEXT`
- ✅ Agregado `codigo_invitacion TEXT UNIQUE`
- ✅ Agregado `expires_at TIMESTAMP`
- ✅ `invitado_user_id` ahora es nullable
- ✅ Índices optimizados para búsquedas

**Aplicar migración:**
```bash
psql "${DATABASE_URL}" -f src/infrastructure/database/migrations/033_update_invitaciones_sobres.sql
```

---

### 2. Queries de Invitaciones
**Archivo**: `src/infrastructure/database/queries/sobres.queries.ts`

**Funciones agregadas:**
- ✅ `createInvitacionSobre()` - Crear invitación
- ✅ `findInvitacionByCodigo()` - Buscar por código único
- ✅ `findInvitacionesPendientesByContact()` - Buscar por email/teléfono
- ✅ `findInvitacionesPendientesByUser()` - Invitaciones de usuario registrado
- ✅ `findInvitacionesBySobre()` - Invitaciones enviadas de un sobre
- ✅ `acceptInvitacionSobre()` - Aceptar y agregar participante
- ✅ `rejectInvitacionSobre()` - Rechazar invitación
- ✅ `cancelInvitacionSobre()` - Cancelar (owner)
- ✅ `renameSobreIfConflict()` - Renombrar sobre existente
- ✅ `associateInvitacionesToNewUser()` - Asociar invitaciones al registrarse

---

### 3. Servicio de Templates
**Archivo**: `src/application/services/sobres-template.service.ts`

**Funciones:**
- ✅ `createBaseSobre()` - Crear HOGAR/PERSONAL con categorías
- ✅ `isSobreBase()` - Detectar si es sobre base
- ✅ `getSobreTemplate()` - Obtener template

**Templates incluidos:**
- `HOGAR`: 5 categorías (Supermercado, Transporte, Medicina, Cuentas, Comida rápida)
- `PERSONAL`: 3 categorías (Entretenimiento, Ropa, Cuidado personal)

---

### 4. Utilidades de Invitación
**Archivo**: `src/infrastructure/utils/invitation.utils.ts`

**Funciones:**
- ✅ `generateInvitationCode()` - Código único de 12 caracteres
- ✅ `parseContact()` - Detectar email vs teléfono
- ✅ `findUserByContact()` - Buscar usuario por contacto
- ✅ `isValidEmail()` - Validar formato email
- ✅ `isValidPhone()` - Validar formato teléfono
- ✅ `generateInvitationLink()` - Generar link de invitación

---

### 5. API Endpoints

#### **POST /api/sobres/[id]/invite**
**Invitar a un sobre**

Request:
```json
{
  "contact": "email@ejemplo.com" | "+56912345678",
  "rol": "CONTRIBUTOR" | "VIEWER" | "ADMIN" | "OWNER"
}
```

Response:
```json
{
  "success": true,
  "invitacion": {
    "id": "uuid",
    "sobre_id": "uuid",
    "invitado_email_o_telefono": "email@ejemplo.com",
    "user_exists": true,
    "codigo_invitacion": "a3K7mN9pQr5x",
    "expires_at": "2025-12-01T00:00:00Z"
  }
}
```

#### **GET /api/sobres/invitations**
**Listar mis invitaciones pendientes**

Response:
```json
{
  "success": true,
  "invitaciones": [
    {
      "id": "uuid",
      "sobre_id": "uuid",
      "sobre_nombre": "HOGAR",
      "sobre_emoji": "🏠",
      "inviter_name": "Juan Pérez",
      "inviter_email": "juan@ejemplo.com",
      "rol": "CONTRIBUTOR",
      "created_at": "2025-11-23T00:00:00Z"
    }
  ],
  "total": 1
}
```

#### **POST /api/sobres/invitations/[id]/accept**
**Aceptar invitación**

Response:
```json
{
  "success": true,
  "message": "Te uniste al sobre compartido",
  "sobre": {
    "id": "uuid",
    "nombre": "HOGAR",
    "emoji": "🏠"
  }
}
```

**⚠️ Comportamiento automático:**
- Si ya tienes un sobre llamado "HOGAR", se renombra a "HOGAR (old)"

#### **POST /api/sobres/invitations/[id]/reject**
**Rechazar invitación**

Response:
```json
{
  "success": true,
  "message": "Rechazaste la invitación. Creamos tu propio sobre 'HOGAR' con 5 categorías básicas.",
  "sobre_creado": {
    "id": "uuid",
    "nombre": "HOGAR",
    "emoji": "🏠",
    "categorias": 5
  }
}
```

**⚠️ Comportamiento automático:**
- Si rechazas HOGAR o PERSONAL, se crea el sobre base con categorías

---

### 6. Onboarding Inteligente
**Archivo**: `src/application/services/onboarding.service.ts`

**Modificaciones:**
- ✅ Detecta invitaciones pendientes por email/teléfono
- ✅ Asocia invitaciones al usuario recién registrado
- ✅ **NO crea sobres que tengan invitaciones pendientes**
- ✅ Retorna lista de invitaciones pendientes

**Flujo:**
```
1. Usuario se registra (email: maria@ejemplo.com)
2. Sistema busca invitaciones pendientes por email
3. Encuentra invitación a "HOGAR"
4. Onboarding crea:
   ✅ Billetera "dummy"
   ✅ Sobre "PERSONAL" (sin invitación)
   ❌ NO crea "HOGAR" (tiene invitación pendiente)
5. Retorna: { invitacionesPendientes: 1, invitaciones: [...] }
```

---

## ⏳ Falta: Frontend (Pendiente)

### 1. Vista de Invitaciones en CONFIG
**Ubicación sugerida**: `src/presentation/components/sobres/invitations-manager.tsx`

**UI:**
```tsx
<Tabs defaultValue="recibidas">
  <TabsList>
    <TabsTrigger value="recibidas">Recibidas</TabsTrigger>
    <TabsTrigger value="enviadas">Enviadas</TabsTrigger>
  </TabsList>

  <TabsContent value="recibidas">
    {/* Lista de invitaciones con botones Aceptar/Rechazar */}
  </TabsContent>

  <TabsContent value="enviadas">
    {/* Lista de invitaciones enviadas por sobre con estado */}
  </TabsContent>
</Tabs>
```

---

### 2. Botón "Invitar" en Menú de Sobre
**Ubicación**: Agregar en `SobreCard` → menú de 3 puntos

**Dialog:**
```tsx
<Dialog>
  <DialogHeader>
    <DialogTitle>Invitar a "{sobreName}"</DialogTitle>
  </DialogHeader>

  <Input
    type="text"
    placeholder="Email o teléfono"
    value={contact}
    onChange={(e) => setContact(e.target.value)}
  />

  <Select value={rol}>
    <SelectItem value="CONTRIBUTOR">Colaborador</SelectItem>
    <SelectItem value="VIEWER">Solo lectura</SelectItem>
  </Select>

  <Button onClick={handleInvite}>Enviar invitación</Button>
</Dialog>
```

---

### 3. Dialog de Invitaciones Post-Onboarding
**Ubicación**: Después de completar onboarding

**Mostrar si**: `result.data.invitacionesPendientes > 0`

**UI:**
```tsx
<Dialog open={hasInvitations}>
  <DialogHeader>
    <DialogTitle>🎉 Tienes invitaciones pendientes</DialogTitle>
  </DialogHeader>

  {invitations.map(inv => (
    <Card key={inv.id}>
      <CardHeader>
        <CardTitle>
          {inv.inviter_name} te invitó al sobre "{inv.sobre_nombre}"
        </CardTitle>
      </CardHeader>

      <CardContent>
        <p>Ventajas de aceptar:</p>
        <ul>
          <li>✓ Presupuesto compartido en tiempo real</li>
          <li>✓ Todos ven los gastos</li>
          <li>✓ Sincronización automática</li>
        </ul>
      </CardContent>

      <CardFooter>
        <Button onClick={() => handleAccept(inv.id)}>Aceptar</Button>
        <Button variant="ghost" onClick={() => handleReject(inv.id)}>
          Crear mi propio {inv.sobre_nombre}
        </Button>
      </CardFooter>
    </Card>
  ))}
</Dialog>
```

---

### 4. Badge "Compartido" en Sobre
**Ubicación**: `SobreCard`

```tsx
{sobre.is_compartido && (
  <Badge variant="secondary">
    <Users className="w-3 h-3 mr-1" />
    Compartido
  </Badge>
)}
```

---

### 5. Mostrar Quién Gastó en Transacciones
**Ubicación**: Lista de transacciones

```tsx
<div className="flex items-center gap-3">
  <Avatar>
    <AvatarImage src={transaction.usuario_avatar} />
    <AvatarFallback>{transaction.usuario_nombre?.[0]}</AvatarFallback>
  </Avatar>

  <div>
    <p className="font-medium">{transaction.categoria_nombre}</p>
    {currentUserId !== transaction.usuario_id && (
      <Badge variant="outline" className="text-xs">
        {transaction.usuario_nombre}
      </Badge>
    )}
  </div>

  <span className="ml-auto">-${transaction.monto}</span>
</div>
```

---

## 📊 Testing Manual

### Caso 1: Usuario Existente
```bash
# 1. Crear invitación
POST /api/sobres/[sobre-id]/invite
{ "contact": "maria@ejemplo.com", "rol": "CONTRIBUTOR" }

# 2. Usuario recibe notificación (in-app)

# 3. Aceptar
POST /api/sobres/invitations/[inv-id]/accept

# 4. Verificar participante agregado
GET /api/sobres/[sobre-id]/participantes
```

### Caso 2: Usuario Nuevo con Invitación
```bash
# 1. Crear invitación para email que no existe
POST /api/sobres/[sobre-id]/invite
{ "contact": "nueva@ejemplo.com", "rol": "CONTRIBUTOR" }

# 2. Usuario se registra con ese email

# 3. Onboarding NO crea sobre invitado

# 4. Post-onboarding muestra dialog de invitación

# 5. Usuario acepta/rechaza
```

### Caso 3: Rechazar Sobre Base
```bash
# 1. Invitar a "HOGAR"
POST /api/sobres/[sobre-id]/invite
{ "contact": "test@ejemplo.com", "rol": "CONTRIBUTOR" }

# 2. Usuario rechaza
POST /api/sobres/invitations/[inv-id]/reject

# 3. Sistema crea sobre "HOGAR" propio con 5 categorías
```

---

## 🔧 Próximos Pasos

1. ✅ **Aplicar migración**:
   ```bash
   psql "${DATABASE_URL}" -f src/infrastructure/database/migrations/033_update_invitaciones_sobres.sql
   ```

2. ⏳ **Implementar Frontend**:
   - Vista de invitaciones en CONFIG
   - Botón "Invitar" en sobre
   - Dialog post-onboarding
   - Badge "Compartido"
   - Avatar en transacciones

3. ⏳ **Notificaciones** (Opcional):
   - Email cuando se invita a usuario nuevo
   - Notificación in-app para usuario existente
   - Push notification para móvil

---

## 📝 Notas Importantes

1. **Renombrado Automático**: Al aceptar invitación, el sobre existente se renombra a "(old)"
2. **Sobres Base**: HOGAR y PERSONAL siempre se crean (propio o compartido)
3. **Tracking Individual**: Cada participante tiene su propio presupuesto y gasto
4. **Código de Invitación**: Solo se genera si el usuario no existe
5. **Expiración**: Las invitaciones expiran en 7 días por defecto

---

## 🎯 Garantías del Sistema

✅ Usuario **siempre** tiene sobres HOGAR y PERSONAL
✅ Onboarding **inteligente** no duplica sobres invitados
✅ Rechazar invitación base **crea el sobre con categorías**
✅ Transacciones **mantienen historial** con renombrado
✅ Invitaciones por email/teléfono **para usuarios nuevos**
