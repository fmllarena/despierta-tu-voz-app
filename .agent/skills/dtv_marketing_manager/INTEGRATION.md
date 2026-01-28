# 🔌 Guía de Integración - DTV Marketing Manager

## 📋 Resumen

Esta guía explica cómo integrar la Skill con las herramientas nativas de Antigravity para automatizar completamente el proceso de generación de contenido.

## 🎨 Integración con `generate_image`

### Modificación Requerida en `image_generator.js`

Actualmente, el módulo `image_generator.js` usa placeholders. Para integrarlo con la herramienta nativa de Antigravity:

**Ubicación:** `.agent/skills/dtv_marketing_manager/scripts/image_generator.js`

**Reemplazar el método `generateFeedImage`:**

```javascript
async generateFeedImage(strategy, copy) {
  const imageConfig = this.prompts.image_generation;
  const basePrompt = imageConfig.base_prompt;
  const feedConfig = imageConfig.feed_post;
  const variation = imageConfig.variations[strategy.type.toLowerCase()] || '';

  const fullPrompt = `${basePrompt}, ${feedConfig.additional}, ${variation}, 1:1 square format, 1080x1080`;

  console.log(`   📸 Generando imagen con IA...`);

  // INTEGRACIÓN CON ANTIGRAVITY
  // Aquí Antigravity llamaría a su herramienta generate_image
  const imageName = `dtv_feed_${strategy.day}_${Date.now()}`;
  
  // Placeholder para que Antigravity lo reemplace con:
  // const imagePath = await antigravity.generate_image({
  //   Prompt: fullPrompt,
  //   ImageName: imageName
  // });

  const imagePath = path.join(TEMP_DIR, `${imageName}.png`);
  
  return imagePath;
}
```

**Reemplazar el método `generateStoryImage`:**

```javascript
async generateStoryImage(strategy, copy) {
  const imageConfig = this.prompts.image_generation;
  const basePrompt = imageConfig.base_prompt;
  const storyConfig = imageConfig.story;
  const variation = imageConfig.variations[strategy.type.toLowerCase()] || '';

  const fullPrompt = `${basePrompt}, ${storyConfig.additional}, ${variation}, 9:16 vertical format, 1080x1920`;

  console.log(`   📸 Generando imagen Story con IA...`);

  const imageName = `dtv_story_${strategy.day}_${Date.now()}`;
  
  // INTEGRACIÓN CON ANTIGRAVITY
  // const imagePath = await antigravity.generate_image({
  //   Prompt: fullPrompt,
  //   ImageName: imageName
  // });

  const imagePath = path.join(TEMP_DIR, `${imageName}.png`);
  
  return imagePath;
}
```

## 🤖 Integración con Gemini API para Copy Generation

### Modificación Requerida en `content_generator.js`

**Ubicación:** `.agent/skills/dtv_marketing_manager/scripts/content_generator.js`

**Agregar al inicio del archivo:**

```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Inicializar Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
```

**Reemplazar el método `generateWithAI`:**

```javascript
async generateWithAI(prompt) {
  try {
    console.log('   🤖 Generando con Gemini API...');
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text.trim();
  } catch (error) {
    console.error('   ❌ Error en Gemini API:', error.message);
    throw error;
  }
}
```

**Agregar a `.env.example`:**

```env
# Gemini API
GEMINI_API_KEY=your_gemini_api_key_here
```

## 📦 Dependencias NPM Requeridas

Agregar al `package.json` del proyecto:

```json
{
  "dependencies": {
    "@google/generative-ai": "^0.1.3",
    "dotenv": "^16.0.3"
  }
}
```

Instalar:

```bash
npm install @google/generative-ai dotenv
```

## 🔄 Workflow Completo Integrado

Una vez integrado, el workflow completo será:

```
1. Calendar Logic → Determina estrategia del día
2. Content Generator + Gemini → Genera copy optimizado
3. Image Generator + Antigravity → Genera imágenes 1:1 y 9:16
4. Bitly Shortener → Acorta URL con tracking
5. Meta Publisher → Publica en Instagram/Facebook
```

## 🧪 Testing de la Integración

### Test 1: Generación de Imágenes

```bash
# Crear un test específico
node -e "
const ImageGenerator = require('./.agent/skills/dtv_marketing_manager/scripts/image_generator.js');
const strategy = {
  type: 'Filosófico',
  day: 'monday',
  theme: 'Test'
};
ImageGenerator.generateImages(strategy, { feed: 'Test copy' })
  .then(images => console.log('✅ Imágenes generadas:', images))
  .catch(err => console.error('❌ Error:', err));
"
```

### Test 2: Generación de Copy

```bash
# Test de copy generation
node -e "
const ContentGenerator = require('./.agent/skills/dtv_marketing_manager/scripts/content_generator.js');
const CalendarLogic = require('./.agent/skills/dtv_marketing_manager/scripts/calendar_logic.js');
const strategy = CalendarLogic.getStrategyForDay('monday');
ContentGenerator.generateCopy(strategy)
  .then(copy => console.log('✅ Copy generado:', copy))
  .catch(err => console.error('❌ Error:', err));
"
```

## 🔐 Configuración de Seguridad

### Variables de Entorno Completas

Tu archivo `.env` final debe contener:

```env
# Meta Graph API
META_ACCESS_TOKEN=EAAxxxxxxxxxx
META_PAGE_ID=123456789
META_INSTAGRAM_ACCOUNT_ID=987654321

# Bitly API
BITLY_ACCESS_TOKEN=xxxxxxxxxxxxxxxx

# Gemini API
GEMINI_API_KEY=AIzaSyxxxxxxxxxx

# App Configuration
DTV_BASE_URL=https://despiertatuvoz.vercel.app
DTV_PUBLISH_MODE=draft
```

### Verificar Permisos de Meta

```bash
# Script para verificar permisos
curl -X GET "https://graph.facebook.com/v18.0/me/permissions?access_token=YOUR_TOKEN"
```

Debe retornar:

```json
{
  "data": [
    {"permission": "instagram_content_publish", "status": "granted"},
    {"permission": "pages_manage_posts", "status": "granted"},
    {"permission": "pages_show_list", "status": "granted"}
  ]
}
```

## 🚀 Ejecución en Producción

### Opción 1: Cron Job (Linux/Mac)

```bash
# Editar crontab
crontab -e

# Agregar línea (ejecutar diariamente a las 8:00 AM)
0 8 * * * cd /path/to/despierta-tu-voz-app && node .agent/skills/dtv_marketing_manager/scripts/run.js --mode=draft >> /var/log/dtv-marketing.log 2>&1
```

### Opción 2: Task Scheduler (Windows)

1. Abrir **Task Scheduler**
2. Crear nueva tarea básica
3. Trigger: Diario a las 8:00 AM
4. Acción: Ejecutar programa
   - Programa: `node`
   - Argumentos: `.agent\skills\dtv_marketing_manager\scripts\run.js --mode=draft`
   - Directorio: `C:\Projects\appDTV\despierta-tu-voz-app`

### Opción 3: Vercel Cron (Recomendado)

Crear `api/marketing-cron.js`:

```javascript
const { exec } = require('child_process');
const path = require('path');

module.exports = async (req, res) => {
  // Verificar que sea una petición de cron
  if (req.headers['x-vercel-cron'] !== 'true') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const scriptPath = path.join(process.cwd(), '.agent/skills/dtv_marketing_manager/scripts/run.js');
  
  exec(`node ${scriptPath} --mode=draft`, (error, stdout, stderr) => {
    if (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.status(200).json({ 
      success: true, 
      output: stdout,
      timestamp: new Date().toISOString()
    });
  });
};
```

Agregar a `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/marketing-cron",
    "schedule": "0 8 * * *"
  }]
}
```

## 📊 Monitoreo y Logs

### Visualizar Logs

```bash
# Ver logs del día actual
cat .agent/skills/dtv_marketing_manager/logs/$(date +%Y-%m-%d).log

# Ver últimas 20 líneas
tail -n 20 .agent/skills/dtv_marketing_manager/logs/$(date +%Y-%m-%d).log

# Seguir logs en tiempo real
tail -f .agent/skills/dtv_marketing_manager/logs/$(date +%Y-%m-%d).log
```

### Dashboard de Métricas (Futuro)

Crear `scripts/analytics.js` para generar reportes semanales:

```javascript
// Analizar logs de la semana
// Generar reporte de engagement
// Enviar por email
```

## 🎯 Próximos Pasos

1. ✅ **Completado**: Estructura de la Skill
2. ✅ **Completado**: Lógica de calendario y estrategia
3. ⏳ **Pendiente**: Integrar `generate_image` de Antigravity
4. ⏳ **Pendiente**: Integrar Gemini API para copy
5. ⏳ **Pendiente**: Configurar tokens de Meta y Bitly
6. ⏳ **Pendiente**: Testing en modo `assets_only`
7. ⏳ **Pendiente**: Testing en modo `draft`
8. ⏳ **Pendiente**: Configurar automatización (cron/Vercel)

## 📞 Soporte

Si necesitas ayuda con la integración, consulta:
- `SKILL.md` - Documentación completa
- `README.md` - Guía de inicio rápido
- `scripts/test.js` - Suite de tests
