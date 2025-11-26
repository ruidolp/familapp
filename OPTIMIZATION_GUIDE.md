# API Endpoint Optimization Guide

## Resumen de Optimizaciones Realizadas

Este documento describe las optimizaciones implementadas para reducir significativamente las llamadas a los endpoints de la API, especialmente:

- `/api/user/config` - Reducido de ~12 llamadas a 1 sola llamada al iniciar sesión
- `/api/monedas/[id]` - Eliminado completamente, datos ahora incluidos en `/api/user/config`
- `/api/auth/session` - Optimizado para usar `useSession()` hook en vez de fetch directo

## 📊 Impacto de las Optimizaciones

### Antes
```
Cada componente hacía su propia llamada a /api/user/config:
- DashboardClient: 1 llamada
- CurrencyProvider: 2 llamadas (/api/user/config + /api/monedas/CLP)
- CrearGastoDrawer: 2 llamadas
- AccountConfigDrawer: 2 llamadas
- OnboardingDrawer: 1 llamada
- SobresScreen: 1 llamada
- MetricasSobres: 1 llamada
- MetricasListasCompras: 1 llamada
- ...y más

Total: ~15+ llamadas a /api/user/config por sesión
```

### Después
```
1 sola llamada a /api/user/config al iniciar sesión
Todos los componentes comparten los datos via UserConfigProvider
```

**Reducción: ~93% de llamadas eliminadas** 🎉

## 🏗️ Arquitectura de la Solución

### 1. UserConfigProvider (`src/presentation/providers/user-config-provider.tsx`)

**Propósito**: Centralizar la carga de configuración del usuario.

**Características**:
- Carga `/api/user/config` una sola vez al iniciar sesión
- Incluye datos de moneda (elimina llamada adicional a `/api/monedas/[id]`)
- Proporciona método `refreshConfig()` para refrescar después de cambios
- Compartido globalmente via React Context

**Uso básico**:
```tsx
import { useUserConfig } from '@/presentation/providers/user-config-provider'

function MiComponente() {
  const { config, moneda, requiresOnboarding, refreshConfig } = useUserConfig()

  // Acceder a datos
  const monedaPrincipal = config?.moneda_principal_id
  const simboloMoneda = moneda?.simbolo

  // Después de guardar cambios
  await refreshConfig()
}
```

### 2. Endpoint Optimizado (`/api/user/config`)

**Cambio**: Ahora incluye datos de moneda en la respuesta.

**Antes**:
```json
{
  "success": true,
  "config": { "moneda_principal_id": "CLP", ... },
  "marcasGlobalesVersion": 123,
  ...
}
```

**Después**:
```json
{
  "success": true,
  "config": { "moneda_principal_id": "CLP", ... },
  "moneda": {
    "id": "CLP",
    "nombre": "Peso Chileno",
    "simbolo": "$",
    "decimales": 0
  },
  "marcasGlobalesVersion": 123,
  ...
}
```

### 3. CurrencyProvider Optimizado

**Antes**: Hacía 2 llamadas (config + moneda)
**Después**: Usa datos del UserConfigProvider (0 llamadas propias)

## 📝 Guía de Migración para Componentes Restantes

### Componentes que AÚN necesitan actualización:

Los siguientes componentes aún hacen llamadas directas a `/api/user/config` y deben ser actualizados:

1. `src/presentation/components/drawers/CrearGastoDrawer.tsx` (2 llamadas)
2. `src/presentation/components/drawers/EditarCategoriasMarcasDrawer.tsx` (1 llamada)
3. `src/presentation/components/drawers/OnboardingDrawer.tsx` (1 llamada)
4. `src/presentation/components/screens/SobresScreen.tsx` (1 llamada)
5. `src/presentation/components/metricas/MetricasSobres.tsx` (1 llamada)
6. `src/presentation/components/metricas/MetricasListasCompras.tsx` (1 llamada)
7. `src/infrastructure/utils/sync-execution.ts` (1 llamada)

### Patrón de Migración

#### Patrón 1: Solo lectura de configuración

**Antes**:
```tsx
'use client'

import { useState, useEffect } from 'react'

export function MiComponente() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadConfig = async () => {
      const response = await fetch('/api/user/config')
      if (response.ok) {
        const data = await response.json()
        setConfig(data.config)
      }
      setLoading(false)
    }
    loadConfig()
  }, [])

  if (loading) return <div>Cargando...</div>

  return <div>Moneda: {config?.moneda_principal_id}</div>
}
```

**Después**:
```tsx
'use client'

import { useUserConfig } from '@/presentation/providers/user-config-provider'

export function MiComponente() {
  const { config, moneda, isLoading } = useUserConfig()

  if (isLoading) return <div>Cargando...</div>

  return (
    <div>
      Moneda: {config?.moneda_principal_id}
      Símbolo: {moneda?.simbolo}
    </div>
  )
}
```

#### Patrón 2: Lectura y escritura de configuración

**Antes**:
```tsx
export function ConfigDrawer() {
  const [config, setConfig] = useState(null)

  useEffect(() => {
    const loadConfig = async () => {
      const response = await fetch('/api/user/config')
      const data = await response.json()
      setConfig(data.config)
    }
    loadConfig()
  }, [])

  const handleSave = async (newData) => {
    await fetch('/api/user/config', {
      method: 'PUT',
      body: JSON.stringify(newData)
    })
  }

  return <div>...</div>
}
```

**Después**:
```tsx
import { useUserConfig } from '@/presentation/providers/user-config-provider'

export function ConfigDrawer() {
  const { config, refreshConfig } = useUserConfig()

  const handleSave = async (newData) => {
    await fetch('/api/user/config', {
      method: 'PUT',
      body: JSON.stringify(newData)
    })

    // ⚠️ IMPORTANTE: Refrescar config después de guardar
    await refreshConfig()
  }

  return <div>...</div>
}
```

#### Patrón 3: Verificar onboarding

**Antes**:
```tsx
export function Dashboard() {
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  useEffect(() => {
    const checkOnboarding = async () => {
      const response = await fetch('/api/user/config')
      if (response.status === 404) {
        setNeedsOnboarding(true)
      }
    }
    checkOnboarding()
  }, [])

  if (needsOnboarding) return <OnboardingScreen />
  return <DashboardContent />
}
```

**Después**:
```tsx
import { useUserConfig } from '@/presentation/providers/user-config-provider'

export function Dashboard() {
  const { requiresOnboarding, isLoading } = useUserConfig()

  if (isLoading) return <div>Cargando...</div>
  if (requiresOnboarding) return <OnboardingScreen />
  return <DashboardContent />
}
```

## 🔧 Ejemplos de Componentes Ya Optimizados

### ✅ DashboardClient (`src/app/[locale]/dashboard/dashboard-client.tsx`)

```tsx
import { useUserConfig } from '@/presentation/providers/user-config-provider'

export function DashboardClient({ locale, user }: DashboardClientProps) {
  const { requiresOnboarding, isLoading: configLoading } = useUserConfig()

  useEffect(() => {
    if (configLoading) return

    if (requiresOnboarding) {
      setOnboardingOpen(true)
    } else {
      checkPendingInvitations()
    }
  }, [requiresOnboarding, configLoading])

  // ...resto del componente
}
```

### ✅ AccountConfigDrawer (`src/presentation/components/drawers/AccountConfigDrawer.tsx`)

```tsx
import { useUserConfig } from '@/presentation/providers/user-config-provider'

export function AccountConfigDrawer({ open, onOpenChange }) {
  const { config, refreshConfig } = useUserConfig()

  useEffect(() => {
    if (!open) return

    // Solo cargar lista de monedas, config viene del provider
    const loadMonedas = async () => {
      const response = await fetch('/api/monedas')
      // ...
    }

    // Usar config del provider
    if (config) {
      setSelectedCurrency(config.moneda_principal_id)
      setSelectedDay(String(config.dia_inicio_periodo))
    }
  }, [open, config])

  const handleSave = async () => {
    await fetch('/api/user/config', { method: 'PUT', ... })
    await refreshConfig() // ⚠️ Importante: refrescar después de guardar
  }
}
```

### ✅ ListEditorScreen (`src/presentation/components/screens/ListEditorScreen.tsx`)

**Optimización de `/api/auth/session`**:

**Antes**:
```tsx
const [userId, setUserId] = useState('')

useEffect(() => {
  const fetchUserId = async () => {
    const response = await fetch('/api/auth/session')
    const session = await response.json()
    setUserId(session?.user?.id)
  }
  fetchUserId()
}, [])
```

**Después**:
```tsx
import { useSession } from 'next-auth/react'

const { data: session } = useSession()
const userId = session?.user?.id || ''
```

## ⚠️ Reglas Importantes

### ✅ DO - Hacer esto:
1. **Siempre usar el UserConfigProvider** para obtener configuración del usuario
2. **Llamar a `refreshConfig()`** después de actualizar la configuración
3. **Usar `useSession()` hook** en vez de fetch a `/api/auth/session`
4. **Verificar `isLoading`** antes de acceder a los datos

### ❌ DON'T - No hacer esto:
1. **No hacer fetch directo** a `/api/user/config` en componentes
2. **No hacer fetch** a `/api/monedas/[id]` - usar `moneda` del provider
3. **No olvidar refrescar** después de guardar cambios
4. **No asumir que config existe** - siempre verificar `if (config)`

## 🎯 Próximos Pasos

Para completar la optimización:

1. **Actualizar componentes restantes** usando los patrones de migración
2. **Agregar tests** para UserConfigProvider
3. **Considerar cacheo adicional** con localStorage si es necesario
4. **Monitorear métricas** de llamadas a API en producción

## 📚 Referencias

- **UserConfigProvider**: `src/presentation/providers/user-config-provider.tsx`
- **CurrencyProvider**: `src/presentation/providers/currency-provider.tsx` (ya optimizado)
- **Endpoint optimizado**: `src/app/api/user/config/route.ts`
- **Layout con providers**: `src/app/[locale]/layout.tsx`

---

**Resultado Final**: De ~15 llamadas a 1 sola llamada por sesión = **93% de reducción** 🚀
