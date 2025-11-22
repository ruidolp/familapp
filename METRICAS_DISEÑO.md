# 📊 SISTEMA DE MÉTRICAS - DISEÑO COMPLETO

> **Documento de diseño para implementación futura del módulo de Métricas**
>
> **Última actualización:** 2024-11-21
> **Estado:** Diseño completado - Pendiente implementación

---

## 🎯 RESUMEN EJECUTIVO

Sistema de métricas con **desbloqueo progresivo** y **sistema de logros** para impulsar el engagement. Incluye optimización con IndexedDB y lazy loading para rendimiento óptimo.

### Objetivos:
1. ✅ Enganchar usuarios desde el día 1 con métricas básicas
2. ✅ Retener usuarios a largo plazo con métricas avanzadas bloqueadas
3. ✅ Optimizar rendimiento (módulo visible en footer)
4. ✅ Gamificar el uso con sistema de logros y hints

---

## 📊 MÉTRICAS - FASE 1 MVP

### **1. Top Categorías de Gasto**
- **Desbloqueo:** 3 transacciones en 2 categorías diferentes
- **Visualización:** Barras horizontales TOP 10
- **Filtros:** Período (mes/3m/6m/custom), Sobre específico
- **Endpoint:** `GET /api/metrics/spending-by-category`

### **2. Análisis de Compras (Listas)**
- **Desbloqueo:** 2 ejecuciones de compras completadas
- **Visualización:**
  - Barras: Top 5 tiendas donde más compras
  - Lista: Top 10 productos más comprados con precios min/max
- **Insights:** Ahorro potencial, mejor tienda por producto
- **Endpoint:** `GET /api/metrics/shopping-insights`

### **3. Burn Rate (Tasa de Quema)**
- **Desbloqueo:** 5 días de historia + 3 transacciones
- **Visualización:**
  - Número grande: Días restantes de presupuesto
  - Barra de progreso con alertas (verde/amarillo/rojo)
- **Endpoint:** `GET /api/metrics/burn-rate`

### **4. Proyección Fin de Mes**
- **Desbloqueo:** 12 días del mes actual + 8 transacciones
- **Visualización:** Gráfico de línea con área sombreada
  - Línea sólida: Gastos reales acumulados
  - Línea punteada: Proyección estadística (regresión lineal)
  - Área sombreada: Rango de confianza
- **Endpoint:** `GET /api/metrics/projection`

---

## 🏆 SISTEMA DE LOGROS

### Achievements Definidos:

```javascript
[
  {
    id: 'first-expense',
    name: '💸 Primer Gasto',
    description: 'Registraste tu primer gasto',
    requirements: { transactions_count: 1 },
    unlocks: [],
  },
  {
    id: 'categorizer',
    name: '📊 Organizador',
    description: 'Registra gastos en 2 categorías diferentes',
    requirements: { transactions_count: 3, categories_count: 2 },
    unlocks: ['spending-by-category'],
  },
  {
    id: 'shopper',
    name: '🛒 Comprador Inteligente',
    description: 'Completa 2 compras con listas',
    requirements: { shopping_executions: 2 },
    unlocks: ['shopping-insights'],
  },
  {
    id: 'week-warrior',
    name: '🔥 Semana Activa',
    description: 'Usa la app 5 días seguidos',
    requirements: { consecutive_days: 5 },
    unlocks: ['burn-rate'],
  },
  {
    id: 'forecaster',
    name: '🔮 Visionario',
    description: 'Acumula 12 días de historia',
    requirements: { days_active: 12, transactions_count: 8 },
    unlocks: ['projection'],
  },
  {
    id: 'master',
    name: '🏆 Maestro Financiero',
    description: 'Completa 21 días de uso',
    requirements: { days_active: 21, transactions_count: 12 },
    unlocks: ['health-score'],
  }
]
```

### Progresión del Usuario:

| Día | Acción | Métricas Desbloqueadas |
|-----|--------|------------------------|
| Día 1 | 1er gasto | 🔒 Todo bloqueado (gráficos dummy visibles con blur) |
| Día 3 | 3er gasto, 2 categorías | ✅ **Top Categorías** |
| Día 7 | 2da compra completada | ✅ **Análisis Compras** + **Burn Rate** |
| Día 12 | Uso continuo | ✅ **Proyección** |
| Día 21 | Usuario comprometido | ✅ **Health Score** (bonus fase 2) |

---

## 🎨 COMPONENTE DE DESBLOQUEO

### Visual del Estado Bloqueado:

```
┌─────────────────────────────────────┐
│ 📊 Top Categorías de Gasto          │
├─────────────────────────────────────┤
│ ┌─────────────────────────────┐    │
│ │ [Gráfico con datos dummy]   │    │  ← blur-sm + opacity-30
│ │   🛒 Supermercado  45%      │    │     brightness-75
│ │   🚗 Transporte    25%      │    │
│ │   🍕 Comida       20%      │    │
│ │   🎬 Ocio         10%      │    │
│ └─────────────────────────────┘    │
│                                     │
│ ┌─────────────────────────────┐    │
│ │ 🔓 Desbloquea este análisis  │    │  ← Card overlay centrado
│ │                              │    │     bg-background/95
│ │ Progreso: ██░░░  1/3        │    │     backdrop-blur-md
│ │                              │    │
│ │ 💡 Registra 2 gastos más     │    │
│ │    en diferentes categorías  │    │
│ └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

### Mensajes Dinámicos por Progreso:

```typescript
if (progress === 0) {
  "🎯 ¡Empieza registrando tu primer gasto!"
}
else if (progress < 50%) {
  "🚀 Vas bien! Solo {remaining} {label} más"
}
else if (progress >= 50% && progress < 100%) {
  "🔥 ¡Casi lo logras! Solo {remaining} más"
}
else if (progress === 100%) {
  "✨ ¡Desbloqueado! Desliza para ver tu análisis"
}
```

---

## 📦 OPTIMIZACIÓN CON INDEXEDDB

### Estrategias de Cache por Métrica:

```typescript
const CACHE_STRATEGIES = {
  'spending-by-category': {
    ttl: 3600, // 1 hora
    invalidateOn: ['transaction:created', 'transaction:deleted'],
    prefetch: true, // Pre-cargar en background
  },
  'shopping-insights': {
    ttl: 7200, // 2 horas
    invalidateOn: ['shopping_execution:completed'],
    prefetch: true,
  },
  'burn-rate': {
    ttl: 1800, // 30 min (cambia frecuente)
    invalidateOn: ['transaction:created', 'sobre:updated'],
    prefetch: false,
  },
  'projection': {
    ttl: 3600, // 1 hora
    invalidateOn: ['transaction:created'],
    prefetch: false, // Solo cargar cuando usuario la mira
  }
}
```

### Flujo de Carga Optimizado:

1. **Usuario toca "Métricas" en footer:**
   - Carga instantánea de metadata desde IndexedDB (< 5KB)
   - Muestra logros + lista de métricas desbloqueadas
   - NO carga gráficos todavía

2. **Scroll/Viewport Detection:**
   - Solo carga datos de métrica cuando entra en viewport
   - Usa IntersectionObserver para lazy loading

3. **Background Prefetch:**
   - Pre-carga métricas marcadas como `prefetch: true`
   - No bloquea la UI

4. **Invalidación Inteligente:**
   - Evento: `transaction:created` → Invalida solo métricas afectadas
   - No invalida todo el cache innecesariamente

---

## 🛠️ ARQUITECTURA DE MÓDULOS

### Estructura de Carpetas:

```
src/
├── infrastructure/
│   ├── achievements/
│   │   ├── achievements-engine.ts      # Motor de logros
│   │   ├── achievements-data.ts        # Definición de achievements
│   │   └── hints-generator.ts          # Generador de hints contextuales
│   │
│   └── cache/
│       ├── metrics-cache.ts            # IndexedDB wrapper
│       └── cache-strategies.ts         # Estrategias por métrica
│
├── presentation/
│   ├── providers/
│   │   └── metrics-provider.tsx        # Context global + lazy loading
│   │
│   ├── components/
│   │   └── metrics/
│   │       ├── LockedMetric.tsx        # Wrapper con blur + overlay
│   │       ├── MetricCard.tsx          # Card container
│   │       ├── AchievementToast.tsx    # Celebración de desbloqueo
│   │       │
│   │       └── charts/
│   │           ├── SpendingByCategoryChart.tsx
│   │           ├── ShoppingInsightsChart.tsx
│   │           ├── BurnRateIndicator.tsx
│   │           └── ProjectionLineChart.tsx
│   │
│   └── screens/
│       └── MetricsScreen.tsx           # Pantalla principal
│
└── app/
    └── api/
        └── metrics/
            ├── metadata/route.ts       # Logros + métricas desbloqueadas
            ├── spending-by-category/route.ts
            ├── shopping-insights/route.ts
            ├── burn-rate/route.ts
            └── projection/route.ts
```

---

## 🌐 ENDPOINTS API

### 1. Metadata (Endpoint mínimo - carga inicial)

```typescript
GET /api/metrics/metadata

Response (< 5KB):
{
  achievements: Achievement[],
  unlockedMetrics: string[],
  hints: Hint[],
  stats: {
    transactions_count: 45,
    categories_count: 8,
    shopping_executions: 12,
    days_active: 18,
    consecutive_days: 5
  },
  lastSync: "2024-11-21T10:30:00Z"
}
```

### 2. Top Categorías de Gasto

```typescript
GET /api/metrics/spending-by-category?periodo=last_month&sobreId=xxx

Response:
{
  success: true,
  data: {
    categorias: [
      {
        categoria_id: "xxx",
        categoria_nombre: "Supermercado",
        categoria_emoji: "🛒",
        total_gastado: 150000,
        porcentaje_total: 35.5,
        num_transacciones: 12,
        promedio_por_transaccion: 12500,
        tendencia: "up",
        cambio_porcentual: 15.3
      }
      // ... TOP 10 ordenadas por total_gastado DESC
    ],
    resumen: {
      total_general: 422500,
      num_categorias: 8,
      periodo: { inicio: "2024-11-01", fin: "2024-11-30" }
    },
    isUnlocked: true,
    unlockProgress: { current: 45, required: 3, label: "transacciones" }
  }
}
```

### 3. Análisis de Compras

```typescript
GET /api/metrics/shopping-insights?periodo=last_month

Response:
{
  success: true,
  data: {
    tiendas_favoritas: [
      {
        tienda: "Jumbo",
        total_gastado: 450000,
        num_compras: 12,
        porcentaje: 35.2,
        ticket_promedio: 37500,
        ultima_compra: "2024-11-18"
      }
      // TOP 5 tiendas
    ],
    productos_top: [
      {
        producto_id: "xxx",
        nombre: "Leche Descremada 1L",
        categoria: "Lácteos",
        veces_comprado: 8,
        monto_total: 24000,
        precio_promedio: 3000,
        precio_minimo: 2800,
        precio_maximo: 3200,
        mejor_tienda: "Lider",
        tendencia_precio: "up"
      }
      // TOP 10 productos
    ],
    resumen: {
      total_gastado_listas: 1280000,
      num_ejecuciones: 24,
      ticket_promedio_general: 53333,
      periodo: { inicio: "2024-11-01", fin: "2024-11-30" }
    },
    insights: [
      {
        type: "ahorro",
        message: "Podrías ahorrar $12.500 comprando todo en Lider",
        priority: "high"
      }
    ],
    isUnlocked: true,
    unlockProgress: { current: 12, required: 2, label: "compras completadas" }
  }
}
```

### 4. Burn Rate

```typescript
GET /api/metrics/burn-rate

Response:
{
  success: true,
  data: {
    dias_restantes: 12.5,
    presupuesto_total_disponible: 85000,
    gasto_promedio_diario: 6800,
    nivel_alerta: "safe", // "safe" | "warning" | "critical"
    proyeccion_fin_mes: 204000,
    presupuesto_total_mes: 250000,
    porcentaje_usado: 66,
    isUnlocked: true,
    unlockProgress: { current: 8, required: 3, label: "transacciones" }
  }
}
```

### 5. Proyección Fin de Mes

```typescript
GET /api/metrics/projection?periodo=current_month

Response:
{
  success: true,
  data: {
    datos_reales: [
      { fecha: "2024-11-01", gasto_acumulado: 15000 },
      { fecha: "2024-11-02", gasto_acumulado: 28000 },
      // ... datos hasta hoy
    ],
    proyeccion: [
      { fecha: "2024-11-21", gasto_proyectado: 180000 },
      { fecha: "2024-11-22", gasto_proyectado: 188500 },
      // ... hasta fin de mes
    ],
    estadisticas: {
      total_proyectado_fin_mes: 265000,
      presupuesto_total: 250000,
      exceso_proyectado: 15000,
      probabilidad_exceso: 0.85
    },
    regresion: {
      pendiente: 8500, // gasto diario promedio
      r_squared: 0.92  // confianza del modelo
    },
    isUnlocked: true,
    unlockProgress: { current: 15, required: 8, label: "transacciones" }
  }
}
```

---

## 🎨 LIBRERÍA DE GRÁFICOS

### Recomendación: **Recharts**

**Instalación:**
```bash
npm install recharts
npm install -D @types/recharts
```

**¿Por qué Recharts?**
- ✅ Componibles con React (sintaxis declarativa)
- ✅ Responsivo nativo (perfecto para mobile)
- ✅ Ligero (~100KB vs Chart.js ~200KB)
- ✅ Theming fácil (integración directa con Tailwind)
- ✅ TypeScript first
- ✅ Animaciones suaves (ideal para efecto desbloqueo)

### Datos Dummy para Gráficos Bloqueados:

```typescript
// Top Categorías (bloqueado)
const DUMMY_SPENDING = [
  { categoria: "Supermercado", emoji: "🛒", monto: 450000, porcentaje: 38 },
  { categoria: "Transporte", emoji: "🚗", monto: 280000, porcentaje: 24 },
  { categoria: "Restaurantes", emoji: "🍕", monto: 200000, porcentaje: 17 },
  { categoria: "Entretenimiento", emoji: "🎬", monto: 150000, porcentaje: 13 },
  { categoria: "Salud", emoji: "💊", monto: 100000, porcentaje: 8 },
]

// Análisis Compras (bloqueado)
const DUMMY_SHOPPING = [
  { tienda: "Supermercado A", monto: 350000, porcentaje: 45 },
  { tienda: "Supermercado B", monto: 280000, porcentaje: 36 },
  { tienda: "Tienda Local", monto: 150000, porcentaje: 19 },
]

// Proyección (bloqueado)
const DUMMY_PROJECTION = [
  { dia: 1, real: 15000, proyectado: 15000 },
  { dia: 5, real: 78000, proyectado: 75000 },
  { dia: 10, real: 145000, proyectado: 150000 },
  { dia: 15, real: null, proyectado: 225000 },
  { dia: 20, real: null, proyectado: 300000 },
  { dia: 30, real: null, proyectado: 450000 },
]
```

---

## 🎮 SISTEMA DE HINTS

### Generación Contextual:

```typescript
function generateHints(achievements, userActivity): Hint[] {
  const hints = []

  // Hint 1: Cerca de desbloqueo
  const almostUnlocked = achievements.find(
    a => !a.isUnlocked && a.progress >= 50 && a.progress < 100
  )

  if (almostUnlocked) {
    const remaining = calculateRemaining(almostUnlocked)
    hints.push({
      type: 'achievement',
      message: `🔥 ¡Casi lo logras! ${remaining} más para desbloquear ${almostUnlocked.name}`,
      action: { label: 'Registrar gasto', route: '/dashboard/sobres' },
      priority: 'high'
    })
  }

  // Hint 2: Métrica recién desbloqueada
  const recentlyUnlocked = achievements.filter(
    a => a.isUnlocked && isRecent(a.unlockedAt, 24)
  )

  if (recentlyUnlocked.length > 0) {
    hints.push({
      type: 'metric',
      message: `✨ Desbloqueaste "${recentlyUnlocked[0].name}". ¡Mira tu nuevo análisis!`,
      action: { label: 'Ver Métricas', route: '/dashboard/metricas' },
      priority: 'high'
    })
  }

  // Hint 3: Inactividad
  if (userActivity.daysSinceLastTransaction > 3) {
    hints.push({
      type: 'feature',
      message: '📊 Registra tus gastos para mantener tus métricas actualizadas',
      priority: 'medium'
    })
  }

  return hints.sort((a, b) => PRIORITY[b.priority] - PRIORITY[a.priority])
}
```

---

## 📱 RESPONSIVE LAYOUT

### Mobile (< 768px):
- Stack vertical de cards
- 1 métrica por fila
- Altura fija 300px por card

### Tablet (768px - 1024px):
- Grid 2x2
- Altura 350px por card

### Desktop (> 1024px):
- Grid 2x2 más amplio
- Altura 400px por card
- Sidebar con filtros

---

## 🚀 PLAN DE IMPLEMENTACIÓN

### Orden Recomendado:

1. **Instalar Recharts**
   ```bash
   npm install recharts @types/recharts
   ```

2. **Crear Achievement Engine + IndexedDB Cache**
   - `src/infrastructure/achievements/achievements-engine.ts`
   - `src/infrastructure/cache/metrics-cache.ts`

3. **Crear Metrics Provider con Lazy Loading**
   - `src/presentation/providers/metrics-provider.tsx`

4. **Endpoint de Metadata**
   - `src/app/api/metrics/metadata/route.ts`

5. **Componente LockedMetric**
   - `src/presentation/components/metrics/LockedMetric.tsx`

6. **Primera Métrica Completa (Top Categorías)**
   - Endpoint: `src/app/api/metrics/spending-by-category/route.ts`
   - Chart: `src/presentation/components/metrics/charts/SpendingByCategoryChart.tsx`

7. **Segunda Métrica (Análisis Compras)**
   - Endpoint: `src/app/api/metrics/shopping-insights/route.ts`
   - Chart: `src/presentation/components/metrics/charts/ShoppingInsightsChart.tsx`

8. **Tercera Métrica (Burn Rate)**
   - Endpoint + Chart

9. **Cuarta Métrica (Proyección)**
   - Endpoint + Chart (requiere regresión lineal)

10. **MetricsScreen Principal**
    - Layout responsive
    - IntersectionObserver para lazy loading
    - Integración con filtros

---

## 📝 NOTAS IMPORTANTES

### Consideraciones de Performance:
- ✅ Carga inicial < 5KB (solo metadata)
- ✅ IndexedDB para cache persistente
- ✅ Lazy loading con IntersectionObserver
- ✅ Prefetch inteligente en background
- ✅ Invalidación selectiva de cache

### UX/Gamificación:
- ✅ Gráficos dummy visibles con blur (aspiracional)
- ✅ Barra de progreso clara
- ✅ Mensajes dinámicos según proximidad
- ✅ Celebración al desbloquear (toast + confetti)
- ✅ Hints contextuales para guiar usuario

### Seguridad:
- ✅ Todos los endpoints requieren autenticación
- ✅ Filtrado por userId server-side
- ✅ Validación de períodos de fecha
- ✅ Rate limiting en endpoints de métricas

---

## 🔄 CÓMO RETOMAR ESTE DISEÑO

**Para retomar en otra sesión, decir a la IA:**

> "Retoma el diseño del sistema de métricas que dejamos guardado en METRICAS_DISEÑO.md. Vamos a implementar la Fase 1 MVP empezando por [punto específico]"

**O para evaluar gráficos primero:**

> "Lee METRICAS_DISEÑO.md y muéstrame ejemplos visuales de cómo se verían los gráficos usando Recharts. Necesito ver mockups de las 4 métricas principales."

**O para continuar desde donde quedamos:**

> "Lee METRICAS_DISEÑO.md y continuemos con la implementación. ¿Por dónde empezamos?"

---

**FIN DEL DOCUMENTO DE DISEÑO**
