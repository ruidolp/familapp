/**
 * /api/sobres/initialize
 *
 * Initialize default envelopes with categories and brands for onboarding
 * Called after user config is created
 */

import { NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import { initializeUserProfile } from '@/application/services/onboarding.service'
import { getTranslations } from 'next-intl/server'
import { findUserConfig } from '@/infrastructure/database/queries/user-config.queries'

/**
 * POST /api/sobres/initialize
 *
 * Creates:
 * - Default wallet (if doesn't exist)
 * - PERSONAL envelope (no categories)
 * - HOGAR envelope with categories and country-specific brands
 */
export async function POST() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user config to determine locale
    const userConfig = await findUserConfig(session.user.id)
    if (!userConfig) {
      return NextResponse.json(
        { error: 'User config not found. Create config first.' },
        { status: 400 }
      )
    }

    // Extract locale from user config (e.g., 'es-CL' -> 'es')
    const locale = userConfig.locale?.split('-')[0] || 'es'

    // Get translations
    const t = await getTranslations({ locale })

    // Initialize profile with envelopes, categories, and brands
    const result = await initializeUserProfile(
      session.user.id,
      locale,
      (key: string) => t(key)
    )

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error initializing envelopes:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    )
  }
}
