import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import { db } from '@/infrastructure/database/kysely'
import {
  getShoppingExecution,
  createExecutionItem,
} from '@/infrastructure/database/queries/shopping-lists.queries'

/**
 * POST /api/shopping-executions/[id]/items/batch
 * Create multiple execution items at once
 * Used when syncing local execution to server
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const execution = await getShoppingExecution(id)

    if (!execution) {
      return NextResponse.json(
        { error: 'Ejecución no encontrada' },
        { status: 404 }
      )
    }

    if (execution.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para editar esta ejecución' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { items } = body

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: 'items debe ser un array' },
        { status: 400 }
      )
    }

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'items no puede estar vacío' },
        { status: 400 }
      )
    }

    // Log received items for debugging
    console.log('📦 Batch endpoint received items:', items.length)
    const onTheFlyCount = items.filter((item: any) => item.es_agregado_vuelo).length
    console.log('✨ On-the-fly items in payload:', onTheFlyCount)
    if (onTheFlyCount > 0) {
      console.log('🔍 On-the-fly items details:', items.filter((item: any) => item.es_agregado_vuelo))
    }

    // Create all items
    const createdItems = []
    const errors = []

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      try {
        let productCustomId = item.product_custom_id

        // If it's an on-the-fly item without product_custom_id, create the product first
        if (item.es_agregado_vuelo && !item.is_catalog && !productCustomId && item.product_name) {
          console.log(`📝 Creating custom product for on-the-fly item: "${item.product_name}"`)

          // Check if product already exists for this user
          const existingProduct = await db
            .selectFrom('product_user_custom')
            .select('id')
            .where('user_id', '=', session.user.id)
            .where('nombre', '=', item.product_name)
            .where('deleted_at', 'is', null)
            .executeTakeFirst()

          if (existingProduct) {
            console.log(`✅ Product already exists, using ID: ${existingProduct.id}`)
            productCustomId = existingProduct.id
          } else {
            // Create new custom product
            const newProduct = await db
              .insertInto('product_user_custom')
              .values({
                user_id: session.user.id,
                nombre: item.product_name,
                created_at: new Date(),
                updated_at: new Date(),
              })
              .returning('id')
              .executeTakeFirstOrThrow()

            productCustomId = newProduct.id
            console.log(`✅ Created new custom product with ID: ${productCustomId}`)
          }
        }

        const created = await createExecutionItem({
          shopping_execution_id: id,
          shopping_list_item_id: item.shopping_list_item_id,
          product_id: item.product_id,
          product_custom_id: productCustomId,
          is_catalog: item.is_catalog,
          cantidad_comprada: item.cantidad_comprada,
          unidad_medida: item.unidad_medida,
          marca: item.marca,
          precio_unitario: item.precio_unitario,
          precio_total: item.precio_total,
          es_comprado: item.es_comprado ?? false,
          razon_no_comprado: item.razon_no_comprado,
          es_agregado_vuelo: item.es_agregado_vuelo ?? false,
          agregado_por: item.es_agregado_vuelo ? session.user.id : undefined,
          categoria_producto_id: item.categoria_producto_id,
          categoria_global_id: item.categoria_global_id,
        })
        createdItems.push(created)
      } catch (error: any) {
        console.error(`Error creating item ${i}:`, error)
        errors.push({
          index: i,
          item,
          error: error.message,
        })
      }
    }

    // If all failed, return error
    if (createdItems.length === 0) {
      return NextResponse.json(
        {
          error: 'No se pudo crear ningún item',
          errors,
        },
        { status: 500 }
      )
    }

    // Log created items
    console.log('✅ Successfully created items:', createdItems.length)
    const createdOnTheFly = createdItems.filter((item: any) => item.es_agregado_vuelo).length
    console.log('✨ On-the-fly items created:', createdOnTheFly)
    if (createdOnTheFly > 0) {
      console.log('🎯 Created on-the-fly items:', createdItems.filter((item: any) => item.es_agregado_vuelo))
    }

    // Return partial success if some failed
    return NextResponse.json({
      success: true,
      items: createdItems,
      total: createdItems.length,
      errors: errors.length > 0 ? errors : undefined,
    }, {
      status: errors.length > 0 ? 207 : 201, // 207 = Multi-Status
    })
  } catch (error: any) {
    console.error('❌ POST /api/shopping-executions/[id]/items/batch error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear items en lote' },
      { status: 500 }
    )
  }
}
