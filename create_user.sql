-- =====================================================
-- Script: Create New User in Database
-- =====================================================
-- Este script crea un nuevo usuario completo en la base de datos
-- con toda la configuración necesaria para que funcione correctamente
--
-- IMPORTANTE:
-- - Reemplaza los valores entre <> con los datos reales
-- - La contraseña debe estar hasheada con bcrypt (ver instrucciones abajo)
-- - Ejecutar como superusuario o usuario con permisos DDL/DML
--
-- =====================================================

-- =====================================================
-- 1. CREAR EL USUARIO
-- =====================================================
-- Reemplaza los siguientes valores:
-- <name>: Nombre del usuario (ej: "Juan Pérez")
-- <email>: Email único (ej: "juan@example.com")
-- <hashed_password>: Contraseña hasheada con bcrypt (ver abajo)
-- <phone>: Teléfono (opcional, puede ser NULL)

INSERT INTO users (
  name,
  email,
  email_verified,
  phone,
  phone_verified,
  password,
  account_type,
  created_at,
  updated_at
) VALUES (
  '<name>',
  '<email>',
  CURRENT_TIMESTAMP,  -- Email verificado automáticamente
  '<phone>',
  NULL,               -- Teléfono no verificado
  '<hashed_password>',
  'EMAIL',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
RETURNING id INTO user_id;

-- Almacenar el ID para uso posterior
\set user_id '<id-generado-aqui>'

-- =====================================================
-- 2. CREAR CONFIGURACIÓN DE USUARIO
-- =====================================================
-- Configura el locale, timezone, moneda principal y preferencias regionales

INSERT INTO user_config (
  user_id,
  moneda_principal_id,
  monedas_habilitadas,
  timezone,
  locale,
  primer_dia_semana,
  tipo_periodo,
  dia_inicio_periodo,
  created_at,
  updated_at
) VALUES (
  :<user_id>,
  'CLP',                          -- Moneda principal (CLP, USD, EUR, UF)
  ARRAY['CLP'],                   -- Monedas habilitadas
  'America/Santiago',             -- Timezone (cambiar según país)
  'es-CL',                        -- Locale (es-CL, es-MX, es-AR, en-US)
  1,                              -- 0=Domingo, 1=Lunes
  'MENSUAL',                      -- SEMANAL, QUINCENAL, MENSUAL, CUSTOM
  1,                              -- Día de inicio del período (1-31)
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- 3. CREAR SUSCRIPCIÓN (Plan FREE)
-- =====================================================
-- Asigna el plan FREE automáticamente

INSERT INTO user_subscriptions (
  user_id,
  plan_id,
  status,
  platform,
  period,
  started_at,
  expires_at,
  trial_ends_at,
  created_at,
  updated_at
) VALUES (
  :<user_id>,
  (SELECT id FROM subscription_plans WHERE slug = 'free' LIMIT 1),
  'free',
  'web',
  'monthly',
  CURRENT_TIMESTAMP,
  NULL,
  NULL,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 4. CREAR PREFERENCIAS DE USUARIO
-- =====================================================
-- Configura preferencias de listas de compra

INSERT INTO user_preferences (
  user_id,
  show_inline_qty,
  group_by_category,
  quick_list_mode,
  created_at,
  updated_at
) VALUES (
  :<user_id>,
  true,                           -- Mostrar edición inline de cantidad
  false,                          -- No agrupar por categoría (default)
  false,                          -- No usar modo quick list (default)
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- 5. CREAR BILLETERA POR DEFECTO (EFECTIVO)
-- =====================================================
-- La aplicación puede crear una automáticamente, pero aquí está el script

INSERT INTO billeteras (
  nombre,
  tipo,
  moneda_principal_id,
  saldo_real,
  saldo_proyectado,
  color,
  emoji,
  is_compartida,
  usuario_id,
  created_at,
  updated_at
) VALUES (
  'Efectivo',                     -- Nombre de la billetera
  'EFECTIVO',                     -- Tipo: EFECTIVO, DEBITO, TARJETA_CREDITO, etc.
  'CLP',                          -- Moneda principal
  0,                              -- Saldo inicial
  0,
  '#FF6B6B',                      -- Color en hex (rojo)
  '💵',                           -- Emoji
  false,                          -- No compartida
  :<user_id>,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- =====================================================
-- 6. VERIFICAR QUE TODO ESTÁ CORRECTO
-- =====================================================

SELECT 'Usuario creado exitosamente' as resultado;
SELECT * FROM users WHERE id = :<user_id>;
SELECT * FROM user_config WHERE user_id = :<user_id>;
SELECT * FROM user_preferences WHERE user_id = :<user_id>;
SELECT * FROM user_subscriptions WHERE user_id = :<user_id>;
SELECT * FROM billeteras WHERE usuario_id = :<user_id>;

-- =====================================================
-- INSTRUCCIONES DE CONTRASEÑA HASHEADA
-- =====================================================
--
-- Para generar una contraseña hasheada con bcrypt desde Node.js:
--
-- const bcrypt = require('bcryptjs');
-- const password = 'password123';
-- const hashedPassword = await bcrypt.hash(password, 10);
-- console.log(hashedPassword);
--
-- Resultado ejemplo: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/LLK
--
-- O usar esta función SQL de PostgreSQL (menos seguro):
-- SELECT crypt('password123', gen_salt('bf', 10));
--
-- =====================================================
-- PERMISOS DE BASE DE DATOS NECESARIOS
-- =====================================================
--
-- Si el usuario de la aplicación tiene permisos limitados, asegurar que tiene:
--
-- -- Lectura de usuarios
-- GRANT SELECT ON users TO app_user;
--
-- -- Lectura/Escritura de configuración
-- GRANT SELECT, INSERT, UPDATE ON user_config TO app_user;
--
-- -- Lectura/Escritura de suscripciones
-- GRANT SELECT, INSERT, UPDATE ON user_subscriptions TO app_user;
--
-- -- Lectura/Escritura de preferencias
-- GRANT SELECT, INSERT, UPDATE ON user_preferences TO app_user;
--
-- -- Lectura/Escritura de billeteras
-- GRANT SELECT, INSERT, UPDATE ON billeteras TO app_user;
--
-- -- Lectura de monedas (solo lectura)
-- GRANT SELECT ON monedas TO app_user;
--
-- -- Lectura de planes de suscripción (solo lectura)
-- GRANT SELECT ON subscription_plans TO app_user;
--
-- =====================================================
-- TROUBLESHOOTING
-- =====================================================
--
-- 1. Error "duplicate key value violates unique constraint":
--    → El email ya existe. Usar un email único.
--
-- 2. Error "foreign key constraint":
--    → El plan 'free' o la moneda 'CLP' no existen.
--    → Ejecutar las migraciones primero: npm run db:migrate
--
-- 3. No aparece el usuario_id después de INSERT:
--    → Ejecutar antes: SELECT id FROM users WHERE email = '<email>';
--
-- =====================================================
