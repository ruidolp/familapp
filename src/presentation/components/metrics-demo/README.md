# 📊 DEMO DE GRÁFICOS - MÉTRICAS

> ⚠️ **TEMPORAL** - Solo para evaluación de diseños
>
> Este módulo completo puede ser borrado cuando se implemente el sistema real de métricas

---

## 🗂️ ESTRUCTURA

```
metrics-demo/
├── README.md                      # Este archivo
├── LockedMetric.tsx               # Componente wrapper con blur/overlay
├── data/
│   └── dummy-data.ts              # Todos los datos dummy
└── charts/
    ├── CategoriesBarChart.tsx     # Gráfico 1
    ├── CategoriesPieChart.tsx     # Gráfico 2
    ├── SobresComparisonChart.tsx  # Gráfico 3
    ├── SpendingTimelineChart.tsx  # Gráfico 4
    ├── WeeklyStackedChart.tsx     # Gráfico 5
    ├── StoresBarChart.tsx         # Gráfico 6
    ├── ProductRadarChart.tsx      # Gráfico 7
    ├── PriceQuantityScatter.tsx   # Gráfico 8
    ├── ShoppingTrendLine.tsx      # Gráfico 9
    ├── TreemapChart.tsx           # Gráfico 10
    ├── LockedBurnRate.tsx         # Gráfico 11 (bloqueado)
    ├── LockedProjection.tsx       # Gráfico 12 (bloqueado)
    ├── LockedHealthScore.tsx      # Gráfico 13 (bloqueado)
    └── LockedCategories.tsx       # Gráfico 14 (bloqueado)
```

---

## 📊 GRÁFICOS INCLUIDOS

### Transacciones/Sobres (5)
1. **Barras Horizontales** - Top categorías por gasto
2. **Pie/Dona** - Distribución % por categoría
3. **Barras Verticales** - Comparación sobres (presupuesto vs gastado)
4. **Línea/Área** - Evolución de gastos en el tiempo
5. **Barras Apiladas** - Gastos semanales por categoría

### Listas/Shopping (5)
6. **Barras Horizontales** - Top tiendas por monto
7. **Radar** - Comparación productos (frecuencia vs gasto)
8. **Scatter/Puntos** - Precio unitario vs cantidad
9. **Línea** - Tendencia mensual de compras
10. **Treemap** - Distribución jerárquica (tienda → categoría)

### Bloqueados (4)
11. **Gauge Circular** - Burn Rate (días restantes)
12. **Línea con Proyección** - Proyección fin de mes
13. **Score Circular** - Health Score
14. **Barras con Overlay** - Categorías bloqueadas

---

## 🚀 CÓMO VER LOS GRÁFICOS

1. Abre el dashboard: `http://localhost:3000/dashboard`
2. Haz clic en la pestaña **Métricas** (📊) en el bottom nav
3. Verás los 14 gráficos organizados en 3 secciones

---

## 🗑️ CÓMO BORRAR TODO (cuando ya no lo necesites)

### Opción 1: Borrar solo la carpeta demo

```bash
rm -rf src/presentation/components/metrics-demo
```

Y luego restaurar `MetricasScreen.tsx`:

```typescript
// src/presentation/components/screens/MetricasScreen.tsx
export function MetricasScreen() {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold">Métricas</h2>
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          Vista de métricas en construcción
        </p>
      </div>
    </div>
  )
}
```

### Opción 2: Borrar también MetricsScreen.tsx

```bash
rm -rf src/presentation/components/metrics-demo
rm src/presentation/components/screens/MetricsScreen.tsx
```

Y restaurar `MetricasScreen.tsx` como arriba.

### Opción 3: Desinstalar Recharts (si no lo usarás)

```bash
npm uninstall recharts
```

---

## 📝 ARCHIVOS MODIFICADOS

Archivos que fueron editados (no creados):

1. `src/presentation/components/screens/MetricasScreen.tsx`
   - Cambiado de placeholder a re-export de `MetricsScreen`

2. `package.json`
   - Agregado: `recharts` a dependencies

---

## 🔄 PARA IMPLEMENTACIÓN REAL

Cuando implementes el sistema real de métricas:

1. Revisa el documento de diseño: `METRICAS_DISEÑO.md`
2. Reutiliza los componentes de gráficos que te gusten
3. Reemplaza los datos dummy por llamadas a los endpoints
4. Implementa el sistema de logros y cache con IndexedDB
5. Borra esta carpeta demo

---

## 💡 NOTAS

- Todos los datos son dummy/fake
- No se hacen llamadas a endpoints reales
- Los gráficos son completamente funcionales y responsivos
- El componente `LockedMetric` muestra el efecto de desbloqueo
- Usa Recharts como librería de gráficos
