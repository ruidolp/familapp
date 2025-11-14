# Configuración de OAuth (Google y Facebook)

Este documento explica cómo configurar y activar los proveedores OAuth en la aplicación.

## ✅ Cambios Realizados

### 1. **Fix de Hydration Mismatch**
Se ha solucionado el error de hidratación en las páginas de login y registro. El problema era que los botones OAuth se renderizaban condicionalmente, causando diferencias entre el HTML del servidor y el cliente.

**Solución:** Los botones OAuth ahora se renderizan solo después del montaje del cliente usando `useEffect` y `isMounted` state.

Archivos modificados:
- `src/presentation/components/auth/login-form.tsx`
- `src/presentation/components/auth/register-form.tsx`

### 2. **OAuth Añadido al Formulario de Registro**
Ahora tanto el login como el registro tienen soporte para OAuth con Google y Facebook.

### 3. **Manifest.json Creado**
Se ha creado el archivo `public/manifest.json` para soporte PWA y evitar el error 404.

### 4. **Archivo .env.local Creado**
Se ha creado `.env.local` con la configuración necesaria para activar OAuth.

---

## 🔧 Cómo Activar OAuth

### Sistema de Activación Automática

El sistema activa automáticamente los proveedores OAuth basándose en la **presencia de las variables de entorno**:

```typescript
// En src/infrastructure/config/app.config.ts
oauth: {
  google: {
    enabled: !!process.env.GOOGLE_CLIENT_ID,  // Se activa si existe
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  },
  facebook: {
    enabled: !!process.env.FACEBOOK_CLIENT_ID,  // Se activa si existe
    clientId: process.env.FACEBOOK_CLIENT_ID || '',
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
  },
}
```

### Para Activar Google OAuth:

1. **Obtener credenciales de Google:**
   - Ve a [Google Cloud Console](https://console.cloud.google.com/)
   - Crea un proyecto o selecciona uno existente
   - Habilita la API de Google+
   - Ve a "Credenciales" → "Crear credenciales" → "ID de cliente OAuth 2.0"
   - Configura la pantalla de consentimiento
   - Añade las URIs autorizadas:
     - **Orígenes autorizados:** `http://localhost:3000`
     - **URIs de redirección:** `http://localhost:3000/api/auth/callback/google`
   - Copia el **Client ID** y **Client Secret**

2. **Configurar las variables de entorno:**

   Edita el archivo `.env.local`:
   ```bash
   GOOGLE_CLIENT_ID="tu-client-id-de-google.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="tu-client-secret-de-google"
   ```

3. **Reiniciar el servidor:**
   ```bash
   npm run dev
   ```

4. **Verificar que está activo:**
   - Ve a `/auth/login` o `/auth/register`
   - Deberías ver el botón de "Google" después del formulario

### Para Activar Facebook OAuth:

1. **Obtener credenciales de Facebook:**
   - Ve a [Facebook Developers](https://developers.facebook.com/)
   - Crea una aplicación
   - Ve a "Configuración" → "Básica"
   - Copia el **App ID** y **App Secret**
   - Añade la plataforma "Sitio web" con la URL: `http://localhost:3000`

2. **Configurar las variables de entorno:**

   Edita el archivo `.env.local`:
   ```bash
   FACEBOOK_CLIENT_ID="tu-app-id-de-facebook"
   FACEBOOK_CLIENT_SECRET="tu-app-secret-de-facebook"
   ```

3. **Reiniciar el servidor y verificar**

---

## 🎯 Cómo Funciona Internamente

### 1. Configuración (app.config.ts)
Define qué proveedores están habilitados basándose en las env vars.

### 2. NextAuth Providers (infrastructure/lib/auth.ts)
Los proveedores se añaden condicionalmente al array de NextAuth:

```typescript
providers: [
  // Credentials provider...

  // Google OAuth (si está habilitado)
  ...(appConfig.auth.oauth.google.enabled
    ? [Google({...})]
    : []),

  // Facebook OAuth (si está habilitado)
  ...(appConfig.auth.oauth.facebook.enabled
    ? [Facebook({...})]
    : []),
],
```

### 3. UI Components
Los formularios de login y registro verifican la configuración y renderizan los botones:

```tsx
{isMounted && (appConfig.auth.oauth.google.enabled || appConfig.auth.oauth.facebook.enabled) && (
  <>
    {/* Divider */}

    <div className="grid grid-cols-2 gap-4">
      {appConfig.auth.oauth.google.enabled && (
        <Button onClick={() => handleOAuthSignIn('google')}>
          Google
        </Button>
      )}

      {appConfig.auth.oauth.facebook.enabled && (
        <Button onClick={() => handleOAuthSignIn('facebook')}>
          Facebook
        </Button>
      )}
    </div>
  </>
)}
```

---

## ⚙️ Variables de Entorno Requeridas

### Mínimo para OAuth:

```bash
# Para Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Para Facebook OAuth (opcional)
FACEBOOK_CLIENT_ID="..."
FACEBOOK_CLIENT_SECRET="..."
```

### Otras variables necesarias:

```bash
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="genera-con-openssl-rand-base64-32"
```

---

## 🔍 Verificar Estado de OAuth

Puedes verificar el estado de los proveedores OAuth haciendo una petición al endpoint de health:

```bash
curl http://localhost:3000/api/health
```

Respuesta:
```json
{
  "status": "ok",
  "config": {
    "oauthProviders": {
      "google": true,    // ← Activado
      "facebook": false  // ← Desactivado
    }
  }
}
```

---

## 📝 Notas Importantes

1. **Sin Feature Flags Separados:** No hay un sistema de feature flags adicional. Los proveedores se activan/desactivan simplemente con las variables de entorno.

2. **Reiniciar el Servidor:** Después de cambiar variables de entorno, siempre reinicia el servidor de desarrollo.

3. **Hydration Fix:** El uso de `isMounted` previene errores de hidratación asegurando que los botones OAuth solo se rendericen en el cliente.

4. **Account Linking:** Los proveedores OAuth están configurados con `allowDangerousEmailAccountLinking: true`, lo que permite vincular cuentas OAuth con cuentas existentes que tengan el mismo email.

5. **Para Producción:**
   - Actualiza las URIs de redirección en Google/Facebook Console
   - Usa variables de entorno de producción
   - Asegúrate de tener HTTPS habilitado

---

## 🐛 Troubleshooting

### Los botones OAuth no aparecen:

1. **Verifica las variables de entorno:**
   ```bash
   echo $GOOGLE_CLIENT_ID
   ```

2. **Reinicia el servidor:**
   ```bash
   npm run dev
   ```

3. **Verifica la consola del navegador:** Busca errores de hidratación o configuración

4. **Verifica el endpoint de health:**
   ```bash
   curl http://localhost:3000/api/health | jq '.config.oauthProviders'
   ```

### Error de OAuth Redirect:

- Verifica que las URIs de redirección en Google/Facebook Console sean correctas
- Formato: `http://localhost:3000/api/auth/callback/google`

### Error de Hydration:

- Si ves errores de hidratación, verifica que estés usando la última versión del código con el fix de `isMounted`

---

## 📚 Recursos

- [Google Cloud Console](https://console.cloud.google.com/)
- [Facebook Developers](https://developers.facebook.com/)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Configuración de Google OAuth](https://next-auth.js.org/providers/google)
- [Configuración de Facebook OAuth](https://next-auth.js.org/providers/facebook)
