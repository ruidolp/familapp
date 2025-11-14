/**
 * POST /api/user/theme
 *
 * Save user's theme preference
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  getThemeBySlug,
  setUserThemePreference,
} from '@/infrastructure/database/queries'

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await req.json()
    const { themeSlug, customColors } = body

    if (!themeSlug) {
      return NextResponse.json(
        { error: 'Missing required field: themeSlug' },
        { status: 400 }
      )
    }

    // Verify theme exists
    const theme = await getThemeBySlug(themeSlug)

    if (!theme) {
      return NextResponse.json({ error: 'Theme not found' }, { status: 404 })
    }

    // Save user preference
    await setUserThemePreference(session.user.id, theme.id, customColors || null)

    return NextResponse.json({
      success: true,
      theme: {
        id: theme.id,
        slug: theme.slug,
        name: theme.name,
      },
    })
  } catch (error: any) {
    console.error('Error saving theme preference:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/user/theme
 *
 * Get user's current theme preference
 */
export async function GET() {
  try {
    // Check authentication
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's theme preference
    const { getUserThemePreference } = await import('@/infrastructure/database/queries')
    const preference = await getUserThemePreference(session.user.id)

    if (!preference) {
      // Return default theme if no preference set
      return NextResponse.json({
        theme: {
          slug: 'blanco',
          name: 'Blanco',
        },
      })
    }

    return NextResponse.json({
      theme: {
        id: preference.theme.id,
        slug: preference.theme.slug,
        name: preference.theme.name,
        colors: preference.custom_colors || preference.theme.colors,
      },
    })
  } catch (error: any) {
    console.error('Error getting theme preference:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
