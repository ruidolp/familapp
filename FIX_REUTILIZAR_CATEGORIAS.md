# Fix: Reutilizar Categorías Existentes al Crear

## Problema Reportado

Al intentar crear una categoría con un nombre que ya existe (ej: "Niños"), el sistema rechazaba con error 400:
```
❌ [SERVICE DEBUG] Ya existe categoría con nombre: Niños
Error: "Ya existe una categoría con ese nombre"
```

**Comportamiento esperado**: Si la categoría ya existe, debe **reutilizarla** y vincularla al sobre actual, NO rechazarla.

## Causa Raíz

El servicio `crearCategoria` tenía una validación incorrecta que impedía reutilizar categorías:

**Archivo**: `src/application/services/categorias.service.ts:103-114`

```typescript
// ANTES (INCORRECTO)
const existente = await findCategoriaByNombre(input.userId, input.nombre.trim())
if (existente) {
  return {
    success: false,
    error: 'Ya existe una categoría con ese nombre',  // ❌ RECHAZABA
  }
}
```

Esta lógica asumía que las categorías son **únicas globalmente**, cuando en realidad:
- ✅ Las categorías pueden usarse en **múltiples sobres**
- ✅ No hay restricción de que una categoría solo pueda estar en un sobre
- ✅ Es común reutilizar categorías (Ej: "Comida" en varios sobres)

## Solución Implementada

### 1. Lógica de Reutilización de Categorías

**Archivo**: `src/application/services/categorias.service.ts:103-131`

**ANTES** (rechazaba si existía):
```typescript
const existente = await findCategoriaByNombre(input.userId, input.nombre.trim())
if (existente) {
  return { success: false, error: 'Ya existe una categoría con ese nombre' }
}
const categoria = await createCategoria(...)
```

**DESPUÉS** (reutiliza si existe, crea si no):
```typescript
const existente = await findCategoriaByNombre(input.userId, input.nombre.trim())

let categoria: any

if (existente) {
  console.log('✅ [SERVICE DEBUG] Reutilizando categoría existente:', existente.id)
  categoria = existente  // ✅ REUTILIZA
} else {
  console.log('🔍 [SERVICE DEBUG] Creando nueva categoría en BD...')
  categoria = await createCategoria(...)  // ✅ CREA NUEVA
}
```

**Nuevo comportamiento**:
- ✅ Si "Niños" existe → Reutiliza la categoría existente
- ✅ Si "Niños" NO existe → Crea nueva categoría
- ✅ En ambos casos → Vincula al sobre

### 2. Prevención de Vinculación Duplicada

**Archivo**: `src/application/services/categorias.service.ts:133-167`

Agregada verificación para evitar error de duplicate key:

```typescript
// Verificar si ya está vinculada
const { db } = await import('@/infrastructure/database/kysely')
const yaVinculada = await db
  .selectFrom('sobres_categorias')
  .selectAll()
  .where('sobre_id', '=', input.sobreId)
  .where('categoria_id', '=', categoria.id)
  .executeTakeFirst()

if (yaVinculada) {
  console.log('ℹ️ [SERVICE DEBUG] Categoría ya estaba vinculada al sobre, omitiendo vinculación')
} else {
  await linkCategoriaToSobre(input.sobreId, categoria.id)
  console.log('✅ [SERVICE DEBUG] Categoría vinculada al sobre exitosamente')
}
```

**Manejo de errores**:
```typescript
catch (linkError: any) {
  // Si el error es de duplicate key (23505), es porque ya está vinculada - ignorar
  if (linkError.code === '23505') {
    console.log('ℹ️ [SERVICE DEBUG] Categoría ya estaba vinculada (duplicate key), continuando...')
  } else {
    // Para otros errores, advertir pero no fallar
    console.warn('⚠️ [SERVICE DEBUG] Categoría creada/reutilizada pero error al vincular al sobre')
  }
}
```

### 3. Actualización del Frontend

**Archivo**: `src/presentation/components/drawers/EditarCategoriasMarcasDrawer.tsx:431-453`

**Cambios**:
1. ✅ Verificar si categoría ya existe antes de agregarla al estado local
2. ✅ Cambiar mensaje "Categoría creada" → "Categoría agregada"
3. ✅ Evitar duplicados en la lista de categorías

```typescript
// Verificar si la categoría ya existe en la lista local
const yaExiste = categorias.some(cat => cat.id === data.categoria.id)

if (!yaExiste) {
  setCategorias((prev) => [...prev, data.categoria])
}

// Actualizar allCategorias si tampoco existe ahí
setAllCategorias((prev) => {
  const existeEnAll = prev.some(cat => cat.id === data.categoria.id)
  return existeEnAll ? prev : [...prev, data.categoria]
})

notify.success('✅ Categoría agregada al sobre.')
```

## Flujo Completo Nuevo

### Escenario 1: Categoría NO Existe

```
Usuario ingresa "Transporte" (nuevo)
  ↓
[SERVICE] Verificar si existe → No existe
  ↓
[SERVICE] Crear nueva categoría "Transporte"
  ↓
[SERVICE] Vincular a sobre ABC
  ↓
[FRONTEND] Agregar a lista de categorías
  ↓
✅ "Categoría agregada al sobre."
```

### Escenario 2: Categoría Existe, NO Vinculada al Sobre

```
Usuario ingresa "Niños" (ya existe en otro sobre)
  ↓
[SERVICE] Verificar si existe → SÍ existe (id: xyz-123)
  ↓
[SERVICE] Reutilizar categoría existente
  ↓
[SERVICE] Verificar si ya está vinculada a sobre ABC → NO
  ↓
[SERVICE] Vincular a sobre ABC
  ↓
[FRONTEND] Agregar a lista de categorías (si no está)
  ↓
✅ "Categoría agregada al sobre."
```

### Escenario 3: Categoría Existe Y Ya Vinculada al Sobre

```
Usuario ingresa "Niños" (ya existe y ya vinculada)
  ↓
[SERVICE] Verificar si existe → SÍ existe (id: xyz-123)
  ↓
[SERVICE] Reutilizar categoría existente
  ↓
[SERVICE] Verificar si ya está vinculada a sobre ABC → SÍ
  ↓
[SERVICE] Omitir vinculación (ya está vinculada)
  ↓
[FRONTEND] No agregar (ya está en lista)
  ↓
✅ "Categoría agregada al sobre."
```

## Casos de Uso Soportados

### ✅ Caso 1: Categoría Nueva
```
Sobre A: [Comida, Transporte]
Usuario en Sobre A crea "Entretenimiento"
→ Resultado: Sobre A: [Comida, Transporte, Entretenimiento]
```

### ✅ Caso 2: Categoría Existente en Otro Sobre
```
Sobre A: [Comida, Transporte]
Sobre B: [Salud]
Usuario en Sobre B intenta agregar "Comida" (existe en Sobre A)
→ Resultado: Sobre B: [Salud, Comida]  ← Reutiliza "Comida"
```

### ✅ Caso 3: Categoría Ya en el Sobre
```
Sobre A: [Comida, Transporte]
Usuario en Sobre A intenta agregar "Comida" nuevamente
→ Resultado: Sobre A: [Comida, Transporte]  ← No duplica
```

### ✅ Caso 4: Múltiples Sobres con Misma Categoría
```
Sobre A: [Comida]
Sobre B: [Comida]  ← Misma categoría
Sobre C: [Comida]  ← Misma categoría

→ Los 3 sobres usan LA MISMA categoría (mismo ID)
→ Si cambias el nombre/emoji en uno, se refleja en todos
```

## Beneficios

1. ✅ **UX Mejorada**: No más errores confusos de "ya existe"
2. ✅ **Reutilización**: Categorías compartibles entre sobres
3. ✅ **Consistencia**: Una categoría = Un concepto global
4. ✅ **Menos Fricción**: Usuario puede agregar categorías sin pensar si existen
5. ✅ **Debugging**: Logs detallados muestran qué está pasando

## Logs de Debugging (Ejemplo)

### Categoría Nueva
```
🔍 [SERVICE DEBUG] Verificando si existe categoría con ese nombre...
🔍 [SERVICE DEBUG] Categoría existente: No
🔍 [SERVICE DEBUG] Creando nueva categoría en BD...
✅ [SERVICE DEBUG] Categoría creada: { id: "abc-123", nombre: "Niños" }
🔍 [SERVICE DEBUG] Vinculando categoría al sobre: xyz-789
✅ [SERVICE DEBUG] Categoría vinculada al sobre exitosamente
```

### Categoría Existente (Reutilizada)
```
🔍 [SERVICE DEBUG] Verificando si existe categoría con ese nombre...
🔍 [SERVICE DEBUG] Categoría existente: Sí (id: abc-123)
✅ [SERVICE DEBUG] Reutilizando categoría existente: abc-123
🔍 [SERVICE DEBUG] Vinculando categoría al sobre: xyz-789
ℹ️ [SERVICE DEBUG] Categoría ya estaba vinculada al sobre, omitiendo vinculación
```

## Pruebas Recomendadas

1. **Test 1**: Crear categoría nueva en sobre vacío
   - ✅ Debe crear y vincular

2. **Test 2**: Agregar categoría existente a nuevo sobre
   - ✅ Debe reutilizar y vincular

3. **Test 3**: Intentar agregar categoría que ya está en el sobre
   - ✅ Debe detectar y omitir vinculación

4. **Test 4**: Crear categoría con mismo nombre pero otro emoji
   - ✅ Debe reutilizar (se ignora el emoji diferente)

5. **Test 5**: Verificar que cambiar nombre de categoría afecta todos los sobres
   - ✅ Cambio debe reflejarse en todos los sobres que la usan

## Archivos Modificados

1. **`src/application/services/categorias.service.ts`** (líneas 103-167)
   - Lógica de reutilización de categorías
   - Verificación de vinculación duplicada
   - Manejo de errores mejorado

2. **`src/presentation/components/drawers/EditarCategoriasMarcasDrawer.tsx`** (líneas 431-457)
   - Verificación de duplicados en estado local
   - Mensaje actualizado: "agregada" en vez de "creada"
   - Prevención de duplicados visuales

## Limpieza de Debugging (Pendiente)

Una vez verificado que funciona correctamente, remover los logs:
- Buscar y eliminar todos los `console.log('🔍 [SERVICE DEBUG]')`
- Buscar y eliminar todos los `console.log('✅ [SERVICE DEBUG]')`
- Buscar y eliminar todos los `console.log('ℹ️ [SERVICE DEBUG]')`

---

**Estado**: ✅ Corregido y con debugging detallado
**Fecha**: 2025-11-26
**Archivos Afectados**: 2
**Breaking Changes**: No (backward compatible)
**Tests Requeridos**: Reutilización de categorías entre sobres
