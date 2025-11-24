/**
 * Sobres Queries
 *
 * Queries para gestión de sobres (presupuesto virtual)
 */

import { db } from '../kysely'
import type { Sobres, SobresUsuarios } from '../types'
import type { TipoSobre, RolSobreUsuario } from '../custom-enums'

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
  // Sobres propios (donde usuario_id = userId)
  const sobresOwner = await db
    .selectFrom('sobres')
    .selectAll()
    .where('usuario_id', '=', userId)
    .where('deleted_at', 'is', null)
    .execute()

  // Add user_role = 'OWNER' to owned sobres
  const sobresOwnerWithRole = sobresOwner.map(sobre => ({
    ...sobre,
    user_role: 'OWNER' as const,
  }))

  // Sobres compartidos donde participa (pero NO es owner)
  const sobresParticipante = await db
    .selectFrom('sobres')
    .innerJoin('sobres_usuarios', 'sobres.id', 'sobres_usuarios.sobre_id')
    .selectAll('sobres')
    .select('sobres_usuarios.rol as user_role')
    .where('sobres_usuarios.usuario_id', '=', userId)
    .where('sobres.usuario_id', '!=', userId) // Excluir sobres donde es owner
    .where('sobres.deleted_at', 'is', null)
    .execute()

  // Combinar y ordenar
  // IMPORTANTE: is_compartido viene de la DB, NO lo calculamos manualmente
  const allSobres = [...sobresOwnerWithRole, ...sobresParticipante]

  return allSobres.sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
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

  const nuevoGastado = (Number(sobre.gastado) || 0) + monto
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

  const nuevoGastado = Number(participante.gastado) + monto
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
    libre: Number(participante.presupuesto_asignado) - Number(participante.gastado),
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
    libre: Number(p.presupuesto_asignado) - Number(p.gastado),
    porcentaje_gasto:
      Number(p.presupuesto_asignado) > 0
        ? Math.round((Number(p.gastado) / Number(p.presupuesto_asignado)) * 100)
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
 * Retorna: categorías ordenadas por número de compras descendente (más usadas primero)
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
        .select([
          db.fn.sum('monto').as('total'),
          db.fn.count('id').as('compras'),
        ])
        .where('categoria_id', '=', cat.id)
        .where('sobre_id', '=', sobreId)
        .where('deleted_at', 'is', null)
        .executeTakeFirst()

      const totalGastado = Number(gastos?.total || 0)
      const compras = Number(gastos?.compras || 0)
      const presupuestoAsignado = Number(sobre.presupuesto_asignado || 0)
      const porcentaje =
        presupuestoAsignado > 0
          ? Math.round((totalGastado / presupuestoAsignado) * 100)
          : 0

      return {
        ...cat,
        gastado: totalGastado,
        porcentaje,
        compras,
      }
    })
  )

  // Ordenar por número de compras descendente (más usado primero)
  return categoriasWithGastos.sort((a, b) => b.compras - a.compras)
}

/**
 * ============================================================================
 * INVITACIONES A SOBRES
 * ============================================================================
 */

/**
 * Crear invitación a sobre
 */
export async function createInvitacionSobre(data: {
  sobre_id: string
  invitado_por_id: string
  invitado_email_o_telefono: string
  invitado_user_id?: string | null
  codigo_invitacion?: string | null
  rol: RolSobreUsuario
}) {
  return await db
    .insertInto('invitaciones_sobres')
    .values({
      ...data,
      estado: 'PENDIENTE',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

/**
 * Buscar invitación por código único
 */
export async function findInvitacionByCodigo(codigo: string) {
  return await db
    .selectFrom('invitaciones_sobres as inv')
    .innerJoin('sobres', 'sobres.id', 'inv.sobre_id')
    .innerJoin('users as inviter', 'inviter.id', 'inv.invitado_por_id')
    .select([
      'inv.id',
      'inv.sobre_id',
      'inv.rol',
      'inv.estado',
      'inv.expires_at',
      'sobres.nombre as sobre_nombre',
      'sobres.emoji as sobre_emoji',
      'sobres.presupuesto_asignado',
      'inviter.name as inviter_name',
      'inviter.email as inviter_email',
      'inviter.image as inviter_image',
    ])
    .where('inv.codigo_invitacion', '=', codigo)
    .where('inv.estado', '=', 'PENDIENTE')
    .where('inv.expires_at', '>', new Date())
    .executeTakeFirst()
}

/**
 * Buscar invitaciones pendientes por email/teléfono
 * (antes de que el usuario se registre)
 */
export async function findInvitacionesPendientesByContact(
  emailOrPhone: string
): Promise<Array<{ sobre_nombre: string; sobre_id: string; invitacion_id: string }>> {
  const contact = emailOrPhone.toLowerCase().trim()

  return await db
    .selectFrom('invitaciones_sobres as inv')
    .innerJoin('sobres', 'sobres.id', 'inv.sobre_id')
    .select([
      'sobres.nombre as sobre_nombre',
      'sobres.id as sobre_id',
      'inv.id as invitacion_id',
    ])
    .where('inv.invitado_email_o_telefono', '=', contact)
    .where('inv.estado', '=', 'PENDIENTE')
    .where('inv.expires_at', '>', new Date())
    .where('sobres.deleted_at', 'is', null)
    .execute()
}

/**
 * Buscar invitaciones pendientes de un usuario (ya registrado)
 */
export async function findInvitacionesPendientesByUser(userId: string) {
  return await db
    .selectFrom('invitaciones_sobres as inv')
    .innerJoin('sobres', 'sobres.id', 'inv.sobre_id')
    .innerJoin('users as inviter', 'inviter.id', 'inv.invitado_por_id')
    .select([
      'inv.id',
      'inv.sobre_id',
      'inv.rol',
      'inv.created_at',
      'inv.expires_at',
      'sobres.nombre as sobre_nombre',
      'sobres.emoji as sobre_emoji',
      'sobres.color as sobre_color',
      'sobres.presupuesto_asignado',
      'inviter.name as inviter_name',
      'inviter.email as inviter_email',
      'inviter.image as inviter_image',
    ])
    .where('inv.invitado_user_id', '=', userId)
    .where('inv.estado', '=', 'PENDIENTE')
    .where('inv.expires_at', '>', new Date())
    .orderBy('inv.created_at', 'desc')
    .execute()
}

/**
 * Buscar invitaciones enviadas de un sobre
 */
export async function findInvitacionesBySobre(sobreId: string) {
  return await db
    .selectFrom('invitaciones_sobres as inv')
    .leftJoin('users', 'users.id', 'inv.invitado_user_id')
    .select([
      'inv.id',
      'inv.invitado_email_o_telefono',
      'inv.estado',
      'inv.rol',
      'inv.created_at',
      'inv.expires_at',
      'inv.codigo_invitacion',
      'users.name as invitado_name',
      'users.email as invitado_email',
      'users.image as invitado_image',
    ])
    .where('inv.sobre_id', '=', sobreId)
    .orderBy('inv.created_at', 'desc')
    .execute()
}

/**
 * Buscar invitaciones enviadas por un usuario (todas sus invitaciones)
 */
export async function findInvitacionesEnviadasByUser(userId: string) {
  return await db
    .selectFrom('invitaciones_sobres as inv')
    .innerJoin('sobres', 'sobres.id', 'inv.sobre_id')
    .leftJoin('users', 'users.id', 'inv.invitado_user_id')
    .select([
      'inv.id',
      'inv.sobre_id',
      'inv.invitado_email_o_telefono',
      'inv.estado',
      'inv.rol',
      'inv.created_at',
      'inv.expires_at',
      'inv.codigo_invitacion',
      'inv.invitado_user_id',
      'sobres.nombre as sobre_nombre',
      'sobres.emoji as sobre_emoji',
      'sobres.color as sobre_color',
      'users.name as invitado_name',
      'users.email as invitado_email',
      'users.image as invitado_image',
    ])
    .where('inv.invitado_por_id', '=', userId)
    .where('sobres.deleted_at', 'is', null)
    .orderBy('inv.created_at', 'desc')
    .execute()
}

/**
 * Obtener invitación por ID (incluye estado y dueños)
 */
export async function findInvitacionById(invitacionId: string) {
  return await db
    .selectFrom('invitaciones_sobres')
    .select([
      'id',
      'sobre_id',
      'invitado_por_id',
      'invitado_user_id',
      'estado',
    ])
    .where('id', '=', invitacionId)
    .executeTakeFirst()
}

/**
 * Aceptar invitación y agregar como participante
 */
export async function acceptInvitacionSobre(invitacionId: string, userId: string) {
  // 1. Obtener datos de invitación
  const inv = await db
    .selectFrom('invitaciones_sobres')
    .selectAll()
    .where('id', '=', invitacionId)
    .executeTakeFirstOrThrow()

  // 2. Verificar si el sobre tiene nombre conflictivo (HOGAR o PERSONAL)
  const sobre = await findSobreById(inv.sobre_id)
  if (!sobre) throw new Error('Sobre no encontrado')

  // 3. Renombrar sobre existente si hay conflicto
  await renameSobreIfConflict(userId, sobre.nombre)

  // 4. Actualizar estado de invitación
  await db
    .updateTable('invitaciones_sobres')
    .set({
      estado: 'ACEPTADA',
      invitado_user_id: userId, // Asociar user_id si venía null
      updated_at: new Date(),
    })
    .where('id', '=', invitacionId)
    .execute()

  // 5. Marcar sobre como compartido
  await db
    .updateTable('sobres')
    .set({
      is_compartido: true,
      updated_at: new Date(),
    })
    .where('id', '=', inv.sobre_id)
    .execute()

  // 6. Agregar como participante
  const participante = await addParticipanteToSobre(inv.sobre_id, userId, inv.rol, 0)

  return {
    invitacion: inv,
    sobre: { ...sobre, is_compartido: true },
    participante,
  }
}

/**
 * Rechazar invitación
 */
export async function rejectInvitacionSobre(invitacionId: string) {
  // Obtener datos antes de rechazar
  const invitacion = await db
    .selectFrom('invitaciones_sobres as inv')
    .innerJoin('sobres', 'sobres.id', 'inv.sobre_id')
    .select([
      'inv.id',
      'inv.invitado_user_id',
      'inv.invitado_email_o_telefono',
      'sobres.nombre as sobre_nombre',
    ])
    .where('inv.id', '=', invitacionId)
    .executeTakeFirst()

  // Marcar como rechazada
  await db
    .updateTable('invitaciones_sobres')
    .set({
      estado: 'RECHAZADA',
      updated_at: new Date(),
    })
    .where('id', '=', invitacionId)
    .execute()

  return invitacion
}

/**
 * Cancelar invitación (por el que invitó)
 */
export async function cancelInvitacionSobre(invitacionId: string, userId: string) {
  // Verificar que sea el owner del sobre
  const inv = await db
    .selectFrom('invitaciones_sobres as inv')
    .innerJoin('sobres', 'sobres.id', 'inv.sobre_id')
    .select(['inv.id', 'sobres.usuario_id'])
    .where('inv.id', '=', invitacionId)
    .executeTakeFirst()

  if (!inv) throw new Error('Invitación no encontrada')
  if (inv.usuario_id !== userId) throw new Error('No tienes permiso para cancelar esta invitación')

  return await db
    .updateTable('invitaciones_sobres')
    .set({
      estado: 'CANCELADA',
      updated_at: new Date(),
    })
    .where('id', '=', invitacionId)
    .execute()
}

/**
 * Actualizar rol de invitación
 */
export async function updateInvitacionRole(
  invitacionId: string,
  newRole: string,
  invitadoUserId?: string | null
) {
  // 1. Actualizar rol en invitaciones_sobres
  await db
    .updateTable('invitaciones_sobres')
    .set({
      rol: newRole as any,
      updated_at: new Date(),
    })
    .where('id', '=', invitacionId)
    .execute()

  // 2. Si la invitación fue aceptada y existe usuario, actualizar también en sobres_usuarios
  if (invitadoUserId) {
    const invitacion = await db
      .selectFrom('invitaciones_sobres')
      .select(['sobre_id', 'estado'])
      .where('id', '=', invitacionId)
      .executeTakeFirst()

    if (invitacion && invitacion.estado === 'ACEPTADA') {
      await db
        .updateTable('sobres_usuarios')
        .set({
          rol: newRole as any,
          updated_at: new Date(),
        })
        .where('sobre_id', '=', invitacion.sobre_id)
        .where('usuario_id', '=', invitadoUserId)
        .execute()
    }
  }
}

/**
 * Renombrar sobre del usuario si existe conflicto de nombre
 */
export async function renameSobreIfConflict(userId: string, nombreSobre: string) {
  const sobreExistente = await db
    .selectFrom('sobres')
    .selectAll()
    .where('usuario_id', '=', userId)
    .where((eb) =>
      eb.or([
        eb('nombre', 'ilike', nombreSobre),
        eb('nombre', 'ilike', `${nombreSobre} %`), // Para evitar conflictos con nombres modificados
      ])
    )
    .where('deleted_at', 'is', null)
    .executeTakeFirst()

  if (sobreExistente) {
    await db
      .updateTable('sobres')
      .set({
        nombre: `${sobreExistente.nombre} (old)`,
        updated_at: new Date(),
      })
      .where('id', '=', sobreExistente.id)
      .execute()

    return sobreExistente
  }

  return null
}

/**
 * Asociar invitación pendiente a usuario recién registrado
 */
export async function associateInvitacionesToNewUser(
  emailOrPhone: string,
  userId: string
): Promise<number> {
  const contact = emailOrPhone.toLowerCase().trim()

  const result = await db
    .updateTable('invitaciones_sobres')
    .set({
      invitado_user_id: userId,
      updated_at: new Date(),
    })
    .where('invitado_email_o_telefono', '=', contact)
    .where('estado', '=', 'PENDIENTE')
    .where('invitado_user_id', 'is', null)
    .execute()

  return result.length
}
