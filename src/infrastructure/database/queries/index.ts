/**
 * Database Queries Index
 *
 * Punto central de exportación de todas las queries.
 * Organizado por dominio para fácil importación.
 */

// User queries
export * from './user.queries'

// Session queries
export * from './session.queries'

// Account queries (OAuth)
export * from './account.queries'

// Verification code queries
export * from './verification.queries'

// Subscription queries
export * from './subscription-plan.queries'
export * from './subscription.queries'
export * from './invitation.queries'
export * from './subscription-history.queries'

// Theme queries
export * from './theme.queries'

// CORE - Financial System queries
export * from './monedas.queries'
export * from './user-config.queries'
export * from './billeteras.queries'
export * from './sobres.queries'
export * from './categorias.queries'
export * from './subcategorias.queries'
export * from './transacciones.queries'
export * from './ingresos-recurrentes.queries'
export * from './periodos.queries'
