# Orden de Ejecución de Migraciones

## Bse de Datos Nueva (Fresh Install)

Ejecutar en este orden exacto:

### 1. Base (Usuarios y Auth)
```bash
000_create_base_tables.sql                    # Usuarios, sesiones, cuentas OAuth, códigos verificación
```

### 2. Suscripciones
```bash
001_create_subscription_tables.sql            # Planes, capacidades, límites, productos pago
002_seed_subscriptions_data.sql               # Datos iniciales de planes (free, premium, familiar)
```

### 3. Core (Sistema Financiero)
```bash
003_create_core_tables.sql                    # Monedas, user_config, billeteras, sobres, categorías, transacciones
003_create_themes.sql                         # Tabla de temas
004_seed_themes.sql                           # Datos de temas preestablecidos
005_add_tasa_interes_to_billeteras.sql        # Añade tasa de interés a billeteras
006_create_billeteras_transacciones.sql       # Transacciones de billeteras
007_add_sobres_types_to_billeteras_transacciones.sql  # Tipos de sobres en transacciones
008_add_proyecto_type_to_sobres.sql           # Tipo proyecto en sobres
```

### 4. Preferencias y User Config
```bash
010_create_user_preferences.sql               # Preferencias de usuario
015_trigger_type_regeneration.sql             # Regeneración de triggers
017_add_global_subcategorias.sql              # Subcategorías globales (marcas)
018_add_pais_to_user_config.sql               # País e idioma en user_config
```

### 5. Shopping Lists (Estructura Base)
```bash
011_create_shopping_lists.sql                 # Listas, items, colaboradores, ejecuciones
009_add_purchase_count_to_shopping_lists.sql  # Contador de compras (ya incluido en 011)
012_add_subcategoria_to_shopping_executions.sql  # Subcategoría en ejecuciones
016_make_store_name_nullable.sql              # Store name nullable
```

### 6. Productos (Nueva Estructura Global/Usuario)
```bash
019_separate_global_user_products.sql         # Catálogo global + productos usuario
020_add_idioma_to_product_tables.sql          # Soporte de idioma (es, en, pt)
021_add_product_favorites_frecuentes.sql      # Favoritos y frecuencia
022_update_shopping_list_items_for_custom_products.sql  # Actualiza items para usar product_custom_id
023_add_triggers_for_products.sql             # Triggers de updated_at
```

---

## Seeds (Datos Iniciales)

Ejecutar DESPUÉS de todas las migraciones estructurales:

```bash
# En directorio: src/infrastructure/database/seeds/

001_monedas.sql                               # Monedas (CLP, USD, EUR, ARS, etc.)
002_subscriptions.sql                         # Planes de suscripción
003_themes.sql                                # Temas (Neon, Blanco, Negro, Rosado)
004_subcategorias_globales.sql                # Marcas/empresas por país (CL)
```

---

## Resumen de Dependencias

### Orden Crítico:
1. **000** → Base (users table)
2. **001-002** → Suscripciones (depende de users)
3. **003** → Core financiero (depende de users)
4. **011** → Shopping lists (depende de users, sobres, categorías)
5. **019** → Productos base (independiente)
6. **020-021** → Extensiones de productos (depende de 019)
7. **022** → Migra shopping items a productos (depende de 011 y 019)
8. **023** → Triggers finales

### Notas Importantes:

- **009** está incluido conceptualmente en **011** (purchase_count ya está en la definición)
- **013-014** fueron absorbidos en **011** (categoria_global_id ya está)
- **019-023** reemplazan cualquier lógica anterior de productos
- Las migraciones **022** elimina FKs a product_catalog para hacerlo independiente
- Siempre ejecutar **seeds/** DESPUÉS de todas las migraciones estructurales

---

## Base de Datos Existente (Migration desde versión anterior)

Si ya tienes una base de datos con las migraciones 000-018:

```bash
# Solo ejecutar las nuevas:
019_separate_global_user_products.sql
020_add_idioma_to_product_tables.sql
021_add_product_favorites_frecuentes.sql
022_update_shopping_list_items_for_custom_products.sql
023_add_triggers_for_products.sql

# Y agregar el seed de subcategorías globales:
seeds/004_subcategorias_globales.sql
```

**ADVERTENCIA**: La migración 022 elimina constraints existentes de product_catalog.
Asegúrate de hacer backup antes de ejecutar.

---

## Verificación Post-Migración

Después de ejecutar todas las migraciones, verifica:

```sql
-- Verificar que product_catalog NO tiene FKs apuntando a él
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint
WHERE confrelid = 'product_catalog'::regclass;
-- Resultado esperado: 0 filas

-- Verificar que product_user_custom SÍ tiene FKs
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint
WHERE confrelid = 'product_user_custom'::regclass;
-- Debería mostrar FKs desde shopping_list_items, product_favorites, etc.

-- Verificar índices de idioma
SELECT indexname FROM pg_indexes
WHERE tablename IN ('product_catalog', 'product_categories_global')
AND indexname LIKE '%idioma%';
-- Debería mostrar índices idx_product_catalog_idioma y idx_product_categories_global_idioma
```
