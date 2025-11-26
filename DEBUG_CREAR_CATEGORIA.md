# Guía de Debugging: Error 400 al Crear Categoría

## 🎯 Objetivo

Identificar la causa raíz del error 400 al hacer clic en "Crear" en el drawer de editar categorías y marcas.

## 🔍 Debugging Implementado

Se ha agregado logging exhaustivo en **4 niveles** del stack:

### 1. Frontend - EditarCategoriasMarcasDrawer.tsx (Líneas 370-451)

**Qué se loguea**:
```
🔍 [DEBUG] handleCreateCategoria iniciado
🔍 [DEBUG] canEdit: true/false
🔍 [DEBUG] sobreId: "abc-123-..."
🔍 [DEBUG] newCategoriaNombre: "Comida"
🔍 [DEBUG] newCategoriaEmoji: "🍔"
📤 [DEBUG] Request body: { nombre, emoji, sobreId }
🌐 [DEBUG] Enviando POST a /api/categorias...
📥 [DEBUG] Response status: 400
📥 [DEBUG] Response statusText: "Bad Request"
📥 [DEBUG] Response headers: {...}
❌ [DEBUG] Error response: { error: "..." }
```

**Además muestra un ALERT en pantalla** con todos los detalles del error.

### 2. Backend API - /api/categorias/route.ts (Líneas 59-136)

**Qué se loguea**:
```
🔍 [API DEBUG] POST /api/categorias iniciado
🔍 [API DEBUG] Session: Usuario: xyz-123 (user@email.com)
🔍 [API DEBUG] Body recibido: {...}
🔍 [API DEBUG] userId del session: xyz-123
🔍 [API DEBUG] Datos extraídos:
  - nombre: "Comida"
  - color: undefined
  - emoji: "🍔"
  - sobreId: "abc-123-..."
✅ [API DEBUG] Validaciones pasadas, llamando a crearCategoria...
🔍 [API DEBUG] Input para crearCategoria: {...}
🔍 [API DEBUG] Resultado de crearCategoria: { success, error, data }
```

### 3. Service Layer - categorias.service.ts (Líneas 84-167)

**Qué se loguea**:
```
🔍 [SERVICE DEBUG] crearCategoria iniciado
🔍 [SERVICE DEBUG] Input: {...}
🔍 [SERVICE DEBUG] Validando nombre...
✅ [SERVICE DEBUG] Nombre válido: "Comida"
🔍 [SERVICE DEBUG] Verificando nombre duplicado...
🔍 [SERVICE DEBUG] Categoría existente: Sí (id: xyz) / No
🔍 [SERVICE DEBUG] Creando categoría en BD...
🔍 [SERVICE DEBUG] Datos para crear: {...}
✅ [SERVICE DEBUG] Categoría creada: { id, nombre, emoji, usuario_id }
🔍 [SERVICE DEBUG] Vinculando categoría al sobre: abc-123
✅ [SERVICE DEBUG] Categoría vinculada al sobre exitosamente
```

### 4. Database Layer - categorias.queries.ts (Líneas 121-152)

**Qué se loguea**:
```
🔍 [QUERY DEBUG] linkCategoriaToSobre iniciado
🔍 [QUERY DEBUG] sobreId: abc-123
🔍 [QUERY DEBUG] categoriaId: xyz-456
🔍 [QUERY DEBUG] Valores a insertar: { sobre_id, categoria_id, created_at }
✅ [QUERY DEBUG] Vinculación exitosa: {...}
```

**Si hay error de BD**:
```
❌ [QUERY DEBUG] Error en linkCategoriaToSobre: {...}
❌ [QUERY DEBUG] Error code: 23505 (duplicate key)
❌ [QUERY DEBUG] Error detail: "Key (sobre_id, categoria_id)..."
❌ [QUERY DEBUG] Error constraint: "sobres_categorias_pkey"
```

## 🧪 Cómo Usar el Debugging

### Paso 1: Abrir Consola del Navegador

1. Presiona **F12** (Chrome/Firefox/Edge) o **Cmd+Option+I** (Mac)
2. Ve a la pestaña **Console**
3. Limpia la consola (botón 🚫 o Ctrl+L)

### Paso 2: Reproducir el Error

1. Abre el drawer "Editar categorías y marcas"
2. Escribe un nombre de categoría
3. Haz clic en "Crear"
4. **IMPORTANTE**: Se mostrará un ALERT con el error, toma screenshot

### Paso 3: Revisar Logs del Navegador

Verás una secuencia como esta:

```
🔍 [DEBUG] handleCreateCategoria iniciado
🔍 [DEBUG] canEdit: true
🔍 [DEBUG] sobreId: "clx123..."
🔍 [DEBUG] newCategoriaNombre: "Comida"
🔍 [DEBUG] newCategoriaEmoji: "🍔"
📤 [DEBUG] Request body: {
  "nombre": "Comida",
  "emoji": "🍔",
  "sobreId": "clx123..."
}
🌐 [DEBUG] Enviando POST a /api/categorias...
📥 [DEBUG] Response status: 400
📥 [DEBUG] Response statusText: Bad Request
❌ [DEBUG] Error response: {
  "error": "Ya existe una categoría con ese nombre"
}
```

**⚠️ COPIA TODO ESTE OUTPUT**

### Paso 4: Revisar Logs del Servidor (Vercel)

Si estás en producción (Vercel):

1. Ve a tu proyecto en Vercel Dashboard
2. Click en "Logs" o "Runtime Logs"
3. Filtra por tiempo reciente
4. Busca los logs que empiezan con `[API DEBUG]`, `[SERVICE DEBUG]`, `[QUERY DEBUG]`

Deberías ver:

```
[API DEBUG] POST /api/categorias iniciado
[API DEBUG] Session: Usuario: clx123 (user@example.com)
[API DEBUG] Body recibido: { nombre: "Comida", emoji: "🍔", sobreId: "clx456" }
[SERVICE DEBUG] crearCategoria iniciado
[SERVICE DEBUG] Verificando nombre duplicado...
[SERVICE DEBUG] Categoría existente: Sí (id: clx789)
❌ [API DEBUG] crearCategoria falló: Ya existe una categoría con ese nombre
```

**⚠️ COPIA ESTOS LOGS TAMBIÉN**

## 📋 Checklist de Información a Recopilar

Cuando veas el error 400, recopila:

- [ ] Screenshot del ALERT que aparece en pantalla
- [ ] Logs completos de la consola del navegador (desde 🔍 hasta 🏁)
- [ ] Logs del servidor de Vercel (si es producción)
- [ ] Estado del formulario:
  - [ ] Nombre de categoría ingresado
  - [ ] Emoji seleccionado
  - [ ] ID del sobre (se ve en los logs)
  - [ ] Rol del usuario (userRole prop)

## 🔎 Posibles Causas del Error 400

Basado en los logs, identifica cuál es la causa:

### Causa 1: Nombre Duplicado ✅ MÁS PROBABLE
```
[SERVICE DEBUG] Categoría existente: Sí (id: xyz)
Error: "Ya existe una categoría con ese nombre"
```
**Solución**: La categoría con ese nombre ya existe. Usar otro nombre.

### Causa 2: Error al Vincular al Sobre
```
[SERVICE DEBUG] Categoría creada: {...}
[SERVICE DEBUG] Vinculando categoría al sobre: abc-123
❌ [QUERY DEBUG] Error code: 23505
Error constraint: "sobres_categorias_pkey"
```
**Solución**: La categoría ya está vinculada al sobre (duplicate key).

### Causa 3: Sobre No Existe
```
❌ [QUERY DEBUG] Error code: 23503
Error constraint: "sobres_categorias_sobre_id_fkey"
```
**Solución**: El sobreId no existe en la base de datos.

### Causa 4: Permisos Insuficientes
```
❌ [DEBUG] No tiene permisos para crear
```
**Solución**: El userRole es VIEWER (no puede crear categorías).

### Causa 5: Nombre Vacío
```
❌ [DEBUG] Falta sobreId o nombre
```
**Solución**: El nombre está vacío después de trim().

### Causa 6: Sin Sesión
```
❌ [API DEBUG] Unauthorized - No hay sesión
```
**Solución**: La sesión expiró, reloguear.

## 📊 Ejemplo de Output Completo

### Caso Exitoso (Status 201)
```
🔍 [DEBUG] handleCreateCategoria iniciado
🔍 [DEBUG] canEdit: true
🔍 [DEBUG] sobreId: "clx123"
🔍 [DEBUG] newCategoriaNombre: "Snacks"
🔍 [DEBUG] newCategoriaEmoji: "🍿"
📤 [DEBUG] Request body: { "nombre": "Snacks", "emoji": "🍿", "sobreId": "clx123" }
🌐 [DEBUG] Enviando POST a /api/categorias...
📥 [DEBUG] Response status: 201
✅ [DEBUG] Success response: { "success": true, "categoria": {...} }
✅ [DEBUG] Categoría creada: {...}
🏁 [DEBUG] handleCreateCategoria finalizado
```

### Caso Fallido (Status 400)
```
🔍 [DEBUG] handleCreateCategoria iniciado
🔍 [DEBUG] canEdit: true
🔍 [DEBUG] sobreId: "clx123"
🔍 [DEBUG] newCategoriaNombre: "Comida"
🔍 [DEBUG] newCategoriaEmoji: "🍔"
📤 [DEBUG] Request body: { "nombre": "Comida", "emoji": "🍔", "sobreId": "clx123" }
🌐 [DEBUG] Enviando POST a /api/categorias...
📥 [DEBUG] Response status: 400
❌ [DEBUG] Error response: { "error": "Ya existe una categoría con ese nombre" }
❌ [DEBUG] Error completo: Status: 400
Error: Ya existe una categoría con ese nombre
Datos: {"nombre":"Comida","emoji":"🍔","sobreId":"clx123"}
❌ [DEBUG] Exception caught: Error: Ya existe una categoría con ese nombre
🏁 [DEBUG] handleCreateCategoria finalizado

[ALERT aparece en pantalla con este texto]
```

## 🎬 Próximos Pasos

1. **Reproduce el error** siguiendo los pasos de arriba
2. **Copia TODOS los logs** (navegador + servidor si es posible)
3. **Toma screenshot del ALERT**
4. **Envía toda la información** para análisis
5. **Identifica la causa** usando la sección "Posibles Causas"

## 🧹 Limpiar Debugging (Post-Fix)

Una vez identificada y corregida la causa raíz, remover los logs de debugging:

**Archivos a limpiar**:
- `EditarCategoriasMarcasDrawer.tsx:370-451`
- `/api/categorias/route.ts:59-136`
- `categorias.service.ts:84-167`
- `categorias.queries.ts:121-152`

**Buscar y remover**:
- Todos los `console.log('🔍 [DEBUG]')`
- Todos los `console.log('🔍 [API DEBUG]')`
- Todos los `console.log('🔍 [SERVICE DEBUG]')`
- Todos los `console.log('🔍 [QUERY DEBUG]')`
- La línea del `alert()` en el frontend

---

**Estado**: ✅ Debugging implementado, listo para probar
**Archivos modificados**: 4
**Logs agregados**: ~100 líneas de debugging detallado
**Visibilidad**: Frontend (alert + console) + Backend (Vercel logs)
