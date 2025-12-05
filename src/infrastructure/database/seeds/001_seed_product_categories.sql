-- ============================================================================
-- SEED: Categorías Globales de Productos
-- ============================================================================
-- Categorías para productos de supermercado en Español e Inglés
-- Incluye color (hex) y emoji para UI

-- ============================================
-- SPANISH CATEGORIES (ESPAÑOL)
-- ============================================
DO $$
BEGIN
  -- Alimentos Frescos
  INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion)
  VALUES
    ('Frutas', 'es', '#FF6B6B', '🍎', 'Frutas frescas')
  ON CONFLICT (nombre, idioma) DO NOTHING;

  INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion)
  VALUES
    ('Verduras', 'es', '#4ECDC4', '🥦', 'Verduras y hortalizas')
  ON CONFLICT (nombre, idioma) DO NOTHING;

  INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion)
  VALUES
    ('Carnes', 'es', '#FF8C42', '🥩', 'Carnes rojas y aves')
  ON CONFLICT (nombre, idioma) DO NOTHING;

  INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion)
  VALUES
    ('Pescado y Mariscos', 'es', '#95A8D1', '🐟', 'Pescados y mariscos frescos')
  ON CONFLICT (nombre, idioma) DO NOTHING;

  -- Lácteos y Huevos
  INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion)
  VALUES
    ('Lácteos', 'es', '#FFF59D', '🥛', 'Leche, queso, yogur, mantequilla')
  ON CONFLICT (nombre, idioma) DO NOTHING;

  INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion)
  VALUES
    ('Huevos', 'es', '#FFEAA7', '🥚', 'Huevos de gallina y codorniz')
  ON CONFLICT (nombre, idioma) DO NOTHING;

  -- Despensa
  INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion)
  VALUES
    ('Granos y Cereales', 'es', '#D4A574', '🌾', 'Arroz, pasta, pan, cereales')
  ON CONFLICT (nombre, idioma) DO NOTHING;

  INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion)
  VALUES
    ('Aceites y Condimentos', 'es', '#FFD699', '🧂', 'Aceites, especias, condimentos, salsas')
  ON CONFLICT (nombre, idioma) DO NOTHING;

  INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion)
  VALUES
    ('Enlatados', 'es', '#C9ADA7', '🥫', 'Conservas y enlatados')
  ON CONFLICT (nombre, idioma) DO NOTHING;

  INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion)
  VALUES
    ('Harinas y Repostería', 'es', '#E8D5C4', '🍰', 'Harinas, levadura, repostería')
  ON CONFLICT (nombre, idioma) DO NOTHING;

  -- Bebidas
  INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion)
  VALUES
    ('Bebidas', 'es', '#A8E6CF', '🧃', 'Refrescos, jugos, agua')
  ON CONFLICT (nombre, idioma) DO NOTHING;

  INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion)
  VALUES
    ('Bebidas Alcohólicas', 'es', '#B8A9C9', '🍷', 'Vinos, cervezas, licores')
  ON CONFLICT (nombre, idioma) DO NOTHING;

  -- Congelados
  INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion)
  VALUES
    ('Productos Congelados', 'es', '#B8CCE4', '❄️', 'Alimentos congelados')
  ON CONFLICT (nombre, idioma) DO NOTHING;

  -- Snacks y Dulces
  INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion)
  VALUES
    ('Snacks', 'es', '#FFA07A', '🥨', 'Bocadillos y aperitivos')
  ON CONFLICT (nombre, idioma) DO NOTHING;

  INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion)
  VALUES
    ('Dulces y Chocolates', 'es', '#F8B4D9', '🍫', 'Dulces, chocolates, golosinas')
  ON CONFLICT (nombre, idioma) DO NOTHING;

  -- Higiene y Limpieza
  INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion)
  VALUES
    ('Higiene Personal', 'es', '#E6D5E8', '🧼', 'Jabón, champú, pasta de dientes')
  ON CONFLICT (nombre, idioma) DO NOTHING;

  INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion)
  VALUES
    ('Limpieza del Hogar', 'es', '#C5D9F1', '🧹', 'Productos de limpieza')
  ON CONFLICT (nombre, idioma) DO NOTHING;

  -- Bebé
  INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion)
  VALUES
    ('Bebé', 'es', '#FFE5E5', '👶', 'Productos para bebés')
  ON CONFLICT (nombre, idioma) DO NOTHING;

  -- Mascotas
  INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion)
  VALUES
    ('Mascotas', 'es', '#D4A5A5', '🐾', 'Alimento y productos para mascotas')
  ON CONFLICT (nombre, idioma) DO NOTHING;

  -- Otros
  INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion)
  VALUES
    ('Otros', 'es', '#D3D3D3', '📦', 'Otros productos')
  ON CONFLICT (nombre, idioma) DO NOTHING;

END $$;

-- ============================================
-- ENGLISH CATEGORIES (ENGLISH)
-- ============================================
DO $$
BEGIN
  -- Fresh Foods
  INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion)
  VALUES
    ('Fruits', 'en', '#FF6B6B', '🍎', 'Fresh fruits')
  ON CONFLICT (nombre, idioma) DO NOTHING;

  INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion)
  VALUES
    ('Vegetables', 'en', '#4ECDC4', '🥦', 'Vegetables and greens')
  ON CONFLICT (nombre, idioma) DO NOTHING;

  INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion)
  VALUES
    ('Meat', 'en', '#FF8C42', '🥩', 'Red and poultry meat')
  ON CONFLICT (nombre, idioma) DO NOTHING;

  INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion)
  VALUES
    ('Fish and Seafood', 'en', '#95A8D1', '🐟', 'Fresh fish and seafood')
  ON CONFLICT (nombre, idioma) DO NOTHING;

  -- Dairy and Eggs
  INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion)
  VALUES
    ('Dairy', 'en', '#FFF59D', '🥛', 'Milk, cheese, yogurt, butter')
  ON CONFLICT (nombre, idioma) DO NOTHING;

  INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion)
  VALUES
    ('Eggs', 'en', '#FFEAA7', '🥚', 'Chicken and quail eggs')
  ON CONFLICT (nombre, idioma) DO NOTHING;

  -- Pantry
  INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion)
  VALUES
    ('Grains and Cereals', 'en', '#D4A574', '🌾', 'Rice, pasta, bread, cereals')
  ON CONFLICT (nombre, idioma) DO NOTHING;

  INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion)
  VALUES
    ('Oils and Seasonings', 'en', '#FFD699', '🧂', 'Oils, spices, condiments, sauces')
  ON CONFLICT (nombre, idioma) DO NOTHING;

  INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion)
  VALUES
    ('Canned Foods', 'en', '#C9ADA7', '🥫', 'Preserves and canned goods')
  ON CONFLICT (nombre, idioma) DO NOTHING;

  INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion)
  VALUES
    ('Flours and Baking', 'en', '#E8D5C4', '🍰', 'Flours, yeast, baking supplies')
  ON CONFLICT (nombre, idioma) DO NOTHING;

  -- Beverages
  INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion)
  VALUES
    ('Beverages', 'en', '#A8E6CF', '🧃', 'Soft drinks, juices, water')
  ON CONFLICT (nombre, idioma) DO NOTHING;

  INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion)
  VALUES
    ('Alcoholic Beverages', 'en', '#B8A9C9', '🍷', 'Wines, beers, spirits')
  ON CONFLICT (nombre, idioma) DO NOTHING;

  -- Frozen
  INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion)
  VALUES
    ('Frozen Foods', 'en', '#B8CCE4', '❄️', 'Frozen foods')
  ON CONFLICT (nombre, idioma) DO NOTHING;

  -- Snacks and Sweets
  INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion)
  VALUES
    ('Snacks', 'en', '#FFA07A', '🥨', 'Snacks and appetizers')
  ON CONFLICT (nombre, idioma) DO NOTHING;

  INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion)
  VALUES
    ('Sweets and Chocolates', 'en', '#F8B4D9', '🍫', 'Candies, chocolates, treats')
  ON CONFLICT (nombre, idioma) DO NOTHING;

  -- Hygiene and Cleaning
  INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion)
  VALUES
    ('Personal Hygiene', 'en', '#E6D5E8', '🧼', 'Soap, shampoo, toothpaste')
  ON CONFLICT (nombre, idioma) DO NOTHING;

  INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion)
  VALUES
    ('Home Cleaning', 'en', '#C5D9F1', '🧹', 'Cleaning products')
  ON CONFLICT (nombre, idioma) DO NOTHING;

  -- Baby
  INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion)
  VALUES
    ('Baby', 'en', '#FFE5E5', '👶', 'Baby products')
  ON CONFLICT (nombre, idioma) DO NOTHING;

  -- Pets
  INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion)
  VALUES
    ('Pets', 'en', '#D4A5A5', '🐾', 'Pet food and supplies')
  ON CONFLICT (nombre, idioma) DO NOTHING;

  -- Other
  INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion)
  VALUES
    ('Other', 'en', '#D3D3D3', '📦', 'Other products')
  ON CONFLICT (nombre, idioma) DO NOTHING;

END $$;
