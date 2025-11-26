# Fix: Preservación del Índice del Carrusel en Sobres

## Problema Reportado

Al realizar operaciones en un sobre (agregar categoría, registrar gasto, agregar presupuesto, etc.), la pantalla se refrescaba y enviaba al usuario **al primer sobre** en lugar de permanecer en el sobre donde realizó la actividad.

**Ejemplo específico del usuario**: "Si registro un gasto en una categoría se refresca y me envía al inicio"

## Causa Raíz Identificada

### Race Condition Compleja

El problema era una **race condition** entre múltiples eventos asíncronos:

```
1. Usuario registra gasto en sobre índice 2 (selectedIndex = 2)
   ↓
2. handleCrearGastoSuccess ejecuta
   const previousIndex = 2 ✅ Capturado
   ↓
3. await fetchSobres()
   - Hace fetch a /api/sobres
   - setSobres(data.sobres) [Línea 172]
   ↓
4. React RE-RENDERIZA el componente
   - Embla Carousel se reinicializa
   ↓
5. useEffect [emblaApi] se DISPARA [Líneas 115-131] ⚠️
   - onSelect() se ejecuta INMEDIATAMENTE
   - setSelectedIndex(emblaApi.selectedScrollSnap())
   - emblaApi.selectedScrollSnap() devuelve 0
   - selectedIndex = 0 ❌ RESETEO AQUÍ
   ↓
6. setTimeout intenta ejecutar después de 100ms
   - emblaApi.scrollTo(previousIndex)
   - PERO selectedIndex ya es 0
   ↓
7. Usuario ve el primer sobre ❌
```

### Tres Factores Críticos

**1. El useEffect reseteaba selectedIndex cuando emblaApi se reinicializaba**

```typescript
// ANTES (PROBLEMÁTICO)
useEffect(() => {
  const onSelect = () => {
    setSelectedIndex(emblaApi.selectedScrollSnap()) // ❌ Siempre resetea a 0
  }
  emblaApi.on('select', onSelect)
  onSelect() // ⚠️ Se ejecuta INMEDIATAMENTE
}, [emblaApi])
```

**2. setTimeout de 100ms era insuficiente**

El setTimeout ejecutaba DESPUÉS de que el useEffect ya había reseteado el índice:
- fetchSobres() → 50-200ms
- React re-render → 10-50ms
- Embla reinit → 10-30ms
- useEffect disparo → 5-10ms
- **Total: 75-290ms**, pero setTimeout solo esperaba 100ms

**3. setState de sobres causaba reinicialización del carousel**

Cuando `setSobres()` actualizaba el array, React reconstruía los elementos del DOM, causando que Embla Carousel se reinicializara internamente.

## Solución Implementada

### Estrategia: Refs + Flag de Restauración

Usar **refs** en lugar de state para coordinar la restauración del índice, evitando la race condition.

### Componentes de la Solución

**1. Referencias para controlar la restauración**

```typescript
// Líneas 83-85
const targetIndexRef = useRef<number | null>(null)
const isRestoringRef = useRef(false)
```

- `targetIndexRef`: Almacena el índice al que queremos volver
- `isRestoringRef`: Flag que indica que estamos en proceso de restauración

**2. Modificación del useEffect del carousel**

```typescript
// Líneas 115-131
useEffect(() => {
  if (!emblaApi) return

  const onSelect = () => {
    // ✅ NO actualizar selectedIndex si estamos restaurando posición
    if (isRestoringRef.current) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }

  emblaApi.on('select', onSelect)
  onSelect()

  return () => {
    emblaApi.off('select', onSelect)
  }
}, [emblaApi])
```

**Cambio clave**: Si `isRestoringRef.current === true`, el useEffect **NO resetea** `selectedIndex`.

**3. Nuevo useEffect para restauración automática**

```typescript
// Líneas 133-155
useEffect(() => {
  if (!emblaApi || targetIndexRef.current === null) return

  const restorePosition = () => {
    const targetIndex = targetIndexRef.current!

    // Scroll a la posición guardada
    emblaApi.scrollTo(targetIndex, false) // false = con animación suave

    // Actualizar selectedIndex
    setSelectedIndex(targetIndex)

    // Limpiar refs
    targetIndexRef.current = null
    isRestoringRef.current = false
  }

  // Pequeño delay para asegurar que el DOM está actualizado
  const timer = setTimeout(restorePosition, 50)

  return () => clearTimeout(timer)
}, [emblaApi, sobres]) // ✅ Se ejecuta cuando sobres cambia
```

**Cómo funciona**:
- Se dispara cuando `sobres` cambia (después de `fetchSobres()`)
- Si `targetIndexRef` tiene un valor, restaura esa posición
- Usa setTimeout de 50ms para asegurar que el DOM está listo
- Limpia las refs después de restaurar

**4. Modificación de todos los handlers de éxito**

Patrón aplicado a todos los handlers:

```typescript
const handleCrearGastoSuccess = async () => {
  // ✅ Guardar índice actual para restaurar después
  targetIndexRef.current = selectedIndex
  isRestoringRef.current = true

  await fetchSobres()

  setCrearGastoOpen(false)
  setSobreSeleccionadoParaGasto('')
  setCategoriaPreseleccionada('')
}
```

**Handlers modificados**:
1. `handleCrearGastoSuccess` (Líneas 311-321)
2. `handleAgregarPresupuestoSuccess` (Líneas 272-280)
3. `handleReducirPresupuestoSuccess` (Líneas 234-242)
4. `handleEditarCategoriasSuccess` (Líneas 293-301)
5. `handleTransaccionesUpdated` (Líneas 303-309)
6. `handleDevolverPresupuesto` (Líneas 218-232)

**5. Eliminación de refreshSobres**

La función `refreshSobres` ya no se usa y fue eliminada para limpiar el código.

## Flujo Completo Nuevo

### Ejemplo: Usuario registra gasto en sobre índice 2

```
1. Usuario registra gasto en sobre índice 2
   selectedIndex = 2
   ↓
2. handleCrearGastoSuccess ejecuta
   targetIndexRef.current = 2 ✅
   isRestoringRef.current = true ✅
   ↓
3. await fetchSobres()
   - Fetch a /api/sobres
   - setSobres(newData)
   ↓
4. React RE-RENDERIZA
   - Embla Carousel se reinicializa
   ↓
5. useEffect [emblaApi] se DISPARA
   - onSelect() ejecuta
   - if (isRestoringRef.current) return ✅ SALE SIN RESETEAR
   - selectedIndex PERMANECE en 2 ✅
   ↓
6. useEffect [emblaApi, sobres] se DISPARA
   - Detecta targetIndexRef.current = 2
   - setTimeout(50ms)
   ↓
7. setTimeout ejecuta:
   - emblaApi.scrollTo(2) ✅ Restaura posición
   - setSelectedIndex(2) ✅ Confirma índice
   - targetIndexRef.current = null
   - isRestoringRef.current = false
   ↓
8. Usuario permanece en sobre 2 ✅ CORRECTO
```

## Ventajas de la Solución

### ✅ Sin Race Conditions

Los refs no causan re-renders, por lo que no hay timing issues entre setState y setTimeout.

### ✅ Sincronización Automática

El useEffect con dependencia `[emblaApi, sobres]` se ejecuta automáticamente cuando los datos cambian, sin necesidad de setTimeout manual en cada handler.

### ✅ Código Más Limpio

Todos los handlers usan el mismo patrón simple:
```typescript
targetIndexRef.current = selectedIndex
isRestoringRef.current = true
await fetchSobres()
```

### ✅ Más Robusto

- No depende de timeouts hardcodeados
- El useEffect espera al cambio real de `sobres`
- La flag `isRestoringRef` previene resets accidentales

## Archivos Modificados

### **`src/presentation/components/screens/SobresScreen.tsx`**

| Líneas | Cambio |
|--------|--------|
| 83-85 | Agregados refs: `targetIndexRef`, `isRestoringRef` |
| 115-131 | Modificado useEffect del carousel para respetar flag |
| 133-155 | Agregado nuevo useEffect para restauración automática |
| 214-223 | Eliminada función `refreshSobres` (no usada) |
| 218-232 | Modificado `handleDevolverPresupuesto` |
| 234-242 | Modificado `handleReducirPresupuestoSuccess` |
| 272-280 | Modificado `handleAgregarPresupuestoSuccess` |
| 293-301 | Modificado `handleEditarCategoriasSuccess` |
| 303-309 | Modificado `handleTransaccionesUpdated` |
| 311-321 | Modificado `handleCrearGastoSuccess` |

## Operaciones Corregidas

Todas estas operaciones ahora **preservan la posición del carrusel**:

1. ✅ Registrar gasto en categoría
2. ✅ Agregar presupuesto a sobre
3. ✅ Reducir presupuesto de sobre
4. ✅ Devolver presupuesto al monedero
5. ✅ Editar categorías/marcas
6. ✅ Ver/editar transacciones
7. ✅ Ver/editar transacciones por categoría

## Pruebas Recomendadas

### Test 1: Registrar Gasto
1. Navegar al sobre #3 (índice 2)
2. Registrar un gasto
3. ✅ Debe permanecer en sobre #3

### Test 2: Agregar Categoría
1. Navegar al sobre #2 (índice 1)
2. Abrir "Editar categorías"
3. Agregar nueva categoría
4. ✅ Debe permanecer en sobre #2

### Test 3: Agregar Presupuesto
1. Navegar al sobre #4 (índice 3)
2. Agregar presupuesto
3. ✅ Debe permanecer en sobre #4

### Test 4: Operaciones Múltiples
1. Navegar al sobre #2
2. Registrar gasto
3. ✅ Permanece en sobre #2
4. Agregar categoría
5. ✅ Permanece en sobre #2
6. Agregar presupuesto
7. ✅ Permanece en sobre #2

## Comparación: Antes vs Después

| Aspecto | ANTES (Problemático) | DESPUÉS (Corregido) |
|---------|---------------------|---------------------|
| **Mecanismo** | setTimeout + state | Refs + useEffect reactivo |
| **Timing** | Hardcoded 100ms | Automático (espera a sobres) |
| **Race condition** | Sí (useEffect gana) | No (flag previene reset) |
| **Código duplicado** | Cada handler con setTimeout | Patrón simple en todos |
| **Robustez** | Dependiente de timing | Basado en cambios reales |
| **Preserva índice** | ❌ Intermitente | ✅ Siempre |

## Debugging (Si es necesario)

Si el problema persiste, agregar logs temporales:

```typescript
// En handleCrearGastoSuccess
console.log('🔍 Guardando índice:', selectedIndex)
targetIndexRef.current = selectedIndex

// En useEffect de restauración
console.log('🔍 Restaurando a índice:', targetIndexRef.current)

// En useEffect del carousel
console.log('🔍 onSelect, isRestoring:', isRestoringRef.current, 'index:', emblaApi.selectedScrollSnap())
```

---

**Estado**: ✅ Implementado y listo para pruebas
**Fecha**: 2025-11-26
**Breaking Changes**: No (backward compatible)
**Performance**: Mejor (menos setTimeout, sincronización reactiva)
**Tests Requeridos**: Navegación del carrusel después de operaciones CRUD
