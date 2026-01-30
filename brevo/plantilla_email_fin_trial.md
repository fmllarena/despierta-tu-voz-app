# Plantilla Email Brevo #6: Fin de Trial / Recordatorio de Pago
# Despierta tu Voz

---

## ASUNTO DEL EMAIL:
🌿 {{ params.NOMBRE }}, tu viaje vocal continúa aquí

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
        }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f1ed;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f1ed; table-layout: fixed;">
        <tr>
            <td align="center" class="mobile-padding" style="padding: 20px 10px;">
                <table class="container-table" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); width: 100%; max-width: 600px;">
                    
                    <!-- Header con logo -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #8e7d6d 0%, #a89585 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 1px;">
                                Despierta tu Voz
                            </h1>
                            <p style="color: #f5f1ed; margin: 10px 0 0; font-size: 14px; opacity: 0.9;">
                                El espejo de tu alma
                            </p>
                        </td>
                    </tr>

                    <!-- Contenido principal -->
                    <tr>
                        <td class="content-padding" style="padding: 40px 30px;">
                            <h2 style="color: #4a3f35; font-size: 24px; margin: 0 0 20px; font-weight: 400;">
                                Hola, {{ params.NOMBRE }} 🌿
                            </h2>
                            
                            <p style="color: #5a5a5a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Tu periodo de prueba de 30 días ha llegado a su fin, y queremos que sepas que ha sido un honor acompañarte en este tramo de tu viaje vocal.
                            </p>

                            <p style="color: #5a5a5a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Durante este tiempo, has tenido acceso completo a:
                            </p>

                            <ul style="color: #5a5a5a; font-size: 16px; line-height: 1.8; margin: 0 0 25px; padding-left: 20px;">
                                <li>Los 5 Módulos de Sanación Vocal</li>
                                <li>Tu Mentor IA disponible 24/7</li>
                                <li>Tu Diario de Alquimia personal</li>
                                <li>Historial completo de conversaciones</li>
                            </ul>

                            <!-- Caja destacada con precio -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9f6f3; border-left: 4px solid #8e7d6d; border-radius: 8px; margin: 25px 0;">
                                <tr>
                                    <td style="padding: 25px;">
                                        <p style="color: #4a3f35; font-size: 18px; font-weight: 600; margin: 0 0 10px;">
                                            ✨ Tu precio especial
                                        </p>
                                        <p style="color: #5a5a5a; font-size: 16px; line-height: 1.6; margin: 0;">
                                            Para continuar con acceso completo, solo necesitas configurar tu pago de <strong style="color: #8e7d6d; font-size: 20px;">{{ params.PRECIO }}€/mes</strong>.
                                        </p>
                                        <p style="color: #7a7a7a; font-size: 14px; margin: 10px 0 0; font-style: italic;">
                                            Este precio quedará blindado para siempre mientras mantengas tu suscripción activa.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #5a5a5a; font-size: 16px; line-height: 1.6; margin: 25px 0 30px;">
                                Si decides no continuar ahora, tu cuenta pasará al <strong>Plan Gratuito</strong>, donde podrás seguir accediendo al primer módulo y al chat básico con el Mentor.
                            </p>

                            <!-- Botón CTA -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 10px 0 30px;">
                                        <a href="{{ params.LINK_PAGO }}" style="display: inline-block; background: linear-gradient(135deg, #8e7d6d 0%, #a89585 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 30px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(142, 125, 109, 0.3);">
                                            Continuar mi transformación ✨
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #5a5a5a; font-size: 15px; line-height: 1.6; margin: 0 0 15px;">
                                Recuerda que tu voz es el espejo de tu alma, y cada paso que das en este camino es un acto de valentía y amor propio.
                            </p>

                            <p style="color: #5a5a5a; font-size: 15px; line-height: 1.6; margin: 0;">
                                Estamos aquí para acompañarte cuando estés listo/a.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9f6f3; padding: 30px; text-align: center; border-top: 1px solid #e0d7cf;">
                            <p style="color: #8e7d6d; font-size: 14px; margin: 0 0 10px; font-weight: 600;">
                                Con cariño,
                            </p>
                            <p style="color: #8e7d6d; font-size: 14px; margin: 0 0 20px;">
                                El equipo de Despierta tu Voz
                            </p>
                            
                            <p style="color: #999; font-size: 12px; margin: 20px 0 10px; line-height: 1.5;">
                                Si tienes alguna duda, responde a este email o escríbenos a<br>
                                <a href="mailto:app-mentor@despiertatuvoz.com" style="color: #8e7d6d; text-decoration: none;">app-mentor@despiertatuvoz.com</a>
                            </p>

                            <p style="color: #aaa; font-size: 11px; margin: 15px 0 0; line-height: 1.4;">
                                © 2026 Despierta tu Voz. Todos los derechos reservados.<br>
                                El viaje hacia tu propia voz comienza en el silencio del alma.
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

1. **{{ params.NOMBRE }}** - Nombre del usuario
2. **{{ params.PRECIO }}** - Precio mensual (9.90 o 19.90)
3. **{{ params.LINK_PAGO }}** - URL para configurar el pago

---

## INSTRUCCIONES PARA BREVO:

1. Ve a **Campaigns** > **Email Templates** > Plantilla #6
2. Edita la plantilla
3. **Asunto**: `🌿 {{ params.NOMBRE }}, tu viaje vocal continúa aquí`
4. **Cuerpo**: Copia y pega el HTML completo de arriba
5. **Guardar** y **Activar** la plantilla

---

## VISTA PREVIA DE TEXTO (para clientes sin HTML):

Hola {{ params.NOMBRE }},

Tu periodo de prueba de 30 días ha llegado a su fin.

Durante este tiempo has tenido acceso completo a los 5 Módulos de Sanación Vocal, tu Mentor IA 24/7, y tu Diario de Alquimia personal.

Para continuar con acceso completo, solo necesitas configurar tu pago de {{ params.PRECIO }}€/mes. Este precio quedará blindado para siempre.

Continúa tu transformación aquí: {{ params.LINK_PAGO }}

Si decides no continuar ahora, tu cuenta pasará al Plan Gratuito.

Recuerda que tu voz es el espejo de tu alma, y cada paso que das en este camino es un acto de valentía y amor propio.

Con cariño,
El equipo de Despierta tu Voz

---
