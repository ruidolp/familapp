# Sistema de Subscriptions con Webhooks

## 📋 Resumen

Este sistema gestiona subscriptions de App Stores (Apple/Google) con las siguientes características:

- ✅ **Zero queries SQL** en requests normales (subscription en JWT)
- ✅ **Actualización automática** vía webhooks (sin logout manual)
- ✅ **Gestión completa del ciclo de vida** (trial, renewal, cancelación, reembolsos)
- ✅ **Soporte para Apple App Store y Google Play Store**

---

## 🔄 Flujo Completo

### **1. Usuario compra desde la app móvil**

```typescript
// Capacitor app (React Native / Ionic)
import { InAppPurchase2 } from '@ionic-native/in-app-purchase-2'

async function buyPremium() {
  const product = store.get('premium_monthly')

  // ✅ PASO 1: Registrar compra pendiente en backend
  const response = await fetch('/api/subscriptions/purchase/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      platform: 'apple', // o 'google'
      transactionId: product.transaction.id, // originalTransactionId
      productId: 'premium_monthly',
    }),
  })

  if (!response.ok) {
    console.error('Failed to init purchase')
    return
  }

  // ✅ PASO 2: Proceder con compra real
  store.order('premium_monthly')
}
```

### **2. App Store procesa el pago**

- Usuario confirma con Touch ID / Face ID
- Apple/Google cobran automáticamente
- App Store envía webhook a tu servidor

### **3. Webhook actualiza la DB**

```
Webhook → /api/webhooks/apple (o /google)
  ├── Verifica autenticidad
  ├── Busca pending_purchase por transactionId
  ├── Crea/actualiza subscription en DB
  ├── Invalida sesión JWT del usuario
  └── Usuario recarga subscription en próximo request (automático)
```

### **4. Usuario ve el cambio automáticamente**

- En el **próximo request** (1-5 segundos), `auth.ts` detecta invalidación
- Recarga subscription desde DB
- JWT se actualiza con nuevo plan
- Usuario ve "Premium" sin hacer nada

---

## 🛠️ Configuración

### **1. Migrar base de datos**

```bash
# Aplicar migraciones
psql -U user -d database -f src/infrastructure/database/migrations/029_create_invalidated_sessions.sql
psql -U user -d database -f src/infrastructure/database/migrations/030_create_pending_purchases.sql
```

### **2. Variables de entorno**

```bash
# .env
PAYMENT_MODE=sandbox  # o 'production'

# Apple App Store
APPLE_SHARED_SECRET=your-shared-secret

# Google Play Store
GOOGLE_SERVICE_ACCOUNT_KEY=your-service-account-key.json
GOOGLE_PUBSUB_PUBLIC_KEY=your-pubsub-public-key
```

### **3. Configurar webhooks en App Stores**

#### **Apple App Store**

1. Ir a [App Store Connect](https://appstoreconnect.apple.com)
2. Seleccionar tu app
3. Ir a **App Information** → **App Store Server Notifications**
4. Agregar URL: `https://tuapp.com/api/webhooks/apple`
5. Versión: **Version 2**

#### **Google Play Console**

1. Ir a [Google Play Console](https://play.google.com/console)
2. Seleccionar tu app
3. **Monetization setup** → **Real-time developer notifications**
4. Crear topic en Cloud Pub/Sub
5. Configurar Push endpoint: `https://tuapp.com/api/webhooks/google`

---

## 📱 Integración en App Móvil

### **Ejemplo: Ionic/Capacitor**

```typescript
// services/subscription.service.ts
import { InAppPurchase2, IAPProduct } from '@awesome-cordova-plugins/in-app-purchase-2'

export class SubscriptionService {
  private store = InAppPurchase2

  async init() {
    // Registrar productos
    this.store.register({
      id: 'premium_monthly',
      type: this.store.PAID_SUBSCRIPTION,
    })

    // Handler cuando la compra es aprobada
    this.store.when('premium_monthly').approved(async (product: IAPProduct) => {
      // ✅ Notificar a backend
      await this.initPurchase('apple', product.transaction.id, 'premium_monthly')

      // Finalizar compra (trigger webhook)
      product.finish()
    })

    // Refresh store
    this.store.refresh()
  }

  async initPurchase(platform: string, transactionId: string, productId: string) {
    const response = await fetch(`${API_URL}/api/subscriptions/purchase/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await this.getToken()}`,
      },
      body: JSON.stringify({ platform, transactionId, productId }),
    })

    if (!response.ok) {
      throw new Error('Failed to init purchase')
    }

    return response.json()
  }

  async buyPremium() {
    this.store.order('premium_monthly')
  }
}
```

---

## 🔍 Testing en Sandbox

### **1. Simular webhook de Apple**

```bash
curl -X POST http://localhost:3000/api/webhooks/apple \
  -H "Content-Type: application/json" \
  -d '{
    "notificationType": "SUBSCRIBED",
    "subtype": "INITIAL_BUY",
    "data": {
      "originalTransactionId": "test_transaction_123",
      "productId": "premium_monthly",
      "expiresDate": 1735862400000,
      "purchaseDate": 1735000000000
    }
  }'
```

### **2. Verificar invalidación**

```bash
# Ver sesiones invalidadas
psql -d database -c "SELECT * FROM invalidated_sessions ORDER BY created_at DESC LIMIT 5;"

# Ver compras pendientes
psql -d database -c "SELECT * FROM pending_purchases WHERE status = 'pending';"
```

---

## 📊 Monitoreo

### **Logs importantes**

```typescript
// Console logs que debes monitorear
[Apple Webhook] SUBSCRIBED (INITIAL_BUY) { originalTransactionId, productId }
[Apple Webhook] DID_RENEW { originalTransactionId }
[Apple Webhook] DID_FAIL_TO_RENEW { gracePeriodExpiresDate }
[Google Webhook] Type 4 (SUBSCRIPTION_PURCHASED) { purchaseToken }
```

### **Queries útiles**

```sql
-- Ver últimas subscriptions creadas
SELECT * FROM user_subscriptions ORDER BY created_at DESC LIMIT 10;

-- Ver eventos de subscription de un usuario
SELECT * FROM subscription_history WHERE user_id = 'USER_ID' ORDER BY created_at DESC;

-- Ver sesiones invalidadas hoy
SELECT * FROM invalidated_sessions WHERE created_at > NOW() - INTERVAL '1 day';
```

---

## ⚠️ Consideraciones Importantes

### **1. Verificación de Webhooks**

En **producción**, DEBES verificar la autenticidad de los webhooks:

- **Apple**: Verificar JWT signature con certificado público de Apple
- **Google**: Verificar firma de Cloud Pub/Sub

Actualmente en modo `sandbox`, la verificación está deshabilitada para testing.

### **2. Obtener fechas de expiración exactas**

Los webhooks de Apple incluyen `expiresDate`. Para Google, debes llamar a la API:

```typescript
// Google Play Developer API
const purchase = await androidpublisher.purchases.subscriptions.get({
  packageName: 'com.tuapp.familapp',
  subscriptionId: 'premium_monthly',
  token: purchaseToken,
})

const expiresAt = new Date(parseInt(purchase.expiryTimeMillis))
```

### **3. Limpiar datos antiguos**

Crea un cron job para limpiar:

```typescript
// Ejecutar diariamente
import { cleanupOldInvalidations } from '@/infrastructure/lib/session-manager'
import { cleanupOldPendingPurchases } from '@/infrastructure/database/queries'

// Limpiar sesiones invalidadas >7 días
await cleanupOldInvalidations()

// Limpiar compras pendientes >7 días
await cleanupOldPendingPurchases()
```

---

## 🎯 Roadmap

- [ ] Implementar verificación completa de JWT para Apple webhooks
- [ ] Integrar Google Play Developer API para obtener fechas exactas
- [ ] Agregar notificaciones push cuando fallan pagos
- [ ] Dashboard admin para ver subscriptions activas
- [ ] Métricas de conversión trial → pago

---

## 📚 Referencias

- [Apple App Store Server Notifications](https://developer.apple.com/documentation/appstoreservernotifications)
- [Google Play Real-time Developer Notifications](https://developer.android.com/google/play/billing/rtdn-reference)
- [NextAuth.js JWT Callbacks](https://next-auth.js.org/configuration/callbacks#jwt-callback)
