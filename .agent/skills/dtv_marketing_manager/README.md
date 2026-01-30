# 🚀 DTV Marketing Manager - Quick Start

## 📦 Instalación

1. **Copia el archivo de configuración:**
```bash
cd .agent/skills/dtv_marketing_manager
cp .env.example .env
```

2. **Configura tus tokens en `.env`:**
   - `META_ACCESS_TOKEN`: Token de Meta Graph API
   - `META_PAGE_ID`: ID de tu página de Facebook
   - `META_INSTAGRAM_ACCOUNT_ID`: ID de tu cuenta de Instagram Business
   - `BITLY_ACCESS_TOKEN`: Token de Bitly API

## 🔑 Obtener Tokens

### Meta Graph API

1. Ve a [Meta for Developers](https://developers.facebook.com/)
2. Crea una app o usa una existente
3. Ve a **Tools > Graph API Explorer**
4. Selecciona tu página y cuenta de Instagram
5. Genera un token con estos permisos:
   - `instagram_content_publish`
   - `pages_manage_posts`
   - `pages_show_list`
   - `instagram_basic`
   - `pages_read_engagement`

### Bitly API

1. Ve a [Bitly Settings](https://app.bitly.com/settings/api/)
2. Genera un nuevo token de acceso
3. Copia el token a tu `.env`

## ▶️ Uso

### Modo Borrador (Recomendado para empezar)
```bash
node scripts/run.js --mode=draft
```
Genera el contenido y lo publica como borrador en Meta Business Suite para revisión manual.

### Solo Generar Assets
```bash
node scripts/run.js --mode=assets_only
```
Genera las imágenes, copy y link corto, pero NO publica. Los assets se guardan en `output/YYYY-MM-DD/`.

### Publicación Programada
```bash
node scripts/run.js --mode=publish
```
Programa la publicación automática para las 18:00 CET del mismo día.

### Especificar Día de la Semana
```bash
node scripts/run.js --day=monday --mode=draft
```

## 📁 Estructura de Output

Cuando usas `--mode=assets_only`, los archivos se guardan en:

```
output/
└── 2026-01-26/
    ├── content.json      # Toda la información del contenido
    ├── feed.png          # Imagen para Feed (1:1)
    ├── story.png         # Imagen para Story (9:16)
    └── copy.txt          # Copy completo con hashtags
```

## 🔍 Verificar Logs

Los logs se guardan en `logs/YYYY-MM-DD.log` con información de cada ejecución.

## ⚠️ Notas Importantes

1. **Primera Ejecución**: Usa `--mode=assets_only` para verificar que todo funciona correctamente
2. **Revisión Manual**: Siempre revisa el contenido antes de publicar en modo `publish`
3. **Tokens**: Nunca commitees el archivo `.env` con tus tokens reales
4. **Permisos**: Asegúrate de que tu token de Meta tenga todos los permisos necesarios

## 🐛 Troubleshooting

### Error: "META_ACCESS_TOKEN no configurado"
- Verifica que copiaste `.env.example` a `.env`
- Asegúrate de que el token esté correctamente configurado en `.env`

### Error: "Invalid OAuth Token"
- Tu token de Meta puede haber expirado
- Genera un nuevo token en Graph API Explorer
- Verifica que los permisos estén activos

### Error: "Bitly API Error"
- Verifica tu token de Bitly en `.env`
- Si no tienes token, el sistema usará la URL completa como fallback

## 📞 Soporte

Para más información, consulta el archivo `SKILL.md` completo.
