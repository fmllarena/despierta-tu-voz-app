# Plantilla Email Brevo: 5 días tras finalizar Módulos
# Despierta tu Voz

---

## ASUNTO DEL EMAIL:
🚀 {{ params.NOMBRE }}, tu voz ha despertado... ¿qué sigue ahora?

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
                    
                    <!-- Header con gradiente de Expansión (Dorado / Alquimia) -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #d4af37 0%, #8e7d6d 100%); padding: 45px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 300; letter-spacing: 2px;">
                                TU NUEVA VOZ
                            </h1>
                            <p style="color: #f5f1ed; margin: 10px 0 0; font-size: 14px; opacity: 0.9;">
                                El camino de la expansión continúa
                            </p>
                        </td>
                    </tr>

                    <!-- Contenido principal -->
                    <tr>
                        <td class="content-padding" style="padding: 40px 30px;">
                            <h2 style="color: #4a3f35; font-size: 24px; margin: 0 0 20px; font-weight: 400;">
                                ¡Hola, {{ params.NOMBRE }}! 🕊️
                            </h2>
                            
                            <p style="color: #5a5a5a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Hace unos días que terminaste tu viaje por los 5 módulos de <strong>Despierta tu Voz</strong>. ¡Menudo recorrido! Has pasado por la semilla de tu infancia, tus raíces, tus personajes y ese altar donde soltaste lo que no era tuyo.
                            </p>

                            <p style="color: #5a5a5a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Es normal que ahora te preguntes: <em>“¿Y ahora qué? ¿He terminado?”</em>. La respuesta es que ahora es cuando realmente empiezas a vivir tu propósito.
                            </p>

                            <!-- 3 Formas de continuar -->
                            <h3 style="color: #4a3f35; font-size: 18px; margin: 30px 0 15px; font-weight: 600;">
                                🚀 3 formas de seguir usando tu bitácora cada día:
                            </h3>

                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                                <tr>
                                    <td style="padding: 20px; background-color: #fcf9f5; border-radius: 12px; border: 1px solid #e0d7cf;">
                                        <p style="color: #5a5a5a; font-size: 14px; line-height: 1.6; margin: 0 0 15px;">
                                            ☕ <strong>El Chequeo Matutino:</strong> Antes de empezar tu jornada, pide consejo a tu Mentor según tu Plan de Acción del Módulo 5.
                                        </p>
                                        <p style="color: #5a5a5a; font-size: 14px; line-height: 1.6; margin: 0 0 15px;">
                                            🎶 <strong>Laboratorio de Canciones:</strong> Comparte canciones que te remuevan. Ahora que el Mentor conoce tu historia, sus análisis serán revelaciones reales.
                                        </p>
                                        <p style="color: #5a5a5a; font-size: 14px; line-height: 1.6; margin: 0;">
                                            🧠 <strong>Diario de Expansión:</strong> Cuéntale tus "pequeñas victorias": decir que no, cantar sin miedo... celebrar tus avances fija el cambio en tu sistema.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #5a5a5a; font-size: 15px; line-height: 1.6; margin: 0 0 30px;">
                                <strong>¿Te gustaría compartir tu experiencia?</strong> Si te apetece contarme cómo te ha transformado este proceso, responde a este correo. Me encantará leerte e inspirar a otros con tu viaje. 💌
                            </p>

                            <!-- Botón CTA -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <a href="https://app.despiertatuvoz.com" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #8e7d6d 100%); color: #ffffff; text-decoration: none; padding: 18px 45px; border-radius: 35px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3); letter-spacing: 0.5px;">
                                            Continuar mi expansión 🚀
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
                                Has despertado tu voz.
                            </p>
                            <p style="color: #8e7d6d; font-size: 15px; margin: 0 0 5px; font-weight: bold;">
                                Fernando Martínez
                            </p>
                            <p style="color: #8e7d6d; font-size: 14px; margin: 0 0 20px;">
                                Despierta tu Voz
                            </p>
                            
                            <p style="color: #aaa; font-size: 11px; margin: 15px 0 0; line-height: 1.4;">
                                © 2026 Despierta tu Voz. Todos los derechos reservados.<br>
                                Asegúrate de que el mundo escuche tu sonido.
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

1. Crea una nueva plantilla de seguimiento para **5 días después de completar los módulos**.
2. **Asunto**: `🚀 {{ params.NOMBRE }}, tu voz ha despertado... ¿qué sigue ahora?`
3. **Cuerpo**: Copia y pega el HTML completo de arriba.
4. **Nota de diseño**: Se ha utilizado un gradiente dorado para simbolizar el éxito del cierre de ciclo y la apertura hacia el propósito real.
