/**
 * POST /api/subscriptions/purchase/init
 *
 * Iniciar proceso de compra de subscription.
 * La app móvil llama a este endpoint ANTES de mostrar el diálogo de pago
 * para registrar el mapping transactionId -> userId.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import { createPendingPurchase } from '@/infrastructure/database/queries'
import { z } from 'zod'

const initPurchaseSchema = z.object({
  platform: z.enum(['apple', 'google', 'sandbox']),
  transactionId: z.string().min(1),
  productId: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    // 1. Verificar autenticación
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Validar request
    const body = await req.json()
    const parsed = initPurchaseSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.errors },
        { status: 400 }
      )
    }

    const { platform, transactionId, productId } = parsed.data

    // 3. Registrar compra pendiente
    const pendingPurchase = await createPendingPurchase({
      user_id: session.user.id,
      platform,
      transaction_id: transactionId,
      product_id: productId,
    })

    console.log(
      `[Purchase Init] User ${session.user.id} initiated purchase`,
      { platform, productId, transactionId }
    )

    return NextResponse.json({
      success: true,
      purchaseId: pendingPurchase.id,
    })
  } catch (error) {
    console.error('[Purchase Init] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
