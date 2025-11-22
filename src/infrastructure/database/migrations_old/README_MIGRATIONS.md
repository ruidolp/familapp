# Migraciones de Base de Datos - Familapp

## Orden de Ejecución

### 1. Estructura Base (OBLIGATORIO)
Ejecutar en orden:
```bash
001_create_subscription_tables.sql
002_seed_subscriptions_data.sql
003_create_core_tables.sql          # Sobres, categorías, transacciones
003_create_themes.sql
003_shopping_lists_CONSOLIDATED.sql # ⭐ NUEVO: Reemplaza 003_shopping_lists.sql + 011 + patches
004_seed_themes.sql
```

### 2. Parches y Extensiones
```bash
005_add_tasa_interes_to_billeteras.sql
006_create_billeteras_transacciones.sql
007_add_sobres_types_to_billeteras_transacciones.sql
008_add_proyecto_type_to_sobres.sql
009_add_purchase_count_to_shopping_lists.sql
010_create_user_preferences.sql
012_add_subcategoria_to_shopping_executions.sql
013_add_global_category_support_to_items.sql
014_add_categories_to_execution_items.sql
015_trigger_type_regeneration.sql
016_make_store_name_nullable.sql
017_add_global_subcategorias.sql
018_add_pais_to_user_config.sql
```

### 3. Seeds de Datos (OPCIONAL - según necesidad)
```bash
seeds/001_product_categories_global_es.sql  # Categorías de productos en español
seeds/002_product_catalog_es_basic.sql      # Productos básicos de supermercado
```

---

## Archivos Consolidados

### `003_shopping_lists_CONSOLIDATED.sql`

**Reemplaza a:**
- `003_shopping_lists.sql` (original)
- `011_add_global_product_categories.sql`
- Migraciones 019-025 (patches eliminados)

**Incluye:**
- ✅ Tablas de productos con `idioma` (en lugar de `país`)
- ✅ Sin FKs problemáticos (product_catalog es independiente)
- ✅ Unique constraints con LOWER() para evitar duplicados
- ✅ Campos deprecated documentados (product_id, is_catalog)
- ✅ shopping_executions.shopping_list_id con ON DELETE SET NULL

**Cambios Clave:**
1. `product_catalog.idioma` → 'es', 'en', 'pt' (antes: país CL, AR, etc.)
2. `product_categories_global.idioma` → mismo patrón
3. Sin FK desde `shopping_list_items.product_id` → `product_catalog`
4. Sin FK desde `shopping_list_items.categoria_global_id` → `product_categories_global`
5. SIEMPRE usar `product_custom_id` (con FK a `product_user_custom`)
6. Unique constraints case-insensitive: `LOWER(nombre)`

---

## Estrategia de Datos

### Productos Globales
- **Tabla**: `product_catalog`
- **Idioma**: `'es'` sirve para CL, AR, PE, MX, ES, CO, etc.
- **Independiente**: Puede truncarse sin afectar listas de usuarios
- **Sin FK**: Otros tablas NO tienen FK apuntando aquí

### Productos de Usuario
- **Tabla**: `product_user_custom`
- **Contiene**: Productos propios + copias del catálogo global
- **FK**: `shopping_list_items.product_custom_id` apunta aquí
- **Unique**: `(user_id, LOWER(nombre))`

### Categorías
- **Global**: `product_categories_global` (idioma, sin FKs entrantes)
- **Usuario**: `product_categories_user` (con FKs desde items)
- Mismo patrón que productos

---

## Flujo de Migración (desde cero)

```sql
-- 1. Crear estructura base
\i 001_create_subscription_tables.sql
\i 002_seed_subscriptions_data.sql
\i 003_create_core_tables.sql
\i 003_create_themes.sql
\i 003_shopping_lists_CONSOLIDATED.sql  -- ⭐
\i 004_seed_themes.sql

-- 2. Aplicar parches (005-018)
\i 005_add_tasa_interes_to_billeteras.sql
-- ... resto de parches ...
\i 018_add_pais_to_user_config.sql

-- 3. Seed de datos (opcional)
\i seeds/001_product_categories_global_es.sql
\i seeds/002_product_catalog_es_basic.sql
```

---

## Notas Importantes

### ⚠️ Archivos Deprecados (NO USAR)
- ❌ `003_shopping_lists.sql` (usar `003_shopping_lists_CONSOLIDATED.sql`)
- ❌ `011_add_global_product_categories.sql` (ya incluido en CONSOLIDATED)
- ❌ Migraciones 019-025 (eliminadas, cambios incluidos en CONSOLIDATED)

### ✅ Validaciones Post-Migración

```sql
-- Verificar que product_catalog no tiene FKs entrantes
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'product_catalog';
-- Debe retornar 0 filas

-- Verificar unique constraints case-insensitive
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('product_user_custom', 'product_categories_user')
  AND indexdef ILIKE '%lower%';
-- Debe mostrar índices con LOWER(nombre)

-- Verificar campo idioma en catálogo
SELECT DISTINCT idioma FROM product_catalog;
-- Debe retornar: 'es' (u otros idiomas agregados)
```

---

## Agregar Nuevos Idiomas

```sql
-- Ejemplo: Agregar productos en inglés
INSERT INTO product_categories_global (nombre, idioma, color, emoji)
VALUES ('Fruits', 'en', '#FF6B6B', '🍎');

INSERT INTO product_catalog (nombre, idioma, category_id)
VALUES ('Apple', 'en', <category_id>);
```
