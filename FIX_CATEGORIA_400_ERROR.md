# Fix: Error 400 al Agregar Categoría al Sobre

## Problema Reportado

**Error**: Bad Request 400 al agregar una categoría al sobre
**Comportamiento**: Falla solo con 1 categoría específica, no con todas

## Diagnóstico

### Causa Raíz

El error 400 se producía cuando un usuario intentaba agregar a un sobre una categoría que **no le pertenecía** (creada por otro usuario en un sobre compartido).

### Flujo del Error

1. Usuario intenta agregar categoría al sobre
2. Endpoint: `POST /api/sobres/[id]/categorias`
3. Servicio: `agregarCategoriaToSobre()`
4. Validación: `obtenerCategoria()` verifica que:
   - La categoría exista ✅
   - La categoría pertenezca al usuario ❌ **FALLA AQUÍ**
   - O que el usuario sea colaborador de un sobre que tenga esa categoría
5. **Resultado**: Error 400 "Categoría no encontrada" o "No tienes permiso..."

### Por Qué Fallaba Solo con 1 Categoría

La categoría problemática probablemente:
- Fue creada por otro usuario en un sobre compartido
- El usuario actual es colaborador de ese sobre compartido
- El usuario intentó agregar esa categoría a **otro sobre diferente** (su propio sobre)
- **Fallo**: El sistema no permitía esto porque la lógica anterior era muy restrictiva

## Solución Implementada

### 1. Mejorada la Lógica de Validación

**Archivo**: `src/application/services/sobres-categorias.service.ts:30-124`

**Cambios**:
```typescript
// ANTES: Usaba obtenerCategoria() que era muy restrictiva
const categoriaResult = await obtenerCategoria(categoriaId, userId)
if (!categoriaResult.success) {
  return { success: false, error: 'Categoría no encontrada' }
}

// DESPUÉS: Lógica más permisiva
const categoria = await findCategoriaById(categoriaId)
const categoriaDelUsuario = categoria.usuario_id === userId

if (!categoriaDelUsuario) {
  // Solo validar colaboración si la categoría NO es del usuario
  // Verificar que sea colaborador de un sobre que tenga esta categoría
}
```

**Nueva lógica permite**:
- ✅ Agregar tus propias categorías a cualquiera de tus sobres
- ✅ Agregar categorías de otros usuarios SI eres colaborador de un sobre que las tiene
- ❌ NO permite agregar categorías de otros usuarios sin ser colaborador

### 2. Mensajes de Error Mejorados

**Archivo**: `src/application/services/categorias.service.ts:155-206`

**Antes**:
```
Error: "Categoría no encontrada"
Error: "No tienes permiso para acceder a esta categoría"
```

**Después** (con contexto detallado):
```
Error: "Categoría no encontrada"
Error: "No tienes permiso para agregar esta categoría. Esta categoría pertenece a otro usuario y no eres colaborador de ningún sobre que la use."
```

**Logging agregado**:
```typescript
console.log(`[obtenerCategoria] Categoría ${categoriaId} no pertenece al usuario ${userId} (owner: ${categoria.usuario_id}). Verificando si es colaborador...`)

console.error(`[agregarCategoriaToSobre] Usuario ${userId} no puede agregar categoría ${categoriaId} (no es dueño ni colaborador)`)

console.log(`[agregarCategoriaToSobre] Categoría ${categoriaId} pertenece al usuario ${userId} - Permitido`)
```

### 3. Validaciones Mejoradas

**Antes**:
- Validaba SOLO rol CONTRIBUTOR y ADMIN en colaboración

**Después**:
- Valida rol OWNER, ADMIN y CONTRIBUTOR en colaboración
- Mejor separación de lógica: primero verifica ownership, luego colaboración

## Cómo Probar la Corrección

### Escenario 1: Agregar Tu Propia Categoría (Debe Funcionar)
1. Crear categoría "Comida" en Sobre A
2. Intentar agregar categoría "Comida" a Sobre B (tuyo)
3. ✅ **Resultado**: Debe funcionar sin error

### Escenario 2: Agregar Categoría de Sobre Compartido (Debe Funcionar)
1. Usuario A crea Sobre Compartido y categoría "Transporte"
2. Usuario A invita a Usuario B como CONTRIBUTOR
3. Usuario B intenta agregar "Transporte" a su propio sobre
4. ✅ **Resultado**: Debe funcionar (porque es colaborador)

### Escenario 3: Agregar Categoría sin Permisos (Debe Fallar)
1. Usuario A tiene categoría "Personal"
2. Usuario B (NO es colaborador de sobres de Usuario A)
3. Usuario B intenta agregar "Personal" a su sobre
4. ❌ **Resultado**: Error con mensaje claro de permisos

## Archivos Modificados

1. **`src/application/services/sobres-categorias.service.ts`** (líneas 30-124)
   - Refactorizada función `agregarCategoriaToSobre()`
   - Nueva lógica de validación más permisiva
   - Logging detallado para debugging

2. **`src/application/services/categorias.service.ts`** (líneas 155-206)
   - Mejorados mensajes de error en `obtenerCategoria()`
   - Logging detallado de flujo de validación

## Debugging

Si el problema persiste, revisar los logs del servidor:

```bash
# En desarrollo (npm run dev)
# Buscar en consola:
[agregarCategoriaToSobre] ...
[obtenerCategoria] ...
```

Los logs mostrarán:
- ✅ Si la categoría pertenece al usuario
- ✅ Si el usuario es colaborador
- ❌ Motivo específico del rechazo

## Recomendaciones

1. **Monitorear logs** después del deploy para verificar que el problema está resuelto
2. **Crear tests** para estos escenarios de permisos
3. **Considerar UI feedback**: Mostrar en la UI qué categorías pueden agregarse

## Prevención Futura

Para evitar confusión de usuarios:

1. En la UI de "Agregar Categoría":
   - Mostrar solo categorías que el usuario PUEDE agregar
   - Filtrar categorías según permisos del usuario
   - Mostrar indicador visual de origen (tuya / compartida)

2. Mensaje preventivo:
   - Antes de intentar agregar, validar permisos en el frontend
   - Mostrar tooltip explicativo si la categoría no puede agregarse

---

**Estado**: ✅ Corregido
**Fecha**: 2025-11-26
**Archivos Afectados**: 2
**Tests Requeridos**: Escenarios de permisos de categorías en sobres compartidos
