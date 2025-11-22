const { Kysely, PostgresDialect } = require('kysely')
const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })

const db = new Kysely({
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: process.env.DATABASE_URL,
    })
  })
})

async function checkMarcas() {
  try {
    console.log('Verificando tabla subcategorias_globales...\n')

    // Contar marcas por país
    const count = await db
      .selectFrom('subcategorias_globales')
      .select(({ fn }) => [
        fn.count('id').as('total')
      ])
      .where('pais', '=', 'CL')
      .where('deleted_at', 'is', null)
      .executeTakeFirst()

    console.log('Total marcas para Chile (CL):', count?.total || 0)

    // Mostrar primeras 10 marcas
    const marcas = await db
      .selectFrom('subcategorias_globales')
      .selectAll()
      .where('pais', '=', 'CL')
      .where('deleted_at', 'is', null)
      .orderBy('nombre', 'asc')
      .limit(10)
      .execute()

    console.log('\nPrimeras 10 marcas:')
    marcas.forEach((m, i) => {
      console.log(`${i+1}. ${m.emoji || '  '} ${m.nombre} (${m.categoria_tipo})`)
    })

    // Obtener versión
    const version = await db
      .selectFrom('subcategorias_globales')
      .select(({ fn }) => [
        fn.max('updated_at').as('max_updated_at')
      ])
      .where('pais', '=', 'CL')
      .where('deleted_at', 'is', null)
      .executeTakeFirst()

    console.log('\nVersión (max updated_at):', version?.max_updated_at)

  } catch (error) {
    console.error('Error completo:', error)
    if (error.message && error.message.includes('relation') && error.message.includes('does not exist')) {
      console.log('\n❌ La tabla subcategorias_globales NO EXISTE')
      console.log('Ejecuta la migración: 017_add_global_subcategorias.sql')
    }
  } finally {
    await db.destroy()
  }
}

checkMarcas()
