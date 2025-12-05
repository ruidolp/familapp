-- =====================================================
-- Script: Create PostgreSQL User (Parametrized)
-- =====================================================
-- Versión parametrizada que permite especificar username y password
--
-- Uso con psql variables:
--   psql -U postgres -d neondb \
--     -v user_name="app_user" \
--     -v user_pass="secure_password_here" \
--     -f create-db-user-parametrized.sql
--
-- O directamente en psql:
--   \set user_name 'app_user'
--   \set user_pass 'secure_password_here'
--   \i create-db-user-parametrized.sql
-- =====================================================

-- Validación: Asegurar que las variables están definidas
\if :{?user_name}
\else
  \echo ERROR: user_name no está definido
  \echo Usa: psql ... -v user_name="app_user" ...
  \quit
\endif

\if :{?user_pass}
\else
  \echo ERROR: user_pass no está definido
  \echo Usa: psql ... -v user_pass="password123" ...
  \quit
\endif

-- Mostrar configuración
\echo 'Creando usuario PostgreSQL...'
\echo 'Username:' :user_name
\echo '---'

-- =====================================================
-- 1. CREAR USUARIO/ROLE
-- =====================================================
CREATE ROLE :user_name WITH
  LOGIN
  PASSWORD :'user_pass'
  NOSUPERUSER
  NOCREATEDB
  NOCREATEROLE
  NOINHERIT;

\echo 'Role creado exitosamente'

-- =====================================================
-- 2. DAR PERMISOS A LA BASE DE DATOS
-- =====================================================
GRANT CONNECT ON DATABASE neondb TO :user_name;
GRANT USAGE ON SCHEMA public TO :user_name;

\echo 'Permisos de base de datos otorgados'

-- =====================================================
-- 3. PERMISOS POR DEFECTO EN SCHEMA PUBLIC
-- =====================================================
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO :user_name;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO :user_name;

\echo 'Permisos por defecto configurados'

-- =====================================================
-- 4. PERMISOS EN TABLAS EXISTENTES
-- =====================================================

-- Tablas de usuarios
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO :user_name;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_config TO :user_name;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_subscriptions TO :user_name;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_preferences TO :user_name;
GRANT SELECT, INSERT, UPDATE, DELETE ON accounts TO :user_name;
GRANT SELECT, INSERT, UPDATE, DELETE ON sessions TO :user_name;
GRANT SELECT, INSERT, UPDATE, DELETE ON verification_codes TO :user_name;

-- Tablas de sobres/billeteras
GRANT SELECT, INSERT, UPDATE, DELETE ON sobres TO :user_name;
GRANT SELECT, INSERT, UPDATE, DELETE ON billeteras TO :user_name;
GRANT SELECT, INSERT, UPDATE, DELETE ON transacciones TO :user_name;

-- Tablas de listas de compra
GRANT SELECT, INSERT, UPDATE, DELETE ON shopping_lists TO :user_name;
GRANT SELECT, INSERT, UPDATE, DELETE ON shopping_list_items TO :user_name;
GRANT SELECT, INSERT, UPDATE, DELETE ON shopping_executions TO :user_name;
GRANT SELECT, INSERT, UPDATE, DELETE ON shopping_execution_items TO :user_name;

-- Tablas de categorías y marcas
GRANT SELECT, INSERT, UPDATE, DELETE ON categorias TO :user_name;
GRANT SELECT, INSERT, UPDATE, DELETE ON subcategorias TO :user_name;
GRANT SELECT, INSERT, UPDATE, DELETE ON marcas TO :user_name;

-- Tablas de temas
GRANT SELECT, INSERT, UPDATE, DELETE ON themes TO :user_name;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_themes TO :user_name;

-- Tablas de relaciones
GRANT SELECT, INSERT, UPDATE, DELETE ON linked_users TO :user_name;
GRANT SELECT, INSERT, UPDATE, DELETE ON invitation_codes TO :user_name;

\echo 'Permisos en tablas de lectura/escritura otorgados'

-- =====================================================
-- 5. PERMISOS EN TABLAS DE SOLO LECTURA
-- =====================================================
GRANT SELECT ON subscription_plans TO :user_name;
GRANT SELECT ON monedas TO :user_name;
GRANT SELECT ON product_catalog TO :user_name;
GRANT SELECT ON product_categories_global TO :user_name;
GRANT SELECT ON product_categories_user TO :user_name;
GRANT SELECT ON product_user_custom TO :user_name;

\echo 'Permisos de solo lectura otorgados'

-- =====================================================
-- 6. PERMISOS EN SECUENCIAS Y FUNCIONES
-- =====================================================
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO :user_name;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO :user_name;

\echo 'Permisos en secuencias y funciones otorgados'

-- =====================================================
-- 7. VERIFICACIÓN FINAL
-- =====================================================
\echo ''
\echo '✅ Usuario creado exitosamente!'
\echo ''

SELECT
  rolname as "Username",
  rolcanlogin as "Can Login",
  rolcreatedb as "Can Create DB",
  rolcreaterole as "Can Create Role"
FROM pg_roles
WHERE rolname = :'user_name';

\echo ''
\echo 'DATABASE_URL para usar en .env:'
\echo 'postgresql://' :user_name ':PASSWORD@localhost:5432/neondb'
\echo ''
