-- ============================================================================
-- MIGRACIÓN: Asignar categorías a productos del catálogo
-- ============================================================================
-- Asigna category_id a los productos del catálogo basándose en sus nombres

DO $$
DECLARE
  cat_frutas UUID;
  cat_verduras UUID;
  cat_carnes UUID;
  cat_pescado UUID;
  cat_lacteos UUID;
  cat_huevos UUID;
  cat_granos UUID;
  cat_aceites UUID;
  cat_enlatados UUID;
  cat_harinas UUID;
  cat_bebidas UUID;
  cat_bebidas_alcoholicas UUID;
  cat_congelados UUID;
  cat_snacks UUID;
  cat_dulces UUID;
  cat_higiene UUID;
  cat_limpieza UUID;
  cat_bebe UUID;
  cat_mascotas UUID;
  cat_otros UUID;
BEGIN
  -- Obtener IDs de categorías
  SELECT id INTO cat_frutas FROM product_categories_global WHERE LOWER(nombre) = 'frutas' AND idioma = 'es' LIMIT 1;
  SELECT id INTO cat_verduras FROM product_categories_global WHERE LOWER(nombre) = 'verduras' AND idioma = 'es' LIMIT 1;
  SELECT id INTO cat_carnes FROM product_categories_global WHERE LOWER(nombre) = 'carnes' AND idioma = 'es' LIMIT 1;
  SELECT id INTO cat_pescado FROM product_categories_global WHERE LOWER(nombre) = 'pescado y mariscos' AND idioma = 'es' LIMIT 1;
  SELECT id INTO cat_lacteos FROM product_categories_global WHERE LOWER(nombre) = 'lácteos' AND idioma = 'es' LIMIT 1;
  SELECT id INTO cat_huevos FROM product_categories_global WHERE LOWER(nombre) = 'huevos' AND idioma = 'es' LIMIT 1;
  SELECT id INTO cat_granos FROM product_categories_global WHERE LOWER(nombre) = 'granos y cereales' AND idioma = 'es' LIMIT 1;
  SELECT id INTO cat_aceites FROM product_categories_global WHERE LOWER(nombre) = 'aceites y condimentos' AND idioma = 'es' LIMIT 1;
  SELECT id INTO cat_enlatados FROM product_categories_global WHERE LOWER(nombre) = 'enlatados' AND idioma = 'es' LIMIT 1;
  SELECT id INTO cat_harinas FROM product_categories_global WHERE LOWER(nombre) = 'harinas y repostería' AND idioma = 'es' LIMIT 1;
  SELECT id INTO cat_bebidas FROM product_categories_global WHERE LOWER(nombre) = 'bebidas' AND idioma = 'es' LIMIT 1;
  SELECT id INTO cat_bebidas_alcoholicas FROM product_categories_global WHERE LOWER(nombre) = 'bebidas alcohólicas' AND idioma = 'es' LIMIT 1;
  SELECT id INTO cat_congelados FROM product_categories_global WHERE LOWER(nombre) = 'productos congelados' AND idioma = 'es' LIMIT 1;
  SELECT id INTO cat_snacks FROM product_categories_global WHERE LOWER(nombre) = 'snacks' AND idioma = 'es' LIMIT 1;
  SELECT id INTO cat_dulces FROM product_categories_global WHERE LOWER(nombre) = 'dulces y chocolates' AND idioma = 'es' LIMIT 1;
  SELECT id INTO cat_higiene FROM product_categories_global WHERE LOWER(nombre) = 'higiene personal' AND idioma = 'es' LIMIT 1;
  SELECT id INTO cat_limpieza FROM product_categories_global WHERE LOWER(nombre) = 'limpieza del hogar' AND idioma = 'es' LIMIT 1;
  SELECT id INTO cat_bebe FROM product_categories_global WHERE LOWER(nombre) = 'bebé' AND idioma = 'es' LIMIT 1;
  SELECT id INTO cat_mascotas FROM product_categories_global WHERE LOWER(nombre) = 'mascotas' AND idioma = 'es' LIMIT 1;
  SELECT id INTO cat_otros FROM product_categories_global WHERE LOWER(nombre) = 'otros' AND idioma = 'es' LIMIT 1;

  -- Frutas
  UPDATE product_catalog SET category_id = cat_frutas WHERE idioma = 'es' AND LOWER(nombre) IN (
    'manzana', 'plátano', 'naranja', 'pera', 'uva', 'sandía', 'melón', 'frutilla', 'kiwi', 'palta',
    'limón', 'durazno', 'damasco', 'ciruela', 'frambuesa', 'arándano', 'mango', 'piña', 'papaya',
    'coco', 'cereza', 'mora', 'mandarina', 'pomelo'
  );

  -- Verduras
  UPDATE product_catalog SET category_id = cat_verduras WHERE idioma = 'es' AND LOWER(nombre) IN (
    'lechuga', 'tomate', 'cebolla', 'papa', 'zanahoria', 'pimentón', 'ajo', 'brócoli', 'zapallo', 'apio',
    'espinaca', 'repollo', 'coliflor', 'pepino', 'berenjena', 'zucchini', 'champiñón', 'poroto verde',
    'choclo', 'puerro', 'remolacha', 'rábano', 'acelga', 'kale'
  );

  -- Carnes
  UPDATE product_catalog SET category_id = cat_carnes WHERE idioma = 'es' AND LOWER(nombre) IN (
    'pollo', 'carne de vacuno', 'carne de cerdo', 'pavo',
    'cordero', 'costillas', 'chuleta', 'filete', 'molida', 'chorizo', 'salchicha', 'jamón', 'tocino'
  );

  -- Pescado y Mariscos
  UPDATE product_catalog SET category_id = cat_pescado WHERE idioma = 'es' AND LOWER(nombre) IN (
    'salmón', 'atún', 'merluza',
    'reineta', 'congrio', 'lenguado', 'trucha', 'camarón', 'langostino', 'almeja', 'mejillón',
    'pulpo', 'calamar', 'jaiba', 'ostión'
  );

  -- Lácteos
  UPDATE product_catalog SET category_id = cat_lacteos WHERE idioma = 'es' AND LOWER(nombre) IN (
    'leche', 'queso', 'yogur', 'mantequilla', 'crema',
    'quesillo', 'ricotta', 'queso crema', 'leche condensada', 'leche evaporada', 'nata'
  );

  -- Huevos
  UPDATE product_catalog SET category_id = cat_huevos WHERE idioma = 'es' AND LOWER(nombre) IN (
    'huevo', 'huevos'
  );

  -- Granos y Cereales
  UPDATE product_catalog SET category_id = cat_granos WHERE idioma = 'es' AND LOWER(nombre) IN (
    'arroz', 'pasta', 'fideos', 'pan', 'cereales', 'avena', 'quinoa', 'lentejas', 'porotos', 'garbanzos',
    'maíz', 'trigo', 'cebada', 'arroz integral', 'macarrones', 'espagueti', 'tallarines'
  );

  -- Aceites y Condimentos
  UPDATE product_catalog SET category_id = cat_aceites WHERE idioma = 'es' AND LOWER(nombre) IN (
    'aceite', 'sal', 'pimienta', 'azúcar', 'vinagre', 'salsa de soja', 'mayonesa', 'mostaza', 'ketchup',
    'orégano', 'comino', 'pimentón', 'laurel', 'merkén', 'ají', 'curry', 'canela', 'caldo', 'consomé'
  );

  -- Enlatados
  UPDATE product_catalog SET category_id = cat_enlatados WHERE idioma = 'es' AND LOWER(nombre) IN (
    'atún enlatado', 'jurel enlatado', 'arvejas enlatadas', 'choclo enlatado', 'porotos enlatados',
    'tomate en lata', 'salsa de tomate', 'sardinas', 'duraznos en lata', 'piña en lata'
  );

  -- Harinas y Repostería
  UPDATE product_catalog SET category_id = cat_harinas WHERE idioma = 'es' AND LOWER(nombre) IN (
    'harina', 'levadura', 'polvo de hornear', 'azúcar flor', 'chocolate', 'cacao', 'vainilla',
    'bicarbonato', 'fécula', 'maicena'
  );

  -- Bebidas
  UPDATE product_catalog SET category_id = cat_bebidas WHERE idioma = 'es' AND LOWER(nombre) IN (
    'agua', 'jugo', 'bebida', 'refresco', 'gaseosa', 'coca cola', 'té', 'café', 'leche con sabor',
    'néctar', 'agua mineral', 'agua con gas', 'energética'
  );

  -- Bebidas Alcohólicas
  UPDATE product_catalog SET category_id = cat_bebidas_alcoholicas WHERE idioma = 'es' AND LOWER(nombre) IN (
    'vino', 'cerveza', 'pisco', 'ron', 'vodka', 'whisky', 'champagne', 'espumante'
  );

  -- Productos Congelados
  UPDATE product_catalog SET category_id = cat_congelados WHERE idioma = 'es' AND LOWER(nombre) IN (
    'helado', 'papas fritas congeladas', 'pizza congelada', 'verduras congeladas', 'hamburguesa congelada',
    'nuggets', 'lasaña congelada'
  );

  -- Snacks
  UPDATE product_catalog SET category_id = cat_snacks WHERE idioma = 'es' AND LOWER(nombre) IN (
    'papas fritas', 'nachos', 'palomitas', 'pretzels', 'galletas saladas', 'maní', 'almendras',
    'nueces', 'mix de frutos secos'
  );

  -- Dulces y Chocolates
  UPDATE product_catalog SET category_id = cat_dulces WHERE idioma = 'es' AND LOWER(nombre) IN (
    'chocolate', 'caramelos', 'gomitas', 'chicle', 'galletas', 'wafer', 'alfajor', 'turrones',
    'bombones', 'mermelada', 'manjar'
  );

  -- Higiene Personal
  UPDATE product_catalog SET category_id = cat_higiene WHERE idioma = 'es' AND LOWER(nombre) IN (
    'jabón', 'champú', 'acondicionador', 'pasta de dientes', 'cepillo de dientes', 'desodorante',
    'papel higiénico', 'toallas higiénicas', 'pañuelos', 'gel de ducha', 'crema corporal'
  );

  -- Limpieza del Hogar
  UPDATE product_catalog SET category_id = cat_limpieza WHERE idioma = 'es' AND LOWER(nombre) IN (
    'detergente', 'cloro', 'limpiador', 'lavaloza', 'suavizante', 'desinfectante', 'esponja',
    'escobillón', 'trapo', 'bolsas de basura', 'limpiavidrios'
  );

  -- Bebé
  UPDATE product_catalog SET category_id = cat_bebe WHERE idioma = 'es' AND LOWER(nombre) IN (
    'pañales', 'toallitas húmedas', 'leche de fórmula', 'papilla', 'biberón', 'chupete'
  );

  -- Mascotas
  UPDATE product_catalog SET category_id = cat_mascotas WHERE idioma = 'es' AND LOWER(nombre) IN (
    'alimento para perro', 'alimento para gato', 'arena para gato', 'snacks para mascotas'
  );

  -- Log de cuántos productos se actualizaron
  RAISE NOTICE 'Categorías asignadas a productos del catálogo exitosamente';
END $$;
