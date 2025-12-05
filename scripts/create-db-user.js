#!/usr/bin/env node

/**
 * Script: Create PostgreSQL User for WApp
 *
 * Crea un usuario/role de PostgreSQL con todos los permisos necesarios
 * para que la aplicación WApp funcione correctamente.
 *
 * Uso:
 *   node scripts/create-db-user.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt) =>
  new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });

// =====================================================
// Colores para output
// =====================================================
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️ ${msg}${colors.reset}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.blue}${msg}${colors.reset}\n`),
  section: (msg) => console.log(`\n${colors.bright}${msg}${colors.reset}`),
};

// =====================================================
// Main
// =====================================================
async function main() {
  log.title('🗄️  PostgreSQL User Creator for WApp');

  console.log('Este script creará un usuario de PostgreSQL con permisos');
  console.log('para que la aplicación WApp funcione correctamente.\n');

  // =====================================================
  // 1. Obtener datos del usuario
  // =====================================================
  log.section('1️⃣  Configuración del Usuario PostgreSQL');

  let username = await question('👤 Username para PostgreSQL (default: app_user): ');
  username = username.trim() || 'app_user';

  let password = await question('🔐 Contraseña (dejar en blanco para generar una): ');
  password = password.trim();

  if (!password) {
    // Generar contraseña segura
    password = generatePassword();
    log.success(`Contraseña generada: ${password}`);
  }

  // Validaciones
  if (username.length < 3) {
    log.error('Username debe tener al menos 3 caracteres');
    process.exit(1);
  }

  if (password.length < 8) {
    log.error('Contraseña debe tener al menos 8 caracteres');
    process.exit(1);
  }

  // =====================================================
  // 2. Obtener DATABASE_URL
  // =====================================================
  log.section('2️⃣  Conexión a Base de Datos');

  let databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    log.warn('DATABASE_URL no encontrado en .env');
    databaseUrl = await question('📍 Ingresa DATABASE_URL de PostgreSQL: ');
  }

  if (!databaseUrl) {
    log.error('DATABASE_URL es requerido');
    process.exit(1);
  }

  log.success(`Usando: ${maskUrl(databaseUrl)}`);

  // =====================================================
  // 3. Generar SQL
  // =====================================================
  log.section('3️⃣  Generando Script SQL');

  const sqlScript = generateSqlScript(username, password);
  const sqlFile = path.join(__dirname, `.create-db-user-temp-${Date.now()}.sql`);

  fs.writeFileSync(sqlFile, sqlScript);
  log.success('Script SQL generado');

  // =====================================================
  // 4. Ejecutar Script
  // =====================================================
  log.section('4️⃣  Ejecutando Script SQL');

  console.log(`\n${colors.yellow}Nota: Se pedirá contraseña de PostgreSQL${colors.reset}\n`);

  try {
    // Ejecutar psql con el script
    const command = `psql "${databaseUrl}" -f "${sqlFile}"`;
    execSync(command, { stdio: 'inherit' });
    log.success('Script ejecutado exitosamente');
  } catch (error) {
    log.error(`Error ejecutando script: ${error.message}`);
    console.log(`\nIntenta manualmente:`);
    console.log(`  psql "${databaseUrl}" -f "${sqlFile}"`);
    process.exit(1);
  } finally {
    // Limpiar archivo temporal
    try {
      fs.unlinkSync(sqlFile);
    } catch (e) {
      // Ignorar
    }
  }

  // =====================================================
  // 5. Mostrar instrucciones finales
  // =====================================================
  log.section('5️⃣  Instrucciones Finales');

  const newDatabaseUrl = `postgresql://${username}:${password}@localhost:5432/neondb`;

  console.log(`\n${colors.bright}Próximos pasos:${colors.reset}\n`);
  console.log(`1. Actualiza tu archivo .env con la nueva URL:\n`);
  console.log(`   ${colors.cyan}DATABASE_URL="${newDatabaseUrl}"${colors.reset}\n`);
  console.log(`2. Reinicia tu aplicación:\n`);
  console.log(`   ${colors.cyan}npm run dev${colors.reset}\n`);
  console.log(`3. Verifica que todo funciona:\n`);
  console.log(`   ${colors.cyan}npm run db:types${colors.reset}\n`);

  log.info('Usuario de PostgreSQL creado exitosamente');

  rl.close();
}

// =====================================================
// Utilidades
// =====================================================

/**
 * Genera una contraseña segura aleatoria
 */
function generatePassword() {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*-_=+';

  const all = uppercase + lowercase + numbers + special;

  let password = '';
  // Asegurar que tiene de cada tipo
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Rellenar hasta 16 caracteres
  for (let i = password.length; i < 16; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Mezclar
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

/**
 * Oculta la contraseña en la URL
 */
function maskUrl(url) {
  try {
    const urlObj = new URL(url);
    if (urlObj.password) {
      urlObj.password = '***';
    }
    return urlObj.toString();
  } catch {
    return url.replace(/:(.+)@/, ':***@');
  }
}

/**
 * Genera el script SQL completo
 */
function generateSqlScript(username, password) {
  return `-- =====================================================
-- Created: ${new Date().toISOString()}
-- User: ${username}
-- =====================================================

-- 1. CREAR USUARIO/ROLE
CREATE ROLE ${username} WITH
  LOGIN
  PASSWORD '${password}'
  NOSUPERUSER
  NOCREATEDB
  NOCREATEROLE
  NOINHERIT;

-- 2. PERMISOS DE BASE DE DATOS
GRANT CONNECT ON DATABASE neondb TO ${username};
GRANT USAGE ON SCHEMA public TO ${username};

-- 3. PERMISOS POR DEFECTO
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${username};

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO ${username};

-- 4. PERMISOS EN TABLAS DE LECTURA/ESCRITURA
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO ${username};
GRANT SELECT, INSERT, UPDATE, DELETE ON user_config TO ${username};
GRANT SELECT, INSERT, UPDATE, DELETE ON user_subscriptions TO ${username};
GRANT SELECT, INSERT, UPDATE, DELETE ON user_preferences TO ${username};
GRANT SELECT, INSERT, UPDATE, DELETE ON accounts TO ${username};
GRANT SELECT, INSERT, UPDATE, DELETE ON sessions TO ${username};
GRANT SELECT, INSERT, UPDATE, DELETE ON verification_codes TO ${username};
GRANT SELECT, INSERT, UPDATE, DELETE ON sobres TO ${username};
GRANT SELECT, INSERT, UPDATE, DELETE ON billeteras TO ${username};
GRANT SELECT, INSERT, UPDATE, DELETE ON transacciones TO ${username};
GRANT SELECT, INSERT, UPDATE, DELETE ON shopping_lists TO ${username};
GRANT SELECT, INSERT, UPDATE, DELETE ON shopping_list_items TO ${username};
GRANT SELECT, INSERT, UPDATE, DELETE ON shopping_executions TO ${username};
GRANT SELECT, INSERT, UPDATE, DELETE ON shopping_execution_items TO ${username};
GRANT SELECT, INSERT, UPDATE, DELETE ON categorias TO ${username};
GRANT SELECT, INSERT, UPDATE, DELETE ON subcategorias TO ${username};
GRANT SELECT, INSERT, UPDATE, DELETE ON marcas TO ${username};
GRANT SELECT, INSERT, UPDATE, DELETE ON themes TO ${username};
GRANT SELECT, INSERT, UPDATE, DELETE ON user_themes TO ${username};
GRANT SELECT, INSERT, UPDATE, DELETE ON linked_users TO ${username};
GRANT SELECT, INSERT, UPDATE, DELETE ON invitation_codes TO ${username};

-- 5. PERMISOS DE SOLO LECTURA
GRANT SELECT ON subscription_plans TO ${username};
GRANT SELECT ON monedas TO ${username};
GRANT SELECT ON product_catalog TO ${username};
GRANT SELECT ON product_categories_global TO ${username};
GRANT SELECT ON product_categories_user TO ${username};
GRANT SELECT ON product_user_custom TO ${username};

-- 6. PERMISOS EN SECUENCIAS Y FUNCIONES
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${username};
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO ${username};

-- 7. VERIFICACIÓN
SELECT '✅ Usuario creado exitosamente!' as resultado;
SELECT * FROM pg_roles WHERE rolname = '${username}';
`;
}

// Ejecutar main
main().catch((error) => {
  log.error(error.message);
  rl.close();
  process.exit(1);
});
