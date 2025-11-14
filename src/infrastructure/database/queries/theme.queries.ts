/**
 * Theme Queries
 *
 * Database queries for theme management.
 */

import { db } from '@/infrastructure/database/kysely'

/**
 * Theme types
 */
export interface Theme {
  id: string
  slug: string
  name: string
  description: string | null
  category: 'preestablished' | 'custom'
  colors: Record<string, string>
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface UserThemePreference {
  id: string
  user_id: string
  theme_id: string
  custom_colors: Record<string, string> | null
  created_at: Date
  updated_at: Date
}

/**
 * Get all active themes
 */
export async function getActiveThemes(): Promise<Theme[]> {
  const themes = await db
    .selectFrom('themes')
    .selectAll()
    .where('is_active', '=', true)
    .orderBy('name', 'asc')
    .execute()

  return themes.map(theme => ({
    ...theme,
    colors: typeof theme.colors === 'string' ? JSON.parse(theme.colors) : theme.colors,
  }))
}

/**
 * Get theme by slug
 */
export async function getThemeBySlug(slug: string): Promise<Theme | undefined> {
  const theme = await db
    .selectFrom('themes')
    .selectAll()
    .where('slug', '=', slug)
    .where('is_active', '=', true)
    .executeTakeFirst()

  if (!theme) return undefined

  return {
    ...theme,
    colors: typeof theme.colors === 'string' ? JSON.parse(theme.colors) : theme.colors,
  }
}

/**
 * Get theme by ID
 */
export async function getThemeById(themeId: string): Promise<Theme | undefined> {
  const theme = await db
    .selectFrom('themes')
    .selectAll()
    .where('id', '=', themeId)
    .executeTakeFirst()

  if (!theme) return undefined

  return {
    ...theme,
    colors: typeof theme.colors === 'string' ? JSON.parse(theme.colors) : theme.colors,
  }
}

/**
 * Get user's theme preference
 */
export async function getUserThemePreference(
  userId: string
): Promise<(UserThemePreference & { theme: Theme }) | undefined> {
  const result = await db
    .selectFrom('user_theme_preferences as utp')
    .innerJoin('themes as t', 't.id', 'utp.theme_id')
    .select([
      'utp.id',
      'utp.user_id',
      'utp.theme_id',
      'utp.custom_colors',
      'utp.created_at',
      'utp.updated_at',
      't.id as theme_id',
      't.slug as theme_slug',
      't.name as theme_name',
      't.description as theme_description',
      't.category as theme_category',
      't.colors as theme_colors',
      't.is_active as theme_is_active',
      't.created_at as theme_created_at',
      't.updated_at as theme_updated_at',
    ])
    .where('utp.user_id', '=', userId)
    .executeTakeFirst()

  if (!result) return undefined

  const themeColors = typeof result.theme_colors === 'string'
    ? JSON.parse(result.theme_colors)
    : result.theme_colors

  const customColors = result.custom_colors
    ? (typeof result.custom_colors === 'string'
        ? JSON.parse(result.custom_colors)
        : result.custom_colors)
    : null

  return {
    id: result.id,
    user_id: result.user_id,
    theme_id: result.theme_id,
    custom_colors: customColors as Record<string, string> | null,
    created_at: result.created_at,
    updated_at: result.updated_at,
    theme: {
      id: result.theme_id,
      slug: result.theme_slug,
      name: result.theme_name,
      description: result.theme_description,
      category: result.theme_category as 'preestablished' | 'custom',
      colors: themeColors as Record<string, string>,
      is_active: result.theme_is_active,
      created_at: result.theme_created_at,
      updated_at: result.theme_updated_at,
    },
  }
}

/**
 * Set user's theme preference
 */
export async function setUserThemePreference(
  userId: string,
  themeId: string,
  customColors?: Record<string, string> | null
) {
  // Check if preference exists
  const existing = await db
    .selectFrom('user_theme_preferences')
    .selectAll()
    .where('user_id', '=', userId)
    .executeTakeFirst()

  if (existing) {
    // Update existing preference
    return await db
      .updateTable('user_theme_preferences')
      .set({
        theme_id: themeId,
        custom_colors: customColors ? JSON.stringify(customColors) : null,
        updated_at: new Date(),
      })
      .where('user_id', '=', userId)
      .returningAll()
      .executeTakeFirstOrThrow()
  } else {
    // Create new preference
    return await db
      .insertInto('user_theme_preferences')
      .values({
        user_id: userId,
        theme_id: themeId,
        custom_colors: customColors ? JSON.stringify(customColors) : null,
        updated_at: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow()
  }
}

/**
 * Create custom theme
 */
export async function createCustomTheme(data: {
  name: string
  description?: string
  colors: Record<string, string>
}) {
  // Generate slug from name
  const slug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  return await db
    .insertInto('themes')
    .values({
      slug: `custom-${slug}-${Date.now()}`,
      name: data.name,
      description: data.description || null,
      category: 'custom',
      colors: JSON.stringify(data.colors),
      is_active: true,
      updated_at: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

/**
 * Delete custom theme
 */
export async function deleteCustomTheme(themeId: string) {
  return await db
    .deleteFrom('themes')
    .where('id', '=', themeId)
    .where('category', '=', 'custom')
    .execute()
}
