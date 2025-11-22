-- ============================================================================
-- SEED: Categorías Globales de Productos (Español)
-- ============================================================================
-- Categorías para productos de supermercado en español

-- Usar DO block para evitar duplicados basado en LOWER(nombre)
DO $$
BEGIN
  -- Alimentos Frescos
  IF NOT EXISTS (SELECT 1 FROM product_categories_global WHERE LOWER(nombre) = 'frutas' AND idioma = 'es' AND deleted_at IS NULL) THEN
    INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion) VALUES ('Frutas', 'es', '#FF6B6B', '🍎', 'Frutas frescas');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM product_categories_global WHERE LOWER(nombre) = 'verduras' AND idioma = 'es' AND deleted_at IS NULL) THEN
    INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion) VALUES ('Verduras', 'es', '#4ECDC4', '🥦', 'Verduras y hortalizas');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM product_categories_global WHERE LOWER(nombre) = 'carnes' AND idioma = 'es' AND deleted_at IS NULL) THEN
    INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion) VALUES ('Carnes', 'es', '#FF8C42', '🥩', 'Carnes rojas y aves');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM product_categories_global WHERE LOWER(nombre) = 'pescado y mariscos' AND idioma = 'es' AND deleted_at IS NULL) THEN
    INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion) VALUES ('Pescado y Mariscos', 'es', '#95A8D1', '🐟', 'Pescados y mariscos frescos');
  END IF;

  -- Lácteos y Huevos
  IF NOT EXISTS (SELECT 1 FROM product_categories_global WHERE LOWER(nombre) = 'lácteos' AND idioma = 'es' AND deleted_at IS NULL) THEN
    INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion) VALUES ('Lácteos', 'es', '#FFF59D', '🥛', 'Leche, queso, yogur, mantequilla');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM product_categories_global WHERE LOWER(nombre) = 'huevos' AND idioma = 'es' AND deleted_at IS NULL) THEN
    INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion) VALUES ('Huevos', 'es', '#FFEAA7', '🥚', 'Huevos de gallina y codorniz');
  END IF;

  -- Despensa
  IF NOT EXISTS (SELECT 1 FROM product_categories_global WHERE LOWER(nombre) = 'granos y cereales' AND idioma = 'es' AND deleted_at IS NULL) THEN
    INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion) VALUES ('Granos y Cereales', 'es', '#D4A574', '🌾', 'Arroz, pasta, pan, cereales');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM product_categories_global WHERE LOWER(nombre) = 'aceites y condimentos' AND idioma = 'es' AND deleted_at IS NULL) THEN
    INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion) VALUES ('Aceites y Condimentos', 'es', '#FFD699', '🧂', 'Aceites, especias, condimentos, salsas');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM product_categories_global WHERE LOWER(nombre) = 'enlatados' AND idioma = 'es' AND deleted_at IS NULL) THEN
    INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion) VALUES ('Enlatados', 'es', '#C9ADA7', '🥫', 'Conservas y enlatados');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM product_categories_global WHERE LOWER(nombre) = 'harinas y repostería' AND idioma = 'es' AND deleted_at IS NULL) THEN
    INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion) VALUES ('Harinas y Repostería', 'es', '#E8D5C4', '🍰', 'Harinas, levadura, repostería');
  END IF;

  -- Bebidas
  IF NOT EXISTS (SELECT 1 FROM product_categories_global WHERE LOWER(nombre) = 'bebidas' AND idioma = 'es' AND deleted_at IS NULL) THEN
    INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion) VALUES ('Bebidas', 'es', '#A8E6CF', '🧃', 'Refrescos, jugos, agua');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM product_categories_global WHERE LOWER(nombre) = 'bebidas alcohólicas' AND idioma = 'es' AND deleted_at IS NULL) THEN
    INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion) VALUES ('Bebidas Alcohólicas', 'es', '#B8A9C9', '🍷', 'Vinos, cervezas, licores');
  END IF;

  -- Congelados
  IF NOT EXISTS (SELECT 1 FROM product_categories_global WHERE LOWER(nombre) = 'productos congelados' AND idioma = 'es' AND deleted_at IS NULL) THEN
    INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion) VALUES ('Productos Congelados', 'es', '#B8CCE4', '❄️', 'Alimentos congelados');
  END IF;

  -- Snacks y Dulces
  IF NOT EXISTS (SELECT 1 FROM product_categories_global WHERE LOWER(nombre) = 'snacks' AND idioma = 'es' AND deleted_at IS NULL) THEN
    INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion) VALUES ('Snacks', 'es', '#FFA07A', '🥨', 'Bocadillos y aperitivos');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM product_categories_global WHERE LOWER(nombre) = 'dulces y chocolates' AND idioma = 'es' AND deleted_at IS NULL) THEN
    INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion) VALUES ('Dulces y Chocolates', 'es', '#F8B4D9', '🍫', 'Dulces, chocolates, golosinas');
  END IF;

  -- Higiene y Limpieza
  IF NOT EXISTS (SELECT 1 FROM product_categories_global WHERE LOWER(nombre) = 'higiene personal' AND idioma = 'es' AND deleted_at IS NULL) THEN
    INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion) VALUES ('Higiene Personal', 'es', '#E6D5E8', '🧼', 'Jabón, champú, pasta de dientes');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM product_categories_global WHERE LOWER(nombre) = 'limpieza del hogar' AND idioma = 'es' AND deleted_at IS NULL) THEN
    INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion) VALUES ('Limpieza del Hogar', 'es', '#C5D9F1', '🧹', 'Productos de limpieza');
  END IF;

  -- Bebé
  IF NOT EXISTS (SELECT 1 FROM product_categories_global WHERE LOWER(nombre) = 'bebé' AND idioma = 'es' AND deleted_at IS NULL) THEN
    INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion) VALUES ('Bebé', 'es', '#FFE5E5', '👶', 'Productos para bebés');
  END IF;

  -- Mascotas
  IF NOT EXISTS (SELECT 1 FROM product_categories_global WHERE LOWER(nombre) = 'mascotas' AND idioma = 'es' AND deleted_at IS NULL) THEN
    INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion) VALUES ('Mascotas', 'es', '#D4A5A5', '🐾', 'Alimento y productos para mascotas');
  END IF;

  -- Otros
  IF NOT EXISTS (SELECT 1 FROM product_categories_global WHERE LOWER(nombre) = 'otros' AND idioma = 'es' AND deleted_at IS NULL) THEN
    INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion) VALUES ('Otros', 'es', '#D3D3D3', '📦', 'Otros productos');
  END IF;
END $$;
