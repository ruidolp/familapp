# Shopping Lists Module - API Endpoints

## Base Path
All endpoints are under `/api`

---

## **SHOPPING LISTS**

### GET `/shopping-lists`
Obtener todas las listas del usuario autenticado
```
Response: {
  success: boolean,
  lists: ShoppingList[],
  total: number
}
```

### POST `/shopping-lists`
Crear nueva lista de compras
```
Body: {
  nombre: string (required),
  descripcion?: string
}

Response: {
  success: boolean,
  list: ShoppingList
}
```

### GET `/shopping-lists/[id]`
Obtener lista específica con sus items
```
Response: {
  success: boolean,
  list: ShoppingList,
  items: ShoppingListItem[]
}
```

### PUT `/shopping-lists/[id]`
Actualizar lista
```
Body: {
  nombre?: string,
  descripcion?: string,
  list_order?: number
}

Response: {
  success: boolean,
  list: ShoppingList
}
```

### DELETE `/shopping-lists/[id]`
Eliminar lista (soft delete)
```
Response: {
  success: boolean,
  message: string
}
```

---

## **SHOPPING LIST ITEMS**

### GET `/shopping-lists/[id]/items`
Obtener todos los items de una lista
```
Response: {
  success: boolean,
  items: ShoppingListItem[],
  total: number
}
```

### POST `/shopping-lists/[id]/items`
Agregar item a la lista
```
Body: {
  product_id?: string,
  product_custom_id?: string,
  is_catalog: boolean (required),
  cantidad?: number (default: 1),
  unidad_medida?: string,
  categoria_producto_id?: string,
  marca?: string,
  comentario?: string
}

Response: {
  success: boolean,
  item: ShoppingListItem
}
```

### PUT `/shopping-lists/[id]/items`
Reordenar items (drag & drop)
```
Body: {
  orderedIds: string[] (required)
}

Response: {
  success: boolean,
  message: string
}
```

---

## **SHOPPING LIST COLLABORATORS**

### GET `/shopping-lists/[id]/collaborators`
Obtener colaboradores de la lista
```
Response: {
  success: boolean,
  collaborators: ShoppingListCollaborator[],
  total: number
}
```

### POST `/shopping-lists/[id]/collaborators`
Agregar colaborador
```
Body: {
  user_id: string (required),
  permission_level: 'FULL_ACCESS' | 'EXECUTION_ONLY' (required)
}

Response: {
  success: boolean,
  collaborator: ShoppingListCollaborator
}
```

### DELETE `/shopping-lists/[id]/collaborators?user_id=xxx`
Remover colaborador
```
Response: {
  success: boolean,
  message: string
}
```

---

## **SHOPPING LIST CLONE**

### POST `/shopping-lists/[id]/clone`
Clonar lista con todos sus items
```
Body: {
  newName: string (required)
}

Response: {
  success: boolean,
  list: ShoppingList,
  message: string
}
```

---

## **SHOPPING EXECUTIONS (Compras)**

### GET `/shopping-lists/[id]/executions`
Obtener todas las ejecuciones/compras de una lista
```
Response: {
  success: boolean,
  executions: ShoppingExecution[],
  total: number
}
```

### POST `/shopping-lists/[id]/executions`
Iniciar ejecución/compra
```
Body: {
  store_name: string (required),
  sobre_id?: string
}

Response: {
  success: boolean,
  execution: ShoppingExecution,
  message: string
}
```

### GET `/shopping-executions/[id]`
Obtener ejecución específica con sus items
```
Response: {
  success: boolean,
  execution: ShoppingExecution,
  items: ShoppingExecutionItem[],
  totalCalculated: number
}
```

### PUT `/shopping-executions/[id]`
Actualizar ejecución (marcar como completada, agregar totales, etc.)
```
Body: {
  status?: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
  total_estimado?: number,
  total_calculated?: number,
  total_manual?: number,
  sobre_id?: string,
  categoria_sobre_id?: string,
  tiempo_transcurrido?: number,
  gasto_id?: string
}

Response: {
  success: boolean,
  execution: ShoppingExecution
}
```

---

## **SHOPPING EXECUTION ITEMS**

### GET `/shopping-executions/[id]/items`
Obtener items de una ejecución
```
Response: {
  success: boolean,
  items: ShoppingExecutionItem[],
  total: number
}
```

### POST `/shopping-executions/[id]/items`
Agregar item durante la compra (producto al vuelo)
```
Body: {
  product_id?: string,
  product_custom_id?: string,
  is_catalog: boolean (required),
  cantidad_comprada?: number,
  unidad_medida?: string,
  marca?: string
}

Response: {
  success: boolean,
  item: ShoppingExecutionItem
}
```

### PUT `/shopping-executions/[id]/items`
Actualizar item (marcar comprado, registrar precio, etc.)
```
Body: {
  itemId: string (required),
  updates: {
    cantidad_comprada?: number,
    precio_unitario?: number,
    precio_total?: number,
    es_comprado?: boolean,
    razon_no_comprado?: 'SIN_STOCK' | 'NO_DISPONIBLE' | null
  }
}

Response: {
  success: boolean,
  item: ShoppingExecutionItem
}
```

---

## **PRODUCTS**

### GET `/products/search?q=xxx&idioma=es&type=all&limit=20`
Buscar productos (catálogo, personalizados, favoritos, frecuentes)
```
Query Params:
- q: string (búsqueda)
- idioma: string (default: 'es')
- type: 'all' | 'catalog' | 'custom' | 'favorites' | 'frequent'
- limit: number (default: 20)

Response: {
  success: boolean,
  results: {
    catalog: Product[],
    custom: Product[],
    favorites: Product[],
    frequent: Product[]
  }
}
```

### GET `/products/custom?q=xxx&limit=50`
Obtener productos personalizados del usuario
```
Response: {
  success: boolean,
  products: ProductUserCustom[],
  total: number
}
```

### POST `/products/custom`
Crear producto personalizado
```
Body: {
  nombre: string (required),
  descripcion?: string
}

Response: {
  success: boolean,
  product: ProductUserCustom
}
```

### GET `/products/favorites`
Obtener favoritos del usuario
```
Response: {
  success: boolean,
  favorites: ProductFavorite[],
  total: number
}
```

### POST `/products/favorites`
Agregar producto a favoritos
```
Body: {
  productId?: string,
  productCustomId?: string,
  isCatalog: boolean (required)
}

Response: {
  success: boolean,
  message: string
}
```

### DELETE `/products/favorites?productId=xxx`
Remover de favoritos
```
Response: {
  success: boolean,
  message: string
}
```

### GET `/products/categories`
Obtener categorías personales de productos
```
Response: {
  success: boolean,
  categories: ProductCategory[],
  total: number
}
```

### POST `/products/categories`
Crear categoría personal de producto
```
Body: {
  nombre: string (required),
  color?: string (ej: '#FF5733'),
  emoji?: string
}

Response: {
  success: boolean,
  category: ProductCategory
}
```

### GET `/products/prices-history?productId=xxx&stores=Jumbo&stores=Éxito&limit=50`
Obtener historial de precios de un producto
```
Query Params:
- productId: string (required)
- stores: string[] (opcional, filtrar por tiendas)
- limit: number (default: 50)

Response: {
  success: boolean,
  history: PriceHistory[],
  total: number
}
```

### POST `/products/prices-history`
Registrar precio de producto
```
Body: {
  product_id?: string,
  product_custom_id?: string,
  is_catalog: boolean (required),
  store_name: string (required),
  price: number (required),
  currency_id?: string
}

Response: {
  success: boolean,
  message: string
}
```

---

## **DATA MODELS**

### ShoppingList
```typescript
{
  id: string
  user_id: string
  nombre: string
  descripcion?: string
  list_order: number
  created_at: Date
  updated_at: Date
  deleted_at?: Date
}
```

### ShoppingListItem
```typescript
{
  id: string
  shopping_list_id: string
  product_id?: string
  product_custom_id?: string
  is_catalog: boolean
  cantidad: number
  unidad_medida?: string ('unidad' | 'kg' | 'g' | 'L' | 'mL' | 'paquete' | 'caja' | 'frasco' | 'bolsa')
  categoria_producto_id?: string
  marca?: string
  comentario?: string
  item_order: number
  item_type: 'NORMAL' | 'COMPRA_AGREGADO'
  created_by: string (user_id)
  created_at: Date
  updated_at: Date
  deleted_at?: Date
}
```

### ShoppingExecution
```typescript
{
  id: string
  shopping_list_id: string
  user_id: string
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  store_name: string
  sobre_id?: string
  categoria_sobre_id?: string
  total_estimado?: number
  total_calculated?: number
  total_manual?: number
  tiempo_transcurrido?: number
  gasto_id?: string
  started_at: Date
  completed_at?: Date
  created_at: Date
  updated_at: Date
  deleted_at?: Date
}
```

### ShoppingExecutionItem
```typescript
{
  id: string
  shopping_execution_id: string
  shopping_list_item_id?: string
  product_id?: string
  product_custom_id?: string
  is_catalog: boolean
  cantidad_comprada?: number
  unidad_medida?: string
  marca?: string
  precio_unitario?: number
  precio_total?: number
  es_comprado: boolean
  razon_no_comprado?: 'SIN_STOCK' | 'NO_DISPONIBLE'
  es_agregado_vuelo: boolean
  agregado_por?: string (user_id)
  created_at: Date
  updated_at: Date
}
```

---

## **AUTHENTICATION**
Todos los endpoints requieren autenticación via `NextAuth`. Se valida automáticamente.

## **PERMISSIONS**
- Solo el propietario de la lista puede hacer CRUD
- Colaboradores con `FULL_ACCESS` pueden editar
- Colaboradores con `EXECUTION_ONLY` solo pueden ejecutar compras
- Los cambios de precios se registran por usuario

## **OFFLINE SUPPORT**
- Usar timestamps para resolver conflictos
- Implementar queue local para operaciones offline
- Sincronizar automáticamente cuando vuelve internet
- Los cambios tienen `updated_at` para resolver duplicados
