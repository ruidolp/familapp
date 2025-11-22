/**
 * DATOS DUMMY PARA DEMO DE GRÁFICOS
 *
 * ⚠️ TEMPORAL - Solo para evaluación de diseños
 * Borrar cuando se implemente el sistema real de métricas
 */

// ============================================
// DATOS PARA TRANSACCIONES/SOBRES/CATEGORÍAS
// ============================================

export const DUMMY_CATEGORIES_SPENDING = [
  { categoria: 'Supermercado', emoji: '🛒', monto: 450000, porcentaje: 35, color: '#10b981' },
  { categoria: 'Transporte', emoji: '🚗', monto: 280000, porcentaje: 22, color: '#3b82f6' },
  { categoria: 'Restaurantes', emoji: '🍕', monto: 200000, porcentaje: 15, color: '#f59e0b' },
  { categoria: 'Entretenimiento', emoji: '🎬', monto: 150000, porcentaje: 12, color: '#8b5cf6' },
  { categoria: 'Salud', emoji: '💊', monto: 120000, porcentaje: 9, color: '#ec4899' },
  { categoria: 'Educación', emoji: '📚', monto: 80000, porcentaje: 6, color: '#06b6d4' },
  { categoria: 'Otros', emoji: '📦', monto: 20000, porcentaje: 1, color: '#6b7280' },
]

export const DUMMY_SOBRES_COMPARISON = [
  { sobre: 'Hogar', presupuesto: 500000, gastado: 420000, disponible: 80000, emoji: '🏠' },
  { sobre: 'Comida', presupuesto: 300000, gastado: 280000, disponible: 20000, emoji: '🍽️' },
  { sobre: 'Ocio', presupuesto: 150000, gastado: 95000, disponible: 55000, emoji: '🎉' },
  { sobre: 'Transporte', presupuesto: 200000, gastado: 180000, disponible: 20000, emoji: '🚗' },
  { sobre: 'Salud', presupuesto: 100000, gastado: 45000, disponible: 55000, emoji: '💊' },
]

export const DUMMY_SPENDING_TIMELINE = [
  { dia: 1, gasto: 15000, fecha: '01 Nov' },
  { dia: 2, gasto: 28000, fecha: '02 Nov' },
  { dia: 3, gasto: 12000, fecha: '03 Nov' },
  { dia: 4, gasto: 45000, fecha: '04 Nov' },
  { dia: 5, gasto: 32000, fecha: '05 Nov' },
  { dia: 6, gasto: 18000, fecha: '06 Nov' },
  { dia: 7, gasto: 55000, fecha: '07 Nov' },
  { dia: 8, gasto: 22000, fecha: '08 Nov' },
  { dia: 9, gasto: 38000, fecha: '09 Nov' },
  { dia: 10, gasto: 41000, fecha: '10 Nov' },
  { dia: 11, gasto: 29000, fecha: '11 Nov' },
  { dia: 12, gasto: 35000, fecha: '12 Nov' },
  { dia: 13, gasto: 48000, fecha: '13 Nov' },
  { dia: 14, gasto: 26000, fecha: '14 Nov' },
  { dia: 15, gasto: 52000, fecha: '15 Nov' },
  { dia: 16, gasto: 31000, fecha: '16 Nov' },
  { dia: 17, gasto: 44000, fecha: '17 Nov' },
  { dia: 18, gasto: 27000, fecha: '18 Nov' },
  { dia: 19, gasto: 39000, fecha: '19 Nov' },
  { dia: 20, gasto: 46000, fecha: '20 Nov' },
  { dia: 21, gasto: 33000, fecha: '21 Nov' },
]

export const DUMMY_WEEKLY_SPENDING = [
  {
    semana: 'Semana 1',
    Supermercado: 120000,
    Transporte: 45000,
    Restaurantes: 30000,
    Entretenimiento: 25000,
    Otros: 15000,
  },
  {
    semana: 'Semana 2',
    Supermercado: 95000,
    Transporte: 52000,
    Restaurantes: 48000,
    Entretenimiento: 32000,
    Otros: 12000,
  },
  {
    semana: 'Semana 3',
    Supermercado: 135000,
    Transporte: 38000,
    Restaurantes: 55000,
    Entretenimiento: 28000,
    Otros: 18000,
  },
  {
    semana: 'Semana 4',
    Supermercado: 100000,
    Transporte: 65000,
    Restaurantes: 67000,
    Entretenimiento: 45000,
    Otros: 20000,
  },
]

// ============================================
// DATOS PARA LISTAS/SHOPPING EXECUTIONS
// ============================================

export const DUMMY_STORES_SPENDING = [
  { tienda: 'Jumbo', monto: 450000, compras: 12, ticket_promedio: 37500, emoji: '🛒' },
  { tienda: 'Lider', monto: 380000, compras: 10, ticket_promedio: 38000, emoji: '🏬' },
  { tienda: 'Unimarc', monto: 280000, compras: 8, ticket_promedio: 35000, emoji: '🏪' },
  { tienda: 'Santa Isabel', monto: 180000, compras: 6, ticket_promedio: 30000, emoji: '🛍️' },
  { tienda: 'Tottus', monto: 120000, compras: 4, ticket_promedio: 30000, emoji: '🏬' },
]

export const DUMMY_PRODUCT_RADAR = [
  { producto: 'Leche', frecuencia: 95, gasto: 85, categoria: 'Lácteos' },
  { producto: 'Pan', frecuencia: 90, gasto: 70, categoria: 'Panadería' },
  { producto: 'Frutas', frecuencia: 75, gasto: 90, categoria: 'Verdulería' },
  { producto: 'Carnes', frecuencia: 60, gasto: 95, categoria: 'Carnicería' },
  { producto: 'Limpieza', frecuencia: 40, gasto: 65, categoria: 'Hogar' },
  { producto: 'Snacks', frecuencia: 85, gasto: 55, categoria: 'Despensa' },
]

export const DUMMY_PRICE_QUANTITY = [
  { producto: 'Leche 1L', precio: 3000, cantidad: 8, tienda: 'Jumbo' },
  { producto: 'Pan Molde', precio: 2500, cantidad: 12, tienda: 'Lider' },
  { producto: 'Manzanas 1kg', precio: 2000, cantidad: 6, tienda: 'Jumbo' },
  { producto: 'Pollo 1kg', precio: 5500, cantidad: 4, tienda: 'Unimarc' },
  { producto: 'Arroz 1kg', precio: 1800, cantidad: 10, tienda: 'Lider' },
  { producto: 'Detergente', precio: 4200, cantidad: 5, tienda: 'Jumbo' },
  { producto: 'Yogurt', precio: 2800, cantidad: 15, tienda: 'Santa Isabel' },
  { producto: 'Café', precio: 6500, cantidad: 3, tienda: 'Tottus' },
  { producto: 'Aceite', precio: 3500, cantidad: 7, tienda: 'Unimarc' },
  { producto: 'Pasta', precio: 1500, cantidad: 20, tienda: 'Lider' },
]

export const DUMMY_SHOPPING_TREND = [
  { mes: 'Jul', gasto: 1200000 },
  { mes: 'Ago', gasto: 1350000 },
  { mes: 'Sep', gasto: 1180000 },
  { mes: 'Oct', gasto: 1420000 },
  { mes: 'Nov', gasto: 1280000 },
]

export const DUMMY_TREEMAP_DATA = [
  {
    name: 'Jumbo',
    children: [
      { name: 'Lácteos', size: 120000 },
      { name: 'Carnes', size: 180000 },
      { name: 'Frutas', size: 95000 },
      { name: 'Limpieza', size: 55000 },
    ],
  },
  {
    name: 'Lider',
    children: [
      { name: 'Lácteos', size: 95000 },
      { name: 'Carnes', size: 150000 },
      { name: 'Panadería', size: 65000 },
      { name: 'Snacks', size: 70000 },
    ],
  },
  {
    name: 'Unimarc',
    children: [
      { name: 'Lácteos', size: 80000 },
      { name: 'Verduras', size: 110000 },
      { name: 'Despensa', size: 90000 },
    ],
  },
]

// ============================================
// DATOS PARA GRÁFICOS BLOQUEADOS
// ============================================

export const DUMMY_BURN_RATE = {
  dias_restantes: 12.5,
  porcentaje_usado: 66,
  gasto_diario: 6800,
  presupuesto_total: 250000,
}

export const DUMMY_PROJECTION = [
  { dia: 1, real: 15000, proyectado: 15000 },
  { dia: 5, real: 78000, proyectado: 75000 },
  { dia: 10, real: 145000, proyectado: 150000 },
  { dia: 12, real: 180000, proyectado: 180000 },
  { dia: 15, real: null, proyectado: 225000 },
  { dia: 20, real: null, proyectado: 300000 },
  { dia: 25, real: null, proyectado: 375000 },
  { dia: 30, real: null, proyectado: 450000 },
]

export const DUMMY_HEALTH_SCORE = {
  score: 75,
  componentes: [
    { nombre: 'Adherencia', valor: 85 },
    { nombre: 'Tendencia', valor: 70 },
    { nombre: 'Ahorro', valor: 65 },
  ],
}

export const DUMMY_LOCKED_CATEGORIES = [
  { categoria: 'Supermercado', monto: 450000, porcentaje: 38 },
  { categoria: 'Transporte', monto: 280000, porcentaje: 24 },
  { categoria: 'Restaurantes', monto: 200000, porcentaje: 17 },
  { categoria: 'Entretenimiento', monto: 150000, porcentaje: 13 },
  { categoria: 'Salud', monto: 100000, porcentaje: 8 },
]
