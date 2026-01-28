# Plantilla Email Brevo: Newsletter Genérica
# Despierta tu Voz

---

## ASUNTO DEL EMAIL:
🌿 [Título de la Newsletter] - {{ params.NOMBRE }}, tu medicina vocal de hoy

---

## CUERPO DEL EMAIL (HTML):

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @media screen and (max-width: 600px) {
            .container-table { width: 100% !important; border-radius: 0 !important; }
            .content-padding { padding: 30px 20px !important; }
            .mobile-padding { padding: 20px 10px !important; }
            .feature-img { width: 100% !important; height: auto !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f1ed;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f1ed; table-layout: fixed;">
        <tr>
            <td align="center" class="mobile-padding" style="padding: 20px 10px;">
                <table class="container-table" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); width: 100%; max-width: 600px;">
                    
                    <!-- Header con Logo -->
                    <tr>
                        <td style="background-color: #ffffff; padding: 30px; text-align: center; border-bottom: 1px solid #f0e8e0;">
                            <h1 style="color: #8e7d6d; margin: 0; font-size: 22px; font-weight: 300; letter-spacing: 2px; text-transform: uppercase;">
                                Despierta tu Voz
                            </h1>
                            <p style="color: #a89585; margin: 5px 0 0; font-size: 12px; font-style: italic;">
                                Una dosis de consciencia para tu sonido
                            </p>
                        </td>
                    </tr>

                    <!-- Hero Image / Portada (Placeholder) -->
                    <tr>
                        <td align="center">
                            <img src="https://axwwjtjcawuabzyojabu.supabase.co/storage/v1/object/public/assets/newsletter-hero-placeholder.png" alt="Newsletter" width="600" class="feature-img" style="display: block; width: 600px; max-width: 100%;">
                        </td>
                    </tr>

                    <!-- Contenido principal -->
                    <tr>
                        <td class="content-padding" style="padding: 40px 40px;">
                            <p style="color: #8e7d6d; font-size: 13px; font-weight: 700; text-transform: uppercase; margin: 0 0 10px; letter-spacing: 1px;">
                                {{ params.FECHA_HOY }}
                            </p>
                            <h2 style="color: #4a3f35; font-size: 28px; margin: 0 0 20px; font-weight: 400; line-height: 1.2;">
                                {{ params.TITULO_PRINCIPAL }}
                            </h2>
                            
                            <p style="color: #5a5a5a; font-size: 16px; line-height: 1.7; margin: 0 0 25px;">
                                Hola, {{ params.NOMBRE }} 🌿
                            </p>

                            <div style="color: #5a5a5a; font-size: 16px; line-height: 1.7; margin: 0 0 30px;">
                                {{ params.CONTENIDO_TEXTO }}
                            </div>

                            <!-- Botón CTA Central -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 10px 0 30px;">
                                        <a href="{{ params.LINK_CTA }}" style="display: inline-block; background: linear-gradient(135deg, #8e7d6d 0%, #a89585 100%); color: #ffffff; text-decoration: none; padding: 16px 45px; border-radius: 35px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(142, 125, 109, 0.3);">
                                            {{ params.TEXTO_BOTON }} 🌿
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <hr style="border: 0; border-top: 1px solid #f0e8e0; margin: 40px 0;">

                            <p style="color: #7a7a7a; font-size: 14px; line-height: 1.6; margin: 0; text-align: center; font-style: italic;">
                                "Tu medicina única no es solo lo que dices, sino la frecuencia desde la que lo emites."
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9f6f3; padding: 40px 30px; text-align: center; border-top: 1px solid #e0d7cf;">
                            <div style="margin-bottom: 25px;">
                                <a href="https://www.instagram.com/derpierta_tu_voz/" style="text-decoration: none; margin: 0 10px; color: #8e7d6d; font-size: 18px;">📸</a>
                                <a href="https://app.despiertatuvoz.com" style="text-decoration: none; margin: 0 10px; color: #8e7d6d; font-size: 18px;">📱</a>
                            </div>

                            <p style="color: #8e7d6d; font-size: 14px; margin: 0 0 5px; font-weight: bold;">
                                Fernando Martínez
                            </p>
                            <p style="color: #8e7d6d; font-size: 14px; margin: 0 0 20px;">
                                Despierta tu Voz
                            </p>
                            
                            <p style="color: #999; font-size: 11px; margin: 20px 0 0; line-height: 1.6;">
                                Recibes este email porque formas parte de la comunidad de buscadores de su propia voz.<br>
                                <a href="{{ unsubscribe }}" style="color: #8e7d6d; text-decoration: underline;">Dejar de recibir estas cartas</a>
                            </p>

                            <p style="color: #aaa; font-size: 10px; margin: 20px 0 0; line-height: 1.4; text-transform: uppercase; letter-spacing: 1px;">
                                © 2026 Desarrollado con consciencia. Todos los derechos reservados.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

---

## PARÁMETROS REQUERIDOS EN BREVO:

1. **{{ params.NOMBRE }}** - Nombre del suscriptor
2. **{{ params.FECHA_HOY }}** - Fecha actual
3. **{{ params.TITULO_PRINCIPAL }}** - El titular de tu noticia/reflexión
4. **{{ params.CONTENIDO_TEXTO }}** - El cuerpo del mensaje (acepta etiquetas HTML básicas)
5. **{{ params.LINK_CTA }}** - URL del botón (web, blog o app)
6. **{{ params.TEXTO_BOTON }}** - Texto que aparecerá en el botón

---

## INSTRUCCIONES PARA BREVO:

1. Crea una nueva plantilla llamada **Newsletter Genérica**.
2. **Cuerpo**: Copia el código HTML.
3. Al enviar una campaña real, solo tendrás que editar los **parámetros** o sustituir el `{{ params.CONTENIDO_TEXTO }}` por el texto que desees en el editor de Brevo.
4. El enlace de baja (`{{ unsubscribe }}`) es automático en Brevo.
