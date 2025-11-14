/**
 * Kysely Database Configuration
 *
 * Configuración de Kysely con connection pooling optimizado.
 * Pool de 20 conexiones para mejor rendimiento y reutilización.
 */

import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import type { Database } from './types'

/**
 * Configuración del connection pool
 * 20 conexiones concurrentes para alta performance
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Máximo 20 conexiones concurrentes
  idleTimeoutMillis: 30000, // Cerrar conexiones idle después de 30s
  connectionTimeoutMillis: 10000, // Timeout de conexión: 10s
})

/**
 * Dialecto de PostgreSQL con el pool configurado
 */
const dialect = new PostgresDialect({
  pool,
})

/**
 * Instancia de Kysely con tipo Database
 * Esta es la instancia principal que se usa en toda la app
 */
export const db = new Kysely<Database>({
  dialect,
  log:
    process.env.NODE_ENV === 'development'
      ? ['query', 'error']
      : ['error'],
})

/**
 * Helper para desconectar el pool (útil en tests y shutdown)
 */
export async function disconnectDatabase() {
  await pool.end()
}

/**
 * Re-exportar tipos para conveniencia
 */
export type { Database }
