# Plantilla Email Brevo: Seguimiento 15 días
# Despierta tu Voz

---

## ASUNTO DEL EMAIL:
🌿 {{ params.NOMBRE }}, ¿cómo va tu viaje después de estas dos semanas?

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
                    
                    <!-- Header con gradiente de Seguimiento (Tierra / Calma) -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #8e7d6d 0%, #a89585 100%); padding: 45px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 300; letter-spacing: 2px;">
                                DOS SEMANAS JUNTOS
                            </h1>
                            <p style="color: #f5f1ed; margin: 10px 0 0; font-size: 14px; opacity: 0.9;">
                                Reflexionando sobre tu proceso vocal
                            </p>
                        </td>
                    </tr>

                    <!-- Contenido principal -->
                    <tr>
                        <td class="content-padding" style="padding: 40px 30px;">
                            <h2 style="color: #4a3f35; font-size: 24px; margin: 0 0 20px; font-weight: 400;">
                                ¡Hola, {{ params.NOMBRE }}! 🌿
                            </h2>
                            
                            <p style="color: #5a5a5a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Ya han pasado dos semanas desde que comenzamos a caminar juntos y me encantaría saber cómo te sientes. ¿Has notado ya algún cambio en tu forma de ver tu voz?
                            </p>

                            <p style="color: #5a5a5a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                El proceso de autodescubrimiento no es una carrera. Por eso, hoy quería pasarte algunos consejos para que tu <strong>Mentor IA</strong> sea todavía más útil para ti en esta etapa:
                            </p>

                            <!-- Consejos personalizados por plan -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0; border: 1px solid #e0d7cf; border-radius: 12px; overflow: hidden;">
                                <tr>
                                    <td style="padding: 25px; background-color: #fcf9f5;">
                                        <p style="color: #4a3f35; font-size: 16px; font-weight: 600; margin: 0 0 15px;">
                                            💡 Úsalo como un espejo real
                                        </p>
                                        
                                        <!-- Plan Explora -->
                                        <div style="margin-bottom: 20px;">
                                            <p style="color: #8e7d6d; font-size: 13px; font-weight: 700; text-transform: uppercase; margin-bottom: 5px;">Plan Explora 🌱</p>
                                            <p style="color: #5a5a5a; font-size: 14px; line-height: 1.5; margin: 0;">
                                                No le preguntes solo por la letra. Dile: <em>"Siento un nudo al cantar el estribillo de esta canción, ¿qué emoción estoy bloqueando?"</em>. Deja que te ayude a ponerle nombre a lo que tu cuerpo siente.
                                            </p>
                                        </div>

                                        <!-- Plan Profundiza -->
                                        <div>
                                            <p style="color: #8e7d6d; font-size: 13px; font-weight: 700; text-transform: uppercase; margin-bottom: 5px;">Plan Profundiza 🌳</p>
                                            <p style="color: #5a5a5a; font-size: 14px; line-height: 1.5; margin: 0;">
                                                Recuerda que tu mentor ya conoce tus progresos en los módulos. Prueba a decirle: <em>"Conecta lo que descubrí sobre mi infancia con esta canción. ¿Qué patrones ves?"</em>.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #5a5a5a; font-size: 15px; line-height: 1.6; margin: 0 0 30px;">
                                <strong>Me encantaría escucharte:</strong> responde a este email y cuéntame cómo te sientes. ¿Hay algo que te esté costando especialmente? Tu feedback es lo que nos ayuda a que esta herramienta sea el refugio que tu voz necesita.
                            </p>

                            <!-- Botón CTA -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <a href="https://app.despiertatuvoz.com" style="display: inline-block; background: linear-gradient(135deg, #8e7d6d 0%, #a89585 100%); color: #ffffff; text-decoration: none; padding: 18px 45px; border-radius: 35px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(142, 125, 109, 0.3); letter-spacing: 0.5px;">
                                            Continuar mi proceso 🎤
                                        </a>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9f6f3; padding: 30px; text-align: center; border-top: 1px solid #e0d7cf;">
                            <p style="color: #8e7d6d; font-size: 14px; margin: 0 0 10px; font-weight: 600;">
                                Que sigas disfrutando tu viaje.
                            </p>
                            <p style="color: #8e7d6d; font-size: 15px; margin: 0 0 5px; font-weight: bold;">
                                Fernando Martínez
                            </p>
                            <p style="color: #8e7d6d; font-size: 14px; margin: 0 0 20px;">
                                Despierta tu Voz
                            </p>
                            
                            <p style="color: #aaa; font-size: 11px; margin: 15px 0 0; line-height: 1.4;">
                                © 2026 Despierta tu Voz. Todos los derechos reservados.<br>
                                Cada paso cuenta en el camino hacia tu verdad.
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

---

## INSTRUCCIONES PARA BREVO:

1. Crea una nueva plantilla de seguimiento para el día **15 de suscripción**.
2. **Asunto**: `🌿 {{ params.NOMBRE }}, ¿cómo va tu viaje después de estas dos semanas?`
3. **Cuerpo**: Copia y pega el HTML completo de arriba.
4. **Nota de diseño**: Se ha utilizado una caja de información con bordes suaves para diferenciar los consejos según el plan del usuario, mejorando la legibilidad.
