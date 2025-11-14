/**
 * API Route para NextAuth
 *
 * Este es el endpoint principal de autenticación de NextAuth.
 * Maneja todas las requests relacionadas con autenticación.
 */

import { handlers } from '@/infrastructure/lib/auth'

export const { GET, POST } = handlers
