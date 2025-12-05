/**
 * GET /api/shopping-lists/[id]/pending-onthefly-items
 *
 * Obtiene productos agregados on-the-fly de la última ejecución completada
 * que aún NO están en la lista actual.
 *
 * Útil para mostrar modal de sugerencias al entrar a una lista.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import { db } from '@/infrastructure/database/kysely'
import { sql } from 'kysely'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: listId } = await context.params

    // 1. Verificar que la lista existe y el usuario tiene acceso
    const list = await db
      .selectFrom('shopping_lists')
      .selectAll()
      .where('id', '=', listId)
      .where('user_id', '=', session.user.id)
      .executeTakeFirst()

    if (!list) {
      return NextResponse.json(
        { error: 'Lista no encontrada' },
        { status: 404 }
      )
    }

    // 2. Obtener la última ejecución completada de esta lista
    const lastExecution = await db
      .selectFrom('shopping_executions')
      .selectAll()
      .where('shopping_list_id', '=', listId)
      .where('status', '=', 'COMPLETED')
      .orderBy('completed_at', 'desc')
      .limit(1)
      .executeTakeFirst()

    console.log('🔍 Last execution found:', lastExecution?.id)

    if (!lastExecution) {
      console.log('ℹ️ No completed executions found')
      return NextResponse.json({
        success: true,
        products: [],
        message: 'No hay ejecuciones completadas',
      })
    }

    // 3. Obtener items on-the-fly de esa ejecución que fueron comprados
    const onTheFlyItems = await db
      .selectFrom('shopping_execution_items')
      .leftJoin('product_catalog', 'shopping_execution_items.product_id', 'product_catalog.id')
      .leftJoin('product_user_custom', 'shopping_execution_items.product_custom_id', 'product_user_custom.id')
      .select([
        'shopping_execution_items.id',
        'shopping_execution_items.cantidad_comprada',
        'shopping_execution_items.unidad_medida',
        'shopping_execution_items.precio_unitario',
        'shopping_execution_items.precio_total',
        'shopping_execution_items.marca',
        'shopping_execution_items.es_agregado_vuelo',
        'shopping_execution_items.es_comprado',
        // Product name from catalog or custom products
        sql<string>`COALESCE(product_catalog.nombre, product_user_custom.nombre)`.as('product_name'),
      ])
      .where('shopping_execution_items.shopping_execution_id', '=', lastExecution.id)
      .where('shopping_execution_items.es_agregado_vuelo', '=', true)
      .where('shopping_execution_items.es_comprado', '=', true)
      .execute()

    console.log('✨ On-the-fly items found in DB:', onTheFlyItems.length)
    if (onTheFlyItems.length > 0) {
      console.log('🔍 On-the-fly items details:', onTheFlyItems)
    }

    if (onTheFlyItems.length === 0) {
      console.log('ℹ️ No on-the-fly items found in database')
      return NextResponse.json({
        success: true,
        products: [],
        message: 'No hay productos on-the-fly en la última ejecución',
      })
    }

    // 4. Obtener items actuales de la lista para filtrar duplicados
    const currentListItems = await db
      .selectFrom('shopping_list_items as sli')
      .leftJoin('product_catalog as pc', 'sli.product_id', 'pc.id')
      .leftJoin('product_user_custom as puc', 'sli.product_custom_id', 'puc.id')
      .select([
        'sli.id',
        'pc.nombre as catalog_name',
        'puc.nombre as custom_name',
      ])
      .where('sli.shopping_list_id', '=', listId)
      .where('sli.deleted_at', 'is', null)
      .execute()

    const existingProductNames = new Set(
      currentListItems.map(item =>
        (item.catalog_name || item.custom_name || '').toLowerCase().trim()
      )
    )

    // 5. Filtrar items que NO están en la lista (por nombre)
    const pendingItems = onTheFlyItems.filter(item => {
      const productName = (item.product_name || '').toLowerCase().trim()
      return productName && !existingProductNames.has(productName)
    })

    console.log('🔄 After filtering duplicates, pending items:', pendingItems.length)
    console.log('📋 Existing product names in list:', Array.from(existingProductNames))

    // 6. Formatear para el frontend
    const products = pendingItems.map(item => ({
      id: item.id,
      product_name: item.product_name,
      cantidad_comprada: item.cantidad_comprada,
      unidad_medida: item.unidad_medida,
      precio_unitario: item.precio_unitario,
      precio_total: item.precio_total,
      marca: item.marca,
    }))

    console.log('✅ Returning products to frontend:', products.length)
    if (products.length > 0) {
      console.log('🎯 Products:', products)
    }

    return NextResponse.json({
      success: true,
      products,
      executionId: lastExecution.id,
      completedAt: lastExecution.completed_at,
    })
  } catch (error: any) {
    console.error('❌ GET /api/shopping-lists/[id]/pending-onthefly-items error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener productos on-the-fly' },
      { status: 500 }
    )
  }
}
