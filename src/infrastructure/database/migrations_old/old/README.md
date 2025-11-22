# Migraciones Obsoletas

Este directorio contiene migraciones antiguas que **NO se deben usar**.

## Archivos Movidos Aquí

### 1. `003_shopping_lists.sql`
**Reemplazado por:** `003_shopping_lists_CONSOLIDATED.sql`

**Razón:**
- No incluía campo `idioma` (usaba solo estructura básica)
- Tenía FK problemáticos de `shopping_list_items.product_id` → `product_catalog`
- Faltaban unique constraints con LOWER()
- No tenía `shopping_executions.shopping_list_id` con SET NULL

---

### 2. `011_add_global_product_categories.sql`
**Reemplazado por:** Incluido en `003_shopping_lists_CONSOLIDATED.sql`

**Razón:**
- Agregaba `product_categories_global` como parche
- Incluía seed de categorías (ahora separado en `seeds/001_product_categories_global_es.sql`)
- No usaba `idioma`, solo nombre único global
- Ya está incluido desde el inicio en CONSOLIDATED

---

### 3. `013_add_global_category_support_to_items.sql`
**Reemplazado por:** Incluido en `003_shopping_lists_CONSOLIDATED.sql`

**Razón:**
- Agregaba campo `categoria_global_id` como parche
- Ya está en la estructura inicial de CONSOLIDATED
- Con COMMENT documentando que NO tiene FK

---

### 4. `014_add_categories_to_execution_items.sql`
**Reemplazado por:** Incluido en `003_shopping_lists_CONSOLIDATED.sql`

**Razón:**
- Agregaba campos de categoría a `shopping_execution_items` como parche
- Ya está en la estructura inicial de CONSOLIDATED

---

## ¿Qué usar ahora?

```bash
# ✅ Usar esto
003_shopping_lists_CONSOLIDATED.sql

# ❌ NO usar estos
003_shopping_lists.sql
011_add_global_product_categories.sql
013_add_global_category_support_to_items.sql
014_add_categories_to_execution_items.sql
```

---

## Seeds Ahora Separados

Los datos iniciales (categorías y productos) ahora están en:
- `seeds/001_product_categories_global_es.sql`
- `seeds/002_product_catalog_es_basic.sql`

---

**Fecha de consolidación:** 2025-11-20
**Versión CONSOLIDATED:** v1.0
