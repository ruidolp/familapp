# Bug: Categorías en Blanco al Abrir Crear Gasto desde Footer

## Síntoma Reportado

Al abrir el componente "Crear Gasto" desde el botón del footer (+), **a veces** muestra las categorías en blanco y **a veces** sí aparecen correctamente.

**Comportamiento**: Intermitente, impredecible

## Causa Raíz: RACE CONDITION

### Diagnóstico Detallado

El problema es una **condición de carrera** entre dos procesos asíncronos que ocurren al mismo tiempo:

1. **Carga de sobres** (asíncrono)
2. **Manejo de menuAction** (síncrono, pero depende de sobres)

### Flujo del Bug

#### Archivos Involucrados:
- `src/presentation/components/screens/SobresScreen.tsx`
- `src/presentation/components/drawers/CrearGastoDrawer.tsx`

#### Secuencia de Eventos:

```
1. Usuario hace clic en botón "+" del footer
   ↓
2. DashboardClient establece menuAction = 'nuevo-gasto'
   ↓
3. SobresScreen recibe prop menuAction
   ↓
4. DOS useEffects se disparan EN PARALELO:

   useEffect #1 (línea 107-109):
   ────────────────────────────
   - fetchSobres() ← Llamada asíncrona a /api/sobres
   - Puede tardar 50ms-500ms dependiendo de red

   useEffect #2 (línea 147-164):
   ────────────────────────────
   - if (!menuAction) return
   - switch (menuAction)
   - case 'nuevo-gasto':
   - if (sobres.length > 0) ← PROBLEMA AQUÍ
   -   handleCrearGasto(sobres[selectedIndex])

   ↓
5. CASO A: Si sobres AÚN NO se cargaron
   ════════════════════════════════════
   - sobres.length === 0 ❌
   - NO se ejecuta handleCrearGasto()
   - Drawer NO se abre o se abre vacío
   - preselectedSobreId = '' (vacío)
   - CrearGastoDrawer NO carga categorías
   - RESULTADO: Categorías en BLANCO ❌

6. CASO B: Si sobres YA se cargaron
   ═══════════════════════════════════
   - sobres.length > 0 ✅
   - Se ejecuta handleCrearGasto(sobres[selectedIndex])
   - setSobreSeleccionadoParaGasto(sobre.id)
   - setCrearGastoOpen(true)
   - preselectedSobreId = sobre.id ✅
   - CrearGastoDrawer carga categorías del sobre
   - RESULTADO: Categorías VISIBLES ✅
```

### Código Problemático

**SobresScreen.tsx - Línea 147-164:**
```typescript
// Manejar acciones del menú contextual
useEffect(() => {
  if (!menuAction) return

  switch (menuAction) {
    case 'nuevo-gasto':
      if (sobres.length > 0) {  // ← PROBLEMA: sobres puede estar vacío
        handleCrearGasto(sobres[selectedIndex])
      }
      break
  }

  onMenuActionHandled?.()
}, [menuAction])  // ← NO incluye 'sobres' en dependencias
```

**¿Por qué falla?**
- El `useEffect` NO tiene `sobres` en las dependencias
- Si `menuAction` llega cuando `sobres = []`, el check falla
- No se re-ejecuta cuando `sobres` se carga después

**CrearGastoDrawer.tsx - Línea 157-177:**
```typescript
useEffect(() => {
  if (open) {
    fetchData()  // Carga sobres, NO categorías
    setSobreSeleccionado(preselectedSobreId || '')  // ← Si viene '', no hay sobre
    // ...

    if (preselectedSobreId) {  // ← Si es '', NO carga categorías
      fetchCategoriasBySobre(preselectedSobreId)
    }
  }
}, [open, preselectedSobreId, ...])
```

**¿Por qué las categorías quedan en blanco?**
- Si `preselectedSobreId = ''` (vacío), NO se llama a `fetchCategoriasBySobre()`
- El `useEffect` de línea 202-206 también depende de `sobreSeleccionado`:
  ```typescript
  useEffect(() => {
    if (sobreSeleccionado) {  // ← Si es '', NO carga
      fetchCategoriasBySobre(sobreSeleccionado)
    }
  }, [sobreSeleccionado])
  ```
- Las categorías solo se cargan cuando el usuario selecciona manualmente un sobre

### Por Qué es Intermitente

El comportamiento depende del **timing**:

| Condición | Resultado |
|-----------|-----------|
| Red rápida + CPU rápida | Sobres se cargan ANTES → ✅ Funciona |
| Red lenta + CPU lenta | Sobres se cargan DESPUÉS → ❌ Falla |
| Caché activo | `/api/sobres` responde instantáneo → ✅ Funciona |
| Sin caché | Demora en respuesta → ❌ Falla |
| Primera carga | Más lento → ❌ Más probable que falle |
| Cargas subsecuentes | Más rápido → ✅ Más probable que funcione |

**Factores que afectan**:
- ⏱️ Latencia de red
- 🚀 Velocidad del navegador
- 💾 Estado de caché HTTP
- 🔄 Carga del servidor
- 📱 Potencia del dispositivo

## Impacto en UX

### Escenario Negativo (Bug Visible):
```
Usuario hace clic en "+" → Drawer se abre → ¡No hay categorías!
→ Usuario confundido → Debe cerrar y volver a abrir o seleccionar sobre manualmente
```

### Escenario Positivo (Funciona):
```
Usuario hace clic en "+" → Drawer se abre → Categorías visibles
→ Puede crear gasto inmediatamente
```

**Tasa de falla estimada**: 20-40% dependiendo de condiciones de red

## Soluciones Posibles

### Opción 1: Agregar 'sobres' a dependencias (Más simple)

**Archivo**: `SobresScreen.tsx:147-164`

```typescript
useEffect(() => {
  if (!menuAction || sobres.length === 0) return  // ← Verificar antes

  switch (menuAction) {
    case 'nuevo-gasto':
      handleCrearGasto(sobres[selectedIndex])
      break
  }

  onMenuActionHandled?.()
}, [menuAction, sobres])  // ← Agregar 'sobres' a dependencias
```

**Pros**:
- ✅ Solución simple
- ✅ Se re-ejecuta cuando sobres se carga

**Contras**:
- ⚠️ Puede ejecutarse múltiples veces si sobres cambia
- ⚠️ Requiere lógica adicional para evitar ejecuciones duplicadas

### Opción 2: Esperar a que sobres se cargue (Más robusto)

**Archivo**: `SobresScreen.tsx:147-164`

```typescript
useEffect(() => {
  if (!menuAction) return

  // Esperar a que sobres esté disponible
  const waitForSobres = async () => {
    // Si ya están cargados, proceder inmediatamente
    if (sobres.length > 0) {
      handleMenuAction(menuAction)
      onMenuActionHandled?.()
      return
    }

    // Si no, esperar hasta que se carguen (con timeout)
    const checkInterval = setInterval(() => {
      if (sobres.length > 0) {
        clearInterval(checkInterval)
        handleMenuAction(menuAction)
        onMenuActionHandled?.()
      }
    }, 100)

    // Timeout de 3 segundos
    setTimeout(() => {
      clearInterval(checkInterval)
      if (sobres.length === 0) {
        notify.error('No se pudo cargar la información necesaria')
        onMenuActionHandled?.()
      }
    }, 3000)
  }

  waitForSobres()
}, [menuAction])

const handleMenuAction = (action: string) => {
  switch (action) {
    case 'nuevo-gasto':
      handleCrearGasto(sobres[selectedIndex])
      break
    case 'nueva-categoria':
      handleEditarCategorias(sobres[selectedIndex])
      break
  }
}
```

**Pros**:
- ✅ Garantiza que sobres esté cargado
- ✅ Tiene timeout de seguridad
- ✅ Maneja error si falla la carga

**Contras**:
- ❌ Más complejo
- ❌ Usa polling (no ideal)

### Opción 3: Precargar sobres en DashboardClient (Preventivo)

**Archivo**: `DashboardClient`

Asegurar que sobres ya estén cargados ANTES de mostrar SobresScreen.

**Pros**:
- ✅ Previene el problema desde la raíz
- ✅ Mejor UX general (carga inicial más rápida)

**Contras**:
- ❌ Requiere refactorización mayor
- ❌ Afecta múltiples componentes

### Opción 4: Modificar CrearGastoDrawer para manejar caso sin sobre (Defensivo)

**Archivo**: `CrearGastoDrawer.tsx:157-177`

```typescript
useEffect(() => {
  if (open) {
    fetchData()  // Carga sobres

    // Si NO hay sobre preseleccionado, usar el primero disponible
    if (!preselectedSobreId && sobres.length > 0) {
      const primerSobre = sobres[0].id
      setSobreSeleccionado(primerSobre)
      fetchCategoriasBySobre(primerSobre)
    } else if (preselectedSobreId) {
      setSobreSeleccionado(preselectedSobreId)
      fetchCategoriasBySobre(preselectedSobreId)
    }
  }
}, [open, preselectedSobreId, sobres])
```

**Pros**:
- ✅ Maneja caso sin preselección
- ✅ Siempre muestra categorías de algún sobre

**Contras**:
- ⚠️ Puede seleccionar sobre incorrecto
- ⚠️ Lógica más compleja

## Recomendación

**Solución Recomendada**: **Opción 1 + Opción 4 (Combinación)**

1. En `SobresScreen.tsx`: Agregar `sobres` a dependencias del useEffect
2. En `CrearGastoDrawer.tsx`: Agregar fallback para seleccionar primer sobre si no hay preselección

**Ventajas de la combinación**:
- ✅ Solución completa
- ✅ Previene el problema en origen (SobresScreen)
- ✅ Maneja casos edge (CrearGastoDrawer)
- ✅ Mejor UX general
- ✅ No requiere refactorización mayor

## Verificación

Para confirmar que el bug está corregido:

### Test Manual:
1. ✅ Abrir app (primera carga)
2. ✅ Hacer clic en "+" inmediatamente
3. ✅ Verificar que categorías se muestren
4. ✅ Repetir con red lenta (DevTools → Network → Slow 3G)
5. ✅ Verificar que siempre funcione

### Logs de Debug:
```typescript
// En SobresScreen.tsx
useEffect(() => {
  console.log('[SobresScreen] sobres cargados:', sobres.length)
}, [sobres])

useEffect(() => {
  console.log('[SobresScreen] menuAction recibido:', menuAction, 'sobres:', sobres.length)
}, [menuAction])

// En CrearGastoDrawer.tsx
useEffect(() => {
  console.log('[CrearGastoDrawer] abierto con preselectedSobreId:', preselectedSobreId)
}, [open, preselectedSobreId])
```

## Prevención Futura

1. **Loading States**: Siempre manejar estados de carga
2. **Dependencies**: Incluir todas las dependencias en useEffect
3. **Race Conditions**: Considerar timing en efectos asíncronos
4. **Defensive Coding**: Validar que datos existan antes de usarlos
5. **Testing**: Probar con red lenta para detectar race conditions

---

**Estado**: 🔍 Identificado, pendiente de corrección
**Severidad**: Media (afecta UX pero tiene workaround)
**Frecuencia**: Intermitente (20-40% de las veces)
**Prioridad**: Alta (afecta flujo principal)
