-- ============================================================================
-- SEED: Catálogo Básico de Productos (Español)
-- ============================================================================
-- Productos comunes de supermercado en español para autocompletado
-- NOTA: category_id se deja NULL ya que es una referencia sin FK

INSERT INTO product_catalog (nombre, idioma, descripcion) VALUES
  -- Frutas
  ('Manzana', 'es', 'Manzana roja o verde'),
  ('Plátano', 'es', 'Plátano o banana'),
  ('Naranja', 'es', 'Naranja'),
  ('Pera', 'es', 'Pera'),
  ('Uva', 'es', 'Uva verde o morada'),
  ('Sandía', 'es', 'Sandía'),
  ('Melón', 'es', 'Melón'),
  ('Frutilla', 'es', 'Frutilla o fresa'),
  ('Kiwi', 'es', 'Kiwi'),
  ('Palta', 'es', 'Palta o aguacate'),

  -- Verduras
  ('Lechuga', 'es', 'Lechuga'),
  ('Tomate', 'es', 'Tomate'),
  ('Cebolla', 'es', 'Cebolla'),
  ('Papa', 'es', 'Papa o patata'),
  ('Zanahoria', 'es', 'Zanahoria'),
  ('Pimentón', 'es', 'Pimentón o pimiento'),
  ('Ajo', 'es', 'Ajo'),
  ('Brócoli', 'es', 'Brócoli'),
  ('Zapallo', 'es', 'Zapallo o calabaza'),
  ('Apio', 'es', 'Apio'),

  -- Carnes
  ('Pollo', 'es', 'Pollo'),
  ('Carne de vacuno', 'es', 'Carne de vacuno o res'),
  ('Carne de cerdo', 'es', 'Carne de cerdo'),
  ('Pavo', 'es', 'Pavo'),

  -- Pescado
  ('Salmón', 'es', 'Salmón'),
  ('Atún', 'es', 'Atún'),
  ('Merluza', 'es', 'Merluza'),

  -- Lácteos
  ('Leche', 'es', 'Leche'),
  ('Queso', 'es', 'Queso'),
  ('Yogur', 'es', 'Yogur'),
  ('Mantequilla', 'es', 'Mantequilla'),
  ('Crema', 'es', 'Crema de leche'),

  -- Huevos
  ('Huevos', 'es', 'Huevos'),

  -- Granos y Cereales
  ('Arroz', 'es', 'Arroz'),
  ('Fideos', 'es', 'Fideos o pasta'),
  ('Pan', 'es', 'Pan'),
  ('Harina', 'es', 'Harina de trigo'),
  ('Avena', 'es', 'Avena'),
  ('Cereales', 'es', 'Cereales para desayuno'),

  -- Aceites y Condimentos
  ('Aceite', 'es', 'Aceite vegetal'),
  ('Sal', 'es', 'Sal'),
  ('Azúcar', 'es', 'Azúcar'),
  ('Pimienta', 'es', 'Pimienta'),
  ('Mayonesa', 'es', 'Mayonesa'),
  ('Ketchup', 'es', 'Salsa de tomate ketchup'),
  ('Mostaza', 'es', 'Mostaza'),
  ('Vinagre', 'es', 'Vinagre'),

  -- Enlatados
  ('Atún enlatado', 'es', 'Atún en lata'),
  ('Arvejas enlatadas', 'es', 'Arvejas en lata'),
  ('Choclo enlatado', 'es', 'Choclo o maíz en lata'),
  ('Tomate en lata', 'es', 'Tomate en conserva'),

  -- Bebidas
  ('Agua mineral', 'es', 'Agua mineral'),
  ('Jugo', 'es', 'Jugo o zumo'),
  ('Bebida', 'es', 'Bebida o refresco'),
  ('Café', 'es', 'Café'),
  ('Té', 'es', 'Té'),

  -- Congelados
  ('Helado', 'es', 'Helado'),
  ('Verduras congeladas', 'es', 'Verduras congeladas'),
  ('Pescado congelado', 'es', 'Pescado congelado'),

  -- Snacks
  ('Papas fritas', 'es', 'Papas fritas de paquete'),
  ('Galletas', 'es', 'Galletas'),
  ('Chocolate', 'es', 'Chocolate'),
  ('Caramelos', 'es', 'Caramelos o dulces'),

  -- Higiene
  ('Jabón', 'es', 'Jabón'),
  ('Champú', 'es', 'Champú o shampoo'),
  ('Pasta de dientes', 'es', 'Pasta de dientes'),
  ('Papel higiénico', 'es', 'Papel higiénico'),

  -- Limpieza
  ('Detergente', 'es', 'Detergente para ropa'),
  ('Cloro', 'es', 'Cloro o lejía'),
  ('Limpiador', 'es', 'Limpiador multiuso');

-- Nota: No se usa ON CONFLICT porque el índice único usa LOWER(nombre)
-- Si necesitas re-ejecutar este seed, primero ejecuta: DELETE FROM product_catalog WHERE idioma = 'es';
