#!/usr/bin/env node

/**
 * Script para crear un nuevo usuario en la base de datos
 *
 * Uso:
 *   node scripts/create-user.js
 *
 * Este script:
 * 1. Solicita los datos del usuario interactivamente
 * 2. Valida los inputs
 * 3. Hashea la contraseña con bcrypt
 * 4. Inserta el usuario y toda su configuración en la BD
 *
 * Requisitos:
 * - PostgreSQL debe estar ejecutándose
 * - DATABASE_URL debe estar configurada en .env
 * - Dependencias: kysely, pg, bcryptjs
 */

const readline = require('readline');
const bcryptjs = require('bcryptjs');
const { db } = require('../src/infrastructure/database/kysely');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createUser() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║        CREATE NEW USER - Database Script              ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Solicitar datos del usuario
    console.log('Ingresa los datos del nuevo usuario:\n');

    const name = await question('👤 Nombre completo: ');
    if (!name.trim()) {
      throw new Error('El nombre es requerido');
    }

    const email = await question('📧 Email: ');
    if (!email.includes('@')) {
      throw new Error('Email inválido');
    }

    const phone = await question('📱 Teléfono (opcional, presiona Enter para saltar): ');

    const password = await question('🔐 Contraseña: ');
    if (password.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres');
    }

    const confirmPassword = await question('🔐 Confirma contraseña: ');
    if (password !== confirmPassword) {
      throw new Error('Las contraseñas no coinciden');
    }

    const accountType = 'EMAIL'; // En el futuro se puede hacer dinámico

    console.log('\n🔐 Hasheando contraseña...');
    const hashedPassword = await bcryptjs.hash(password, 10);

    // 2. Crear el usuario
    console.log('📝 Creando usuario...');
    const user = await db
      .insertInto('users')
      .values({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        email_verified: new Date(),
        phone: phone.trim() || null,
        phone_verified: null,
        password: hashedPassword,
        account_type: accountType,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returningAll()
      .executeTakeFirst();

    if (!user) {
      throw new Error('Error al crear el usuario');
    }

    const userId = user.id;
    console.log(`✅ Usuario creado con ID: ${userId}`);

    // 3. Crear configuración de usuario
    console.log('⚙️  Creando configuración...');
    await db
      .insertInto('user_config')
      .values({
        user_id: userId,
        moneda_principal_id: 'CLP',
        monedas_habilitadas: ['CLP'],
        timezone: 'America/Santiago',
        locale: 'es-CL',
        primer_dia_semana: 1,
        tipo_periodo: 'MENSUAL',
        dia_inicio_periodo: 1,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .execute();
    console.log('✅ Configuración creada');

    // 4. Crear suscripción FREE
    console.log('📊 Creando suscripción...');
    const freePlan = await db
      .selectFrom('subscription_plans')
      .where('slug', '=', 'free')
      .selectAll()
      .executeTakeFirst();

    if (!freePlan) {
      throw new Error(
        'Plan FREE no encontrado. Ejecuta las migraciones primero: npm run db:migrate'
      );
    }

    await db
      .insertInto('user_subscriptions')
      .values({
        user_id: userId,
        plan_id: freePlan.id,
        status: 'free',
        platform: 'web',
        period: 'monthly',
        started_at: new Date(),
        expires_at: null,
        trial_ends_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .execute();
    console.log('✅ Suscripción creada');

    // 5. Crear preferencias de usuario
    console.log('🎨 Creando preferencias...');
    await db
      .insertInto('user_preferences')
      .values({
        user_id: userId,
        show_inline_qty: true,
        group_by_category: false,
        quick_list_mode: false,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .execute();
    console.log('✅ Preferencias creadas');

    // 6. Crear billetera por defecto
    console.log('💰 Creando billetera...');
    await db
      .insertInto('billeteras')
      .values({
        nombre: 'Efectivo',
        tipo: 'EFECTIVO',
        moneda_principal_id: 'CLP',
        saldo_real: '0',
        saldo_proyectado: '0',
        color: '#FF6B6B',
        emoji: '💵',
        is_compartida: false,
        usuario_id: userId,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .execute();
    console.log('✅ Billetera creada');

    // 7. Mostrar resumen
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║            ✅ USUARIO CREADO EXITOSAMENTE             ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    console.log('Datos del usuario creado:');
    console.log(`  📌 ID:       ${userId}`);
    console.log(`  👤 Nombre:   ${user.name}`);
    console.log(`  📧 Email:    ${user.email}`);
    if (user.phone) {
      console.log(`  📱 Teléfono: ${user.phone}`);
    }
    console.log(`  🔐 Tipo:     ${user.account_type}`);
    console.log(`  📊 Plan:     FREE`);
    console.log(`  💰 Billetera: Efectivo (CLP $0)`);
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\nPosibles causas:');
    if (error.message.includes('duplicate key')) {
      console.log('  - El email ya está registrado');
    } else if (error.message.includes('foreign key')) {
      console.log('  - Falta ejecutar las migraciones: npm run db:migrate');
    } else if (error.message.includes('CONNECTION')) {
      console.log('  - Database no está disponible');
      console.log('  - Verifica que DATABASE_URL esté configurada en .env');
    }
    console.log('\n');
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Ejecutar
createUser();
