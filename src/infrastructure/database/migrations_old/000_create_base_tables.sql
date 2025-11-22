-- Migration: Create Base Authentication Tables
-- Description: Crea todas las tablas base del sistema con DEFAULT gen_random_uuid()
-- Date: 2025-11-06
-- Important: Este script usa gen_random_uuid() en vez de crypto.randomUUID() para compatibilidad con mobile

-- =====================================================
-- ENABLE EXTENSIONS
-- =====================================================

-- Habilitar extensión para gen_random_uuid() (PostgreSQL 13+)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUMS
-- =====================================================

-- Tipo de cuenta (email o teléfono)
CREATE TYPE account_type AS ENUM ('EMAIL', 'PHONE');

-- Tipo de código de verificación
CREATE TYPE verification_code_type AS ENUM (
  'EMAIL_CONFIRMATION',
  'PHONE_CONFIRMATION',
  'PASSWORD_RESET'
);

-- Estado del código de verificación
CREATE TYPE verification_code_status AS ENUM ('PENDING', 'USED', 'EXPIRED');

-- =====================================================
-- TABLA: users
-- =====================================================

CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  email_verified TIMESTAMP,
  phone TEXT UNIQUE,
  phone_verified TIMESTAMP,
  image TEXT,
  password TEXT,
  account_type account_type NOT NULL DEFAULT 'EMAIL',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMP,

  -- Constraints
  CONSTRAINT users_email_or_phone_check CHECK (
    (email IS NOT NULL AND email != '') OR
    (phone IS NOT NULL AND phone != '')
  )
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_users_created_at ON users(created_at);

COMMENT ON TABLE users IS 'Usuarios del sistema con soporte para email y teléfono';
COMMENT ON COLUMN users.id IS 'ID único generado por PostgreSQL (TEXT para compatibilidad)';
COMMENT ON COLUMN users.account_type IS 'Tipo de cuenta primaria (EMAIL o PHONE)';
COMMENT ON COLUMN users.email_verified IS 'Fecha de verificación del email (NULL si no verificado)';
COMMENT ON COLUMN users.phone_verified IS 'Fecha de verificación del teléfono (NULL si no verificado)';

-- =====================================================
-- TABLA: accounts (OAuth providers)
-- =====================================================

CREATE TABLE accounts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Un usuario puede tener solo una cuenta por provider
  UNIQUE(provider, provider_account_id)
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_provider ON accounts(provider, provider_account_id);

COMMENT ON TABLE accounts IS 'Cuentas OAuth vinculadas (Google, Facebook, etc.)';
COMMENT ON COLUMN accounts.provider IS 'Proveedor OAuth (google, facebook, etc.)';
COMMENT ON COLUMN accounts.provider_account_id IS 'ID del usuario en el proveedor';

-- =====================================================
-- TABLA: sessions
-- =====================================================

CREATE TABLE sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  session_token TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_session_token ON sessions(session_token);
CREATE INDEX idx_sessions_expires ON sessions(expires);

COMMENT ON TABLE sessions IS 'Sesiones activas de usuarios (NextAuth)';
COMMENT ON COLUMN sessions.session_token IS 'Token único de sesión';
COMMENT ON COLUMN sessions.expires IS 'Fecha de expiración de la sesión';

-- =====================================================
-- TABLA: verification_tokens
-- =====================================================

CREATE TABLE verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires TIMESTAMP NOT NULL,

  PRIMARY KEY (identifier, token)
);

CREATE INDEX idx_verification_tokens_token ON verification_tokens(token);
CREATE INDEX idx_verification_tokens_expires ON verification_tokens(expires);

COMMENT ON TABLE verification_tokens IS 'Tokens de verificación para NextAuth (email magic links)';
COMMENT ON COLUMN verification_tokens.identifier IS 'Email o identificador del usuario';
COMMENT ON COLUMN verification_tokens.token IS 'Token único de verificación';

-- =====================================================
-- TABLA: verification_codes
-- =====================================================

CREATE TABLE verification_codes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  type verification_code_type NOT NULL,
  status verification_code_status NOT NULL DEFAULT 'PENDING',
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_verification_codes_user_id ON verification_codes(user_id);
CREATE INDEX idx_verification_codes_code ON verification_codes(code);
CREATE INDEX idx_verification_codes_type ON verification_codes(type);
CREATE INDEX idx_verification_codes_status ON verification_codes(status);
CREATE INDEX idx_verification_codes_expires ON verification_codes(expires_at);

COMMENT ON TABLE verification_codes IS 'Códigos de verificación personalizados (email, SMS, password reset)';
COMMENT ON COLUMN verification_codes.code IS 'Código de verificación (6 dígitos)';
COMMENT ON COLUMN verification_codes.type IS 'Tipo de verificación';
COMMENT ON COLUMN verification_codes.status IS 'Estado del código';

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verification_codes_updated_at
  BEFORE UPDATE ON verification_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SECURITY
-- =====================================================

-- RLS (Row Level Security) puede ser habilitado después según necesidades
-- Por ahora, la seguridad se maneja en la capa de aplicación

COMMENT ON EXTENSION pgcrypto IS 'Extension para gen_random_uuid() compatible con todos los entornos';
