/**
 * Sobres Queries
 *
 * Queries para gestión de sobres (presupuesto virtual)
 */

import { db } from '../kysely'
import type { SobresTable, SobresUsuariosTable, TipoSobre, RolSobreUsuario } from '../types'

/**
 * Tipo para creación de sobre
 */
export type CreateSobreData = {
  nombre: string
  tipo: TipoSobre
  moneda_principal_id: string
  presupuesto_asignado?: number
  gastado?: number
  color?: string
  emoji?: string
  is_compartido: boolean
  max_participantes: number
  usuario_id: string
}

/**
 * Tipo para actualización de sobre
 */
export type UpdateSobreData = {
  nombre?: string
  presupuesto_asignado?: number
  gastado?: number
  color?: string
  emoji?: string
}

/**
 * Buscar sobre por ID (sin soft-deleted)
 */
export async function findSobreById(sobreId: string) {
  return await db
    .selectFrom('sobres')
    .selectAll()
    .where('id', '=', sobreId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()
}

/**
 * Buscar sobres por usuario (como owner o participante)
 */
export async function findSobresByUser(userId: string) {
  // Sobres propios + sobres compartidos donde participa
  const sobresOwner = await db
    .selectFrom('sobres')
    .selectAll()
    .where('usuario_id', '=', userId)
    .where('deleted_at', 'is', null)
    .execute()

  const sobresParticipante = await db
    .selectFrom('sobres')
    .innerJoin('sobres_usuarios', 'sobres.id', 'sobres_usuarios.sobre_id')
    .selectAll('sobres')
    .where('sobres_usuarios.usuario_id', '=', userId)
    .where('sobres.deleted_at', 'is', null)
    .execute()

  // Combinar y eliminar duplicados
  const allSobres = [...sobresOwner, ...sobresParticipante]
  const uniqueSobres = Array.from(new Map(allSobres.map((s) => [s.id, s])).values())

  return uniqueSobres.sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
}

/**
 * Buscar sobres compartidos donde el usuario participa
 */
export async function findSobresCompartidosByUser(userId: string) {
  return await db
    .selectFrom('sobres')
    .innerJoin('sobres_usuarios', 'sobres.id', 'sobres_usuarios.sobre_id')
    .selectAll('sobres')
    .where('sobres_usuarios.usuario_id', '=', userId)
    .where('sobres.is_compartido', '=', true)
    .where('sobres.deleted_at', 'is', null)
    .execute()
}

/**
 * Crear nuevo sobre
 */
export async function createSobre(sobreData: CreateSobreData) {
  return await db
    .insertInto('sobres')
    .values({
      ...sobreData,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

/**
 * Actualizar sobre
 */
export async function updateSobre(sobreId: string, sobreData: UpdateSobreData) {
  return await db
    .updateTable('sobres')
    .set({
      ...sobreData,
      updated_at: new Date(),
    })
    .where('id', '=', sobreId)
    .where('deleted_at', 'is', null)
    .returningAll()
    .executeTakeFirst()
}

/**
 * Soft delete de sobre
 */
export async function softDeleteSobre(sobreId: string) {
  return await db
    .updateTable('sobres')
    .set({
      deleted_at: new Date(),
      updated_at: new Date(),
    })
    .where('id', '=', sobreId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()
}

/**
 * Actualizar presupuesto asignado de sobre
 */
export async function updateSobrePresupuesto(sobreId: string, nuevoPresupuesto: number) {
  return await db
    .updateTable('sobres')
    .set({
      presupuesto_asignado: nuevoPresupuesto,
      updated_at: new Date(),
    })
    .where('id', '=', sobreId)
    .where('deleted_at', 'is', null)
    .returningAll()
    .executeTakeFirst()
}

/**
 * Actualizar gastado de sobre
 */
export async function updateSobreGastado(sobreId: string, nuevoGastado: number) {
  return await db
    .updateTable('sobres')
    .set({
      gastado: nuevoGastado,
      updated_at: new Date(),
    })
    .where('id', '=', sobreId)
    .where('deleted_at', 'is', null)
    .returningAll()
    .executeTakeFirst()
}

/**
 * Incrementar gastado de sobre (útil para transacciones)
 */
export async function incrementarSobreGastado(sobreId: string, monto: number) {
  const sobre = await findSobreById(sobreId)
  if (!sobre) return null

  const nuevoGastado = (sobre.gastado || 0) + monto
  return await updateSobreGastado(sobreId, nuevoGastado)
}

/**
 * SOBRES_USUARIOS (participantes)
 */

/**
 * Agregar participante a sobre compartido
 */
export async function addParticipanteToSobre(
  sobreId: string,
  userId: string,
  rol: RolSobreUsuario = 'CONTRIBUTOR',
  presupuestoAsignado: number = 0
) {
  return await db
    .insertInto('sobres_usuarios')
    .values({
      sobre_id: sobreId,
      usuario_id: userId,
      presupuesto_asignado: presupuestoAsignado,
      gastado: 0,
      rol,
      created_at: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

/**
 * Obtener participantes de un sobre
 */
export async function findParticipantesBySobre(sobreId: string) {
  return await db
    .selectFrom('sobres_usuarios')
    .selectAll()
    .where('sobre_id', '=', sobreId)
    .execute()
}

/**
 * Obtener tracking individual de usuario en sobre compartido
 */
export async function findParticipanteInSobre(sobreId: string, userId: string) {
  return await db
    .selectFrom('sobres_usuarios')
    .selectAll()
    .where('sobre_id', '=', sobreId)
    .where('usuario_id', '=', userId)
    .executeTakeFirst()
}

/**
 * Actualizar tracking de participante (presupuesto y gastado)
 */
export async function updateParticipanteTracking(
  sobreId: string,
  userId: string,
  presupuestoAsignado?: number,
  gastado?: number
) {
  const updates: { presupuesto_asignado?: number; gastado?: number } = {}
  if (presupuestoAsignado !== undefined) updates.presupuesto_asignado = presupuestoAsignado
  if (gastado !== undefined) updates.gastado = gastado

  return await db
    .updateTable('sobres_usuarios')
    .set(updates)
    .where('sobre_id', '=', sobreId)
    .where('usuario_id', '=', userId)
    .returningAll()
    .executeTakeFirst()
}

/**
 * Incrementar gastado de participante
 */
export async function incrementarParticipanteGastado(sobreId: string, userId: string, monto: number) {
  const participante = await findParticipanteInSobre(sobreId, userId)
  if (!participante) return null

  const nuevoGastado = participante.gastado + monto
  return await updateParticipanteTracking(sobreId, userId, undefined, nuevoGastado)
}

/**
 * Remover participante de sobre
 */
export async function removeParticipanteFromSobre(sobreId: string, userId: string) {
  return await db
    .deleteFrom('sobres_usuarios')
    .where('sobre_id', '=', sobreId)
    .where('usuario_id', '=', userId)
    .executeTakeFirst()
}

/**
 * ============================================================================
 * ASIGNACIONES DE PRESUPUESTO (Budget allocations from wallets to envelopes)
 * ============================================================================
 */

/**
 * Obtener todas las asignaciones de un sobre (agrupadas por billetera)
 * Retorna estado ACTUAL del presupuesto asignado
 */
export async function findAsignacionesBySobre(sobreId: string) {
  // Agrupar asignaciones_presupuesto por billetera para obtener estado actual
  const asignaciones = await db
    .selectFrom('asignaciones_presupuesto')
    .select([
      'billetera_id',
      'usuario_id',
      db.fn.sum('monto').as('monto_total'),
    ])
    .where('sobre_id', '=', sobreId)
    .groupBy(['billetera_id', 'usuario_id'])
    .execute()

  // Enriquecer con datos de billetera
  const result = await Promise.all(
    asignaciones.map(async (a) => {
      const billetera = await db
        .selectFrom('billeteras')
        .select(['id', 'nombre', 'emoji', 'saldo_real', 'moneda_principal_id'])
        .where('id', '=', a.billetera_id)
        .executeTakeFirst()

      return {
        billetera_id: a.billetera_id,
        usuario_id: a.usuario_id,
        monto_asignado: Number(a.monto_total || 0),
        billetera: billetera || null,
      }
    })
  )

  return result
}

/**
 * Obtener asignaciones de un usuario específico en un sobre
 */
export async function findAsignacionesByUsuarioInSobre(sobreId: string, userId: string) {
  const asignaciones = await db
    .selectFrom('asignaciones_presupuesto')
    .select([
      'billetera_id',
      db.fn.sum('monto').as('monto_total'),
    ])
    .where('sobre_id', '=', sobreId)
    .where('usuario_id', '=', userId)
    .groupBy('billetera_id')
    .execute()

  // Enriquecer con datos de billetera
  const result = await Promise.all(
    asignaciones.map(async (a) => {
      const billetera = await db
        .selectFrom('billeteras')
        .select(['id', 'nombre', 'emoji', 'saldo_real', 'moneda_principal_id'])
        .where('id', '=', a.billetera_id)
        .where('usuario_id', '=', userId) // Validar que es del usuario
        .executeTakeFirst()

      return {
        billetera_id: a.billetera_id,
        monto_asignado: Number(a.monto_total || 0),
        billetera: billetera || null,
      }
    })
  )

  return result.filter((r) => r.billetera !== null)
}

/**
 * Crear nueva asignación de presupuesto
 */
export async function createAsignacion(
  sobreId: string,
  billeteraId: string,
  usuarioId: string,
  monto: number,
  monedaId: string,
  tipo: 'INICIAL' | 'AUMENTO' | 'DISMINUCION' | 'TRANSFERENCIA' = 'INICIAL'
) {
  return await db
    .insertInto('asignaciones_presupuesto')
    .values({
      sobre_id: sobreId,
      billetera_id: billeteraId,
      usuario_id: usuarioId,
      monto,
      moneda_id: monedaId,
      tipo,
      created_at: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

/**
 * Obtener presupuesto libre de usuario en un sobre
 * presupuesto_libre = presupuesto_asignado - gastado (de sobres_usuarios)
 */
export async function getPresupuestoLibreUsuarioInSobre(sobreId: string, userId: string) {
  const participante = await findParticipanteInSobre(sobreId, userId)
  if (!participante) return null

  return {
    presupuesto_asignado: participante.presupuesto_asignado,
    gastado: participante.gastado,
    libre: participante.presupuesto_asignado - participante.gastado,
  }
}

/**
 * Obtener resumen de asignaciones de un sobre por usuario
 * Para mostrar en UI: "Mi presupuesto: $X (libre), Pareja: $Y (libre)"
 */
export async function getResumenAsignacionesBySobre(sobreId: string) {
  const participantes = await findParticipantesBySobre(sobreId)

  return participantes.map((p) => ({
    usuario_id: p.usuario_id,
    presupuesto_asignado: p.presupuesto_asignado,
    gastado: p.gastado,
    libre: p.presupuesto_asignado - p.gastado,
    porcentaje_gasto:
      p.presupuesto_asignado > 0
        ? Math.round((p.gastado / p.presupuesto_asignado) * 100)
        : 0,
  }))
}

/**
 * ============================================================================
 * SOBRES_CATEGORIAS - Gestión de categorías en sobres
 * ============================================================================
 */

/**
 * Agregar una categoría a un sobre
 */
export async function addCategoriasToSobre(sobreId: string, categoriaId: string) {
  return await db
    .insertInto('sobres_categorias')
    .values({
      sobre_id: sobreId,
      categoria_id: categoriaId,
      created_at: new Date(),
    })
    .onConflict((oc) => oc.columns(['sobre_id', 'categoria_id']).doNothing())
    .returningAll()
    .executeTakeFirst()
}

/**
 * Eliminar una categoría de un sobre (soft delete en sobres_categorias)
 * En realidad, solo la sacamos de la relación, pero los gastos siguen existiendo
 */
export async function removeCategoriasFromSobre(sobreId: string, categoriaId: string) {
  return await db
    .deleteFrom('sobres_categorias')
    .where('sobre_id', '=', sobreId)
    .where('categoria_id', '=', categoriaId)
    .executeTakeFirst()
}

/**
 * Obtener categorías de un sobre CON cálculo de gastos y porcentajes
 * Retorna: categorías ordenadas por porcentaje de gasto descendente
 */
export async function findCategoriasWithGastosBySobre(sobreId: string) {
  const sobre = await findSobreById(sobreId)
  if (!sobre) return []

  const categorias = await db
    .selectFrom('sobres_categorias')
    .innerJoin('categorias', 'categorias.id', 'sobres_categorias.categoria_id')
    .select([
      'categorias.id',
      'categorias.nombre',
      'categorias.emoji',
      'categorias.color',
    ])
    .where('sobres_categorias.sobre_id', '=', sobreId)
    .where('categorias.deleted_at', 'is', null)
    .execute()

  // Para cada categoría, calcular gastos
  const categoriasWithGastos = await Promise.all(
    categorias.map(async (cat) => {
      const gastos = await db
        .selectFrom('transacciones')
        .select(db.fn.sum('monto').as('total'))
        .where('categoria_id', '=', cat.id)
        .where('sobre_id', '=', sobreId)
        .where('deleted_at', 'is', null)
        .executeTakeFirst()

      const totalGastado = Number(gastos?.total || 0)
      const presupuestoAsignado = Number(sobre.presupuesto_asignado || 0)
      const porcentaje =
        presupuestoAsignado > 0
          ? Math.round((totalGastado / presupuestoAsignado) * 100)
          : 0

      return {
        ...cat,
        gastado: totalGastado,
        porcentaje,
      }
    })
  )

  // Ordenar por porcentaje descendente
  return categoriasWithGastos.sort((a, b) => b.porcentaje - a.porcentaje)
}
