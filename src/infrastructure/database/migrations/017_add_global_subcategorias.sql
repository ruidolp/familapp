-- Add Global Subcategorias (Marcas/Brands)
-- Tabla global de marcas/empresas por país para autocompletado

-- ============================================
-- SUBCATEGORIAS GLOBALES (Marcas/Empresas)
-- ============================================
CREATE TABLE IF NOT EXISTS subcategorias_globales (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  nombre VARCHAR(255) NOT NULL,
  pais VARCHAR(10) NOT NULL, -- 'CL', 'AR', 'PE', 'MX', etc.
  categoria_tipo VARCHAR(100), -- 'Alimentación', 'Transporte', 'Servicios', 'Entretenimiento', etc.
  emoji VARCHAR(10),
  imagen_url TEXT, -- URL del logo (futuro)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_subcategorias_globales_pais ON subcategorias_globales(pais) WHERE deleted_at IS NULL;
CREATE INDEX idx_subcategorias_globales_categoria_tipo ON subcategorias_globales(categoria_tipo) WHERE deleted_at IS NULL;
CREATE INDEX idx_subcategorias_globales_nombre ON subcategorias_globales(nombre) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_subcategorias_globales_unique ON subcategorias_globales(LOWER(nombre), pais) WHERE deleted_at IS NULL;

-- ============================================
-- SEED MARCAS CHILE
-- ============================================
INSERT INTO subcategorias_globales (nombre, pais, categoria_tipo, emoji) VALUES
  -- Alimentación / Restaurantes
  ('McDonald''s', 'CL', 'Alimentación', '🍔'),
  ('Burger King', 'CL', 'Alimentación', '🍔'),
  ('Starbucks', 'CL', 'Alimentación', '☕'),
  ('Juan Maestro', 'CL', 'Alimentación', '☕'),
  ('Subway', 'CL', 'Alimentación', '🥪'),
  ('KFC', 'CL', 'Alimentación', '🍗'),
  ('Domino''s Pizza', 'CL', 'Alimentación', '🍕'),
  ('Papa John''s', 'CL', 'Alimentación', '🍕'),
  ('Dunkin''', 'CL', 'Alimentación', '🍩'),

  -- Supermercados
  ('Jumbo', 'CL', 'Alimentación', '🛒'),
  ('Lider', 'CL', 'Alimentación', '🛒'),
  ('Tottus', 'CL', 'Alimentación', '🛒'),
  ('Santa Isabel', 'CL', 'Alimentación', '🛒'),
  ('Unimarc', 'CL', 'Alimentación', '🛒'),
  ('Acuenta', 'CL', 'Alimentación', '🛒'),

  -- Transporte
  ('Uber', 'CL', 'Transporte', '🚗'),
  ('Cabify', 'CL', 'Transporte', '🚗'),
  ('DiDi', 'CL', 'Transporte', '🚗'),
  ('Beat', 'CL', 'Transporte', '🚗'),
  ('Copec', 'CL', 'Transporte', '⛽'),
  ('Shell', 'CL', 'Transporte', '⛽'),
  ('Petrobras', 'CL', 'Transporte', '⛽'),
  ('Enex', 'CL', 'Transporte', '⛽'),
  ('Metro de Santiago', 'CL', 'Transporte', '🚇'),

  -- Servicios
  ('Movistar', 'CL', 'Servicios', '📱'),
  ('Entel', 'CL', 'Servicios', '📱'),
  ('Claro', 'CL', 'Servicios', '📱'),
  ('WOM', 'CL', 'Servicios', '📱'),
  ('VTR', 'CL', 'Servicios', '📺'),
  ('Enel', 'CL', 'Servicios', '💡'),
  ('CGE', 'CL', 'Servicios', '💡'),
  ('Aguas Andinas', 'CL', 'Servicios', '💧'),
  ('Essbio', 'CL', 'Servicios', '💧'),

  -- Entretenimiento
  ('Netflix', 'CL', 'Entretenimiento', '🎬'),
  ('Disney+', 'CL', 'Entretenimiento', '🎬'),
  ('HBO Max', 'CL', 'Entretenimiento', '🎬'),
  ('Amazon Prime', 'CL', 'Entretenimiento', '🎬'),
  ('Spotify', 'CL', 'Entretenimiento', '🎵'),
  ('YouTube Premium', 'CL', 'Entretenimiento', '📺'),
  ('Cinemark', 'CL', 'Entretenimiento', '🎥'),
  ('Cineplanet', 'CL', 'Entretenimiento', '🎥'),
  ('Cinépolis', 'CL', 'Entretenimiento', '🎥'),

  -- Retail / Tiendas
  ('Falabella', 'CL', 'Retail', '🏬'),
  ('Paris', 'CL', 'Retail', '🏬'),
  ('Ripley', 'CL', 'Retail', '🏬'),
  ('La Polar', 'CL', 'Retail', '🏬'),
  ('Hites', 'CL', 'Retail', '🏬'),
  ('Easy', 'CL', 'Retail', '🔨'),
  ('Sodimac', 'CL', 'Retail', '🔨'),
  ('MercadoLibre', 'CL', 'Retail', '📦'),
  ('AliExpress', 'CL', 'Retail', '📦'),

  -- Salud
  ('Cruz Verde', 'CL', 'Salud', '💊'),
  ('Salcobrand', 'CL', 'Salud', '💊'),
  ('Farmacias Ahumada', 'CL', 'Salud', '💊'),
  ('Dr. Simi', 'CL', 'Salud', '💊'),

  -- Otros
  ('Rappi', 'CL', 'Servicios', '🛵'),
  ('PedidosYa', 'CL', 'Servicios', '🛵'),
  ('Cornershop', 'CL', 'Servicios', '🛵')
ON CONFLICT DO NOTHING;

-- ============================================
-- TRIGGER para updated_at
-- ============================================
CREATE TRIGGER update_subcategorias_globales_updated_at
BEFORE UPDATE ON subcategorias_globales
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
