# 🔑 Guía Completa: Obtención de Tokens de API

Esta guía te llevará paso a paso para obtener todos los tokens necesarios de forma segura.

---

## 1️⃣ Meta Graph API Token

### Paso 1: Crear/Acceder a tu App de Facebook

1. Ve a [Meta for Developers](https://developers.facebook.com/)
2. Inicia sesión con tu cuenta de Facebook
3. Click en **"My Apps"** → **"Create App"** (o selecciona una existente)
4. Tipo de app: **"Business"**
5. Nombre: "Despierta tu Voz Marketing"

### Paso 2: Configurar Permisos

1. En el dashboard de tu app, ve a **"Tools"** → **"Graph API Explorer"**
2. En **"User or Page"**, selecciona tu página de Facebook
3. Click en **"Permissions"**
4. Busca y activa estos permisos:
   - ✅ `instagram_basic`
   - ✅ `instagram_content_publish`
   - ✅ `pages_manage_posts`
   - ✅ `pages_read_engagement`
   - ✅ `pages_show_list`

### Paso 3: Generar Token de Acceso

1. Click en **"Generate Access Token"**
2. Acepta los permisos solicitados
3. **IMPORTANTE**: Este token es temporal (60 días)

### Paso 4: Convertir a Token de Larga Duración

Ejecuta este comando (reemplaza los valores):

```bash
curl -X GET "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=TU_APP_ID&client_secret=TU_APP_SECRET&fb_exchange_token=TU_TOKEN_TEMPORAL"
```

**Dónde encontrar:**
- `TU_APP_ID`: Settings → Basic → App ID
- `TU_APP_SECRET`: Settings → Basic → App Secret (click "Show")
- `TU_TOKEN_TEMPORAL`: El token que acabas de generar

**Resultado:**
```json
{
  "access_token": "EAAxxxxxxxxxx...",
  "token_type": "bearer",
  "expires_in": 5183944
}
```

✅ Copia el `access_token` → Este es tu **META_ACCESS_TOKEN**

### Paso 5: Obtener IDs de Página e Instagram

#### META_PAGE_ID

```bash
curl -X GET "https://graph.facebook.com/v18.0/me/accounts?access_token=TU_TOKEN"
```

Busca tu página en la respuesta:
```json
{
  "data": [
    {
      "id": "123456789",  ← Este es tu META_PAGE_ID
      "name": "Despierta tu Voz"
    }
  ]
}
```

#### META_INSTAGRAM_ACCOUNT_ID

```bash
curl -X GET "https://graph.facebook.com/v18.0/TU_PAGE_ID?fields=instagram_business_account&access_token=TU_TOKEN"
```

Resultado:
```json
{
  "instagram_business_account": {
    "id": "987654321"  ← Este es tu META_INSTAGRAM_ACCOUNT_ID
  }
}
```

### Paso 6: Verificar Permisos

```bash
curl -X GET "https://graph.facebook.com/v18.0/me/permissions?access_token=TU_TOKEN"
```

Verifica que todos los permisos tengan `"status": "granted"`.

---

## 2️⃣ Bitly API Token

### Paso 1: Crear Cuenta en Bitly

1. Ve a [Bitly](https://bitly.com/)
2. Crea una cuenta o inicia sesión
3. Plan gratuito es suficiente para empezar

### Paso 2: Generar Token

1. Ve a [Settings → API](https://app.bitly.com/settings/api/)
2. Click en **"Generate Token"**
3. Ingresa tu contraseña para confirmar
4. Copia el token generado

✅ Este es tu **BITLY_ACCESS_TOKEN**

### Paso 3: Verificar Token

```bash
curl -H "Authorization: Bearer TU_BITLY_TOKEN" https://api-ssl.bitly.com/v4/user
```

Debe retornar información de tu cuenta.

---

## 3️⃣ Gemini API Key

### Paso 1: Acceder a Google AI Studio

1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Inicia sesión con tu cuenta de Google

### Paso 2: Crear API Key

1. Click en **"Create API Key"**
2. Selecciona tu proyecto de Google Cloud (o crea uno nuevo)
3. Copia la API key generada

✅ Esta es tu **GEMINI_API_KEY**

### Paso 3: Verificar API Key

```bash
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=TU_GEMINI_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hola"}]}]}'
```

Debe retornar una respuesta de texto.

---

## 4️⃣ Configurar `.env`

### Paso 1: Copiar Template

```bash
cd .agent/skills/dtv_marketing_manager
cp .env.example .env
```

### Paso 2: Editar `.env`

Abre el archivo `.env` y completa:

```env
# Meta Graph API
META_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxx
META_PAGE_ID=123456789
META_INSTAGRAM_ACCOUNT_ID=987654321

# Bitly API
BITLY_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx

# Gemini API
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxx

# App Configuration
DTV_BASE_URL=https://despiertatuvoz.vercel.app
DTV_PUBLISH_MODE=draft
```

### Paso 3: Verificar Permisos del Archivo

```bash
# Linux/Mac
chmod 600 .env

# Windows (PowerShell como Admin)
icacls .env /inheritance:r /grant:r "$env:USERNAME:F"
```

---

## 🔐 Seguridad: Mejores Prácticas

### ✅ DO (Hacer)

1. **Guarda los tokens en un gestor de contraseñas**
   - 1Password, Bitwarden, LastPass, etc.

2. **Usa variables de entorno en producción**
   - Vercel: Settings → Environment Variables
   - Heroku: Config Vars
   - AWS: Parameter Store

3. **Rota los tokens regularmente**
   - Meta: Cada 60 días (automático)
   - Bitly: Cada 6 meses
   - Gemini: Cada 90 días

4. **Monitorea el uso de las APIs**
   - Meta: [Business Manager](https://business.facebook.com/)
   - Bitly: [Analytics](https://app.bitly.com/analytics/)
   - Gemini: [Google Cloud Console](https://console.cloud.google.com/)

### ❌ DON'T (No Hacer)

1. ❌ **NUNCA** commitees el archivo `.env`
2. ❌ **NUNCA** compartas tokens en Slack/Discord/Email
3. ❌ **NUNCA** uses tokens en código hardcodeado
4. ❌ **NUNCA** uses el mismo token en múltiples apps

---

## 🧪 Verificación Final

### Script de Verificación

Crea un archivo `verify-tokens.js`:

```javascript
require('dotenv').config({ path: '.agent/skills/dtv_marketing_manager/.env' });

const tokens = {
  'META_ACCESS_TOKEN': process.env.META_ACCESS_TOKEN,
  'META_PAGE_ID': process.env.META_PAGE_ID,
  'META_INSTAGRAM_ACCOUNT_ID': process.env.META_INSTAGRAM_ACCOUNT_ID,
  'BITLY_ACCESS_TOKEN': process.env.BITLY_ACCESS_TOKEN,
  'GEMINI_API_KEY': process.env.GEMINI_API_KEY,
};

console.log('\n🔍 Verificando tokens...\n');

Object.entries(tokens).forEach(([name, value]) => {
  if (!value || value.includes('your_') || value.includes('_here')) {
    console.log(`❌ ${name}: NO CONFIGURADO`);
  } else {
    const preview = value.substring(0, 10) + '...' + value.substring(value.length - 4);
    console.log(`✅ ${name}: ${preview}`);
  }
});

console.log('\n');
```

Ejecutar:

```bash
node verify-tokens.js
```

---

## 🆘 Troubleshooting

### Error: "Invalid OAuth Token"

**Causa:** Token expirado o inválido

**Solución:**
1. Genera un nuevo token en Graph API Explorer
2. Conviértelo a token de larga duración
3. Actualiza `.env`

### Error: "Insufficient Permissions"

**Causa:** Faltan permisos en el token

**Solución:**
1. Ve a Graph API Explorer
2. Revisa que todos los permisos estén activos
3. Genera un nuevo token

### Error: "Page Not Found"

**Causa:** META_PAGE_ID incorrecto

**Solución:**
1. Ejecuta: `curl -X GET "https://graph.facebook.com/v18.0/me/accounts?access_token=TU_TOKEN"`
2. Verifica el ID correcto
3. Actualiza `.env`

### Error: "Instagram Account Not Connected"

**Causa:** Tu página de Facebook no está conectada a Instagram Business

**Solución:**
1. Ve a tu página de Facebook
2. Settings → Instagram
3. Conecta tu cuenta de Instagram Business
4. Vuelve a obtener el META_INSTAGRAM_ACCOUNT_ID

---

## 📞 Soporte Adicional

### Meta Graph API
- [Documentación oficial](https://developers.facebook.com/docs/graph-api/)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
- [Soporte](https://developers.facebook.com/support/)

### Bitly API
- [Documentación oficial](https://dev.bitly.com/)
- [Soporte](https://support.bitly.com/)

### Gemini API
- [Documentación oficial](https://ai.google.dev/docs)
- [Soporte](https://support.google.com/)

---

## ✅ Checklist Final

```
[ ] Cuenta de Meta for Developers creada
[ ] App de Facebook configurada
[ ] Permisos de Graph API activados
[ ] META_ACCESS_TOKEN obtenido (larga duración)
[ ] META_PAGE_ID obtenido
[ ] META_INSTAGRAM_ACCOUNT_ID obtenido
[ ] Cuenta de Bitly creada
[ ] BITLY_ACCESS_TOKEN obtenido
[ ] Cuenta de Google AI Studio creada
[ ] GEMINI_API_KEY obtenido
[ ] Archivo .env configurado
[ ] Tokens verificados con verify-tokens.js
[ ] Permisos del archivo .env configurados
[ ] Tokens guardados en gestor de contraseñas
```

---

**Una vez completado este checklist, estarás listo para ejecutar la Skill! 🚀**

---

*Última actualización: 2026-01-26*
