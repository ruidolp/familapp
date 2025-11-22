-- 028_seed_subcategorias_globales_cl.sql
-- Seed de 100 marcas chilenas en subcategorias_globales

BEGIN;

INSERT INTO subcategorias_globales (nombre, pais, categoria_tipo, emoji) VALUES
  -- Supermercados / Abarrotes
  ('Mayorista 10', 'CL', 'Alimentación', '🛒'),
  ('Alvi', 'CL', 'Alimentación', '🛒'),
  ('Ekono', 'CL', 'Alimentación', '🛒'),
  ('OK Market', 'CL', 'Alimentación', '🛒'),
  ('Central Mayorista', 'CL', 'Alimentación', '🛒'),
  ('Montserrat', 'CL', 'Alimentación', '🛒'),
  ('Cugat', 'CL', 'Alimentación', '🛒'),
  ('San Francisco Supermercados', 'CL', 'Alimentación', '🛒'),
  ('El Trébol Supermercados', 'CL', 'Alimentación', '🛒'),
  ('Los Héroes Market', 'CL', 'Alimentación', '🛒'),
  ('Supermercado El 9', 'CL', 'Alimentación', '🛒'),
  ('Ahorra Más Market', 'CL', 'Alimentación', '🛒'),
  ('Supermercado Los Andes', 'CL', 'Alimentación', '🛒'),
  ('Supermercado San Pedro', 'CL', 'Alimentación', '🛒'),
  ('Supermercado Doña Luisa', 'CL', 'Alimentación', '🛒'),
  ('Supermercado El 14', 'CL', 'Alimentación', '🛒'),
  ('Supermercado Don Pepe', 'CL', 'Alimentación', '🛒'),
  ('Supermercado La Fama', 'CL', 'Alimentación', '🛒'),
  ('Supermercado La Oferta', 'CL', 'Alimentación', '🛒'),
  ('Supermercado Los Aromos', 'CL', 'Alimentación', '🛒'),
  ('Supermercado Los Carrera', 'CL', 'Alimentación', '🛒'),

  -- Retail / Vestuario / Calzado
  ('Adidas', 'CL', 'Retail', '👟'),
  ('Nike', 'CL', 'Retail', '👟'),
  ('Puma', 'CL', 'Retail', '👟'),
  ('Skechers', 'CL', 'Retail', '👟'),
  ('Hush Puppies', 'CL', 'Retail', '👞'),
  ('Colloky', 'CL', 'Retail', '🧒'),
  ('Zara', 'CL', 'Retail', '👗'),
  ('H&M', 'CL', 'Retail', '👚'),
  ('American Eagle', 'CL', 'Retail', '👕'),
  ('Tricot', 'CL', 'Retail', '👗'),
  ('Corona', 'CL', 'Retail', '👜'),
  ('Chevignon', 'CL', 'Retail', '🧥'),
  ('Levi''s', 'CL', 'Retail', '👖'),
  ('Gap', 'CL', 'Retail', '👖'),
  ('Patagonia', 'CL', 'Retail', '🧥'),
  ('The North Face', 'CL', 'Retail', '🧥'),
  ('Salomon', 'CL', 'Retail', '🥾'),
  ('Columbia', 'CL', 'Retail', '🥾'),
  ('CAT Store', 'CL', 'Retail', '🥾'),
  ('Lippi', 'CL', 'Retail', '🥾'),
  ('Casaideas', 'CL', 'Retail', '🏠'),
  ('Abcdin', 'CL', 'Retail', '🏬'),
  ('Sparta', 'CL', 'Retail', '🏋️'),
  ('PC Factory', 'CL', 'Retail', '💻'),
  ('WePlay', 'CL', 'Retail', '🎮'),
  ('Reifstore', 'CL', 'Retail', '👟'),

  -- Telecom / Servicios
  ('Gtd', 'CL', 'Servicios', '📶'),
  ('Mundo Pacífico', 'CL', 'Servicios', '📶'),
  ('Telsur', 'CL', 'Servicios', '📞'),
  ('Entel Hogar', 'CL', 'Servicios', '📱'),
  ('Claro Hogar', 'CL', 'Servicios', '📱'),
  ('Virgin Mobile', 'CL', 'Servicios', '📱'),
  ('Simple Mobile CL', 'CL', 'Servicios', '📱'),
  ('Netline', 'CL', 'Servicios', '📶'),

  -- Servicios básicos (luz / agua / gas)
  ('Chilquinta', 'CL', 'Servicios', '💡'),
  ('Saesa', 'CL', 'Servicios', '💡'),
  ('Frontel', 'CL', 'Servicios', '💡'),
  ('Luz Osorno', 'CL', 'Servicios', '💡'),
  ('Nueva Atacama', 'CL', 'Servicios', '💧'),
  ('Esval', 'CL', 'Servicios', '💧'),
  ('Smapa', 'CL', 'Servicios', '💧'),
  ('Metrogas', 'CL', 'Servicios', '🔥'),
  ('Gasco', 'CL', 'Servicios', '🔥'),
  ('Lipigas', 'CL', 'Servicios', '🔥'),
  ('Abastible', 'CL', 'Servicios', '🔥'),

  -- Bencineras / Combustible
  ('Terpel', 'CL', 'Transporte', '⛽'),
  ('Gulf', 'CL', 'Transporte', '⛽'),
  ('PetroChile', 'CL', 'Transporte', '⛽'),
  ('Esmax', 'CL', 'Transporte', '⛽'),
  ('Pronto Copec', 'CL', 'Transporte', '☕'),

  -- Delivery / e-commerce
  ('Uber Eats', 'CL', 'Servicios', '🛵'),
  ('Justo', 'CL', 'Servicios', '🛵'),
  ('Didi Food', 'CL', 'Servicios', '🛵'),
  ('Fazil', 'CL', 'Servicios', '🛵'),
  ('PedidosYa Market', 'CL', 'Servicios', '🛵'),

  -- Comida rápida / restaurantes
  ('Telepizza', 'CL', 'Alimentación', '🍕'),
  ('Pizza Hut', 'CL', 'Alimentación', '🍕'),
  ('Doggis', 'CL', 'Alimentación', '🌭'),
  ('Pedro Juan y Diego', 'CL', 'Alimentación', '🥪'),
  ('Juan Valdez Cafe', 'CL', 'Alimentación', '☕'),
  ('Pollo Stop', 'CL', 'Alimentación', '🍗'),
  ('Mr. Sushi', 'CL', 'Alimentación', '🍣'),
  ('Sushi House', 'CL', 'Alimentación', '🍣'),
  ('PF Chang''s', 'CL', 'Alimentación', '🥢'),
  ('Carls Jr', 'CL', 'Alimentación', '🍔'),
  ('Castaño', 'CL', 'Alimentación', '🥐'),
  ('China Wok', 'CL', 'Alimentación', '🥡'),
  ('Tavelli', 'CL', 'Alimentación', '☕'),

  -- Farmacias / Salud
  ('Farmacias Knop', 'CL', 'Salud', '💊'),
  ('Farmacia Dr. Ahorro', 'CL', 'Salud', '💊'),
  ('Farmacias La Botica', 'CL', 'Salud', '💊'),
  ('Farmacias Redfarma', 'CL', 'Salud', '💊'),
  ('Farmacias Mapuche', 'CL', 'Salud', '💊'),

  -- Streaming / Entretenimiento
  ('Star+', 'CL', 'Entretenimiento', '🎬'),
  ('Paramount+', 'CL', 'Entretenimiento', '🎬'),
  ('Apple TV+', 'CL', 'Entretenimiento', '📺'),
  ('Deezer', 'CL', 'Entretenimiento', '🎵'),
  ('Pluto TV', 'CL', 'Entretenimiento', '📺')
ON CONFLICT (LOWER(nombre), pais) WHERE deleted_at IS NULL DO NOTHING;

COMMIT;
