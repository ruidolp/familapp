-- =====================================================
-- Script: Create PostgreSQL User (Role) for WApp
-- =====================================================
-- Este script crea un usuario de PostgreSQL (role) que la aplicación
-- usa para conectarse a la base de datos con los grants necesarios.
--
-- IMPORTANTE:
-- - Reemplaza 'app_user' y 'secure_password_here' con tus valores reales
-- - Usa contraseña fuerte en producción
-- - Ejecutar como superusuario (postgres)
--
-- Uso:
--   psql -U postgres -d neondb -f create-db-user.sql
-- =====================================================

-- =====================================================
-- 1. CREAR USUARIO/ROLE
-- =====================================================
-- Crea el usuario con contraseña y login habilitado
CREATE ROLE app_user WITH
  LOGIN
  PASSWORD 'secure_password_here'
  NOSUPERUSER
  NOCREATEDB
  NOCREATEROLE
  NOINHERIT;

-- =====================================================
-- 2. DAR PERMISOS A LA BASE DE DATOS
-- =====================================================
-- Permitir conexión a la base de datos
GRANT CONNECT ON DATABASE neondb TO app_user;

-- Permitir uso del schema público
GRANT USAGE ON SCHEMA public TO app_user;

-- =====================================================
-- 3. PERMISOS POR DEFECTO EN SCHEMA PUBLIC
-- =====================================================
-- Nuevas tablas/secuencias herendarán estos permisos
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO app_user;

-- =====================================================
-- 4. PERMISOS EN TABLAS EXISTENTES
-- =====================================================
-- Tablas de lectura/escritura (usuarios y configuración)
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_config TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_subscriptions TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_preferences TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON accounts TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON sessions TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON verification_codes TO app_user;

-- Tablas de sobres/billeteras/transacciones
GRANT SELECT, INSERT, UPDATE, DELETE ON sobres TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON billeteras TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON transacciones TO app_user;

-- Tablas de listas de compra
GRANT SELECT, INSERT, UPDATE, DELETE ON shopping_lists TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON shopping_list_items TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON shopping_executions TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON shopping_execution_items TO app_user;

-- Tablas de categorías
GRANT SELECT, INSERT, UPDATE, DELETE ON categorias TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON subcategorias TO app_user;

-- Tabla de marcas
GRANT SELECT, INSERT, UPDATE, DELETE ON marcas TO app_user;

-- Tabla de temas
GRANT SELECT, INSERT, UPDATE, DELETE ON themes TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_themes TO app_user;

-- Tabla de usuarios vinculados
GRANT SELECT, INSERT, UPDATE, DELETE ON linked_users TO app_user;

-- Tabla de códigos de invitación
GRANT SELECT, INSERT, UPDATE, DELETE ON invitation_codes TO app_user;

-- =====================================================
-- 5. PERMISOS EN TABLAS DE SOLO LECTURA
-- =====================================================
-- Datos de referencia (solo SELECT)
GRANT SELECT ON subscription_plans TO app_user;
GRANT SELECT ON monedas TO app_user;
GRANT SELECT ON product_catalog TO app_user;
GRANT SELECT ON product_categories_global TO app_user;
GRANT SELECT ON product_categories_user TO app_user;
GRANT SELECT ON product_user_custom TO app_user;

-- =====================================================
-- 6. PERMISOS EN SECUENCIAS
-- =====================================================
-- Permitir que el usuario use secuencias (para auto-increment)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- =====================================================
-- 7. PERMISOS EN FUNCIONES
-- =====================================================
-- Algunos triggers o procedimientos pueden requerir permisos
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO app_user;

-- =====================================================
-- 8. VERIFICACIÓN
-- =====================================================
-- Ver el usuario creado
SELECT * FROM pg_roles WHERE rolname = 'app_user';

-- Ver permisos otorgados
-- \du app_user

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
--
-- 1. CAMBIAR CONTRASEÑA:
--    ALTER ROLE app_user WITH PASSWORD 'nueva_contraseña';
--
-- 2. ELIMINAR USUARIO (peligroso, solo si es necesario):
--    DROP ROLE app_user;
--
-- 3. REVOCAR TODOS LOS PERMISOS:
--    REVOKE ALL ON ALL TABLES IN SCHEMA public FROM app_user;
--    REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM app_user;
--    REVOKE CONNECT ON DATABASE neondb FROM app_user;
--
-- 4. ENVIRONMENT VARIABLE para la app:
--    DATABASE_URL="postgresql://app_user:secure_password_here@localhost:5432/neondb"
--
-- 5. PARA PRODUCCIÓN:
--    - Usar contraseña fuerte (min 16 caracteres, alfanuméricos + especiales)
--    - Usar variables de entorno o secretos (no hardcoded)
--    - Cambiar nombre del usuario si es posible
--    - Limitar conexiones con max_connections en role
--
-- =====================================================
