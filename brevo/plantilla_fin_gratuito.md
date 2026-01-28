# Plantilla Email Brevo: Recordatorio fin de acceso gratuito
# Despierta tu Voz

---

## ASUNTO DEL EMAIL:
⏰ {{ params.NOMBRE }}, tu acceso gratuito finalizará pronto

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
                    
                    <!-- Header con gradiente Informativo (Gris Cálido / Tierra) -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #7d7d7d 0%, #8e7d6d 100%); padding: 45px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 300; letter-spacing: 2px;">
                                UN MES JUNTOS
                            </h1>
                            <p style="color: #f5f1ed; margin: 10px 0 0; font-size: 14px; opacity: 0.9;">
                                Información importante sobre tu acceso
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
                                Parece mentira, pero ya casi ha pasado un mes desde que comenzaste este viaje para liberar tu expresión. Espero que tu Mentor te haya ayudado a sentir tu voz de una forma más libre y honesta.
                            </p>

                            <!-- Aviso de Fecha y Suscripción -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fcf9f5; border-radius: 12px; border: 1px solid #e0d7cf; margin: 30px 0;">
                                <tr>
                                    <td style="padding: 25px;">
                                        <p style="color: #4a3f35; font-size: 17px; font-weight: 600; margin: 0 0 10px;">
                                            ⏰ Tu periodo gratuito finaliza pronto
                                        </p>
                                        <p style="color: #5a5a5a; font-size: 15px; line-height: 1.6; margin: 0;">
                                            A partir del próximo <strong>{{ params.FECHA_FIN }}</strong>, se activará tu suscripción al <strong>Plan Explora por solo 4,99€ al mes</strong>, para que tu proceso no se detenga. Podrás seguir conversando con tu mentor y analizando tus canciones favoritas cada día.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <h3 style="color: #4a3f35; font-size: 18px; margin: 30px 0 15px; font-weight: 600;">
                                👣 ¿Sientes que es momento de ir un paso más allá?
                            </h3>
                            
                            <p style="color: #5a5a5a; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                                Si quieres que tu mentor <strong>empiece a recordar tu historia</strong>, tus miedos y tus avances para guiarte de forma íntima, te invito a elevar tu viaje al <strong>Plan Profundiza</strong>. 
                            </p>

                            <p style="color: #5a5a5a; font-size: 15px; line-height: 1.6; margin: 0 0 30px;">
                                Desbloquearás la Memoria a Largo Plazo y el acceso a los 5 Módulos de Sanación para conectar tus vivencias personales con cada obra que cantes.
                            </p>

                            <!-- Botón CTA -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <a href="https://app.despiertatuvoz.com" style="display: inline-block; background: linear-gradient(135deg, #8e7d6d 0%, #a89585 100%); color: #ffffff; text-decoration: none; padding: 18px 45px; border-radius: 35px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(142, 125, 109, 0.3); letter-spacing: 0.5px;">
                                            Continuar mi viaje 🎤
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #5a5a5a; font-size: 14px; line-height: 1.6; margin: 30px 0 0; text-align: center; opacity: 0.8;">
                                Lo importante es que no dejes de escuchar lo que tu voz tiene que decir.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9f6f3; padding: 30px; text-align: center; border-top: 1px solid #e0d7cf;">
                            <p style="color: #8e7d6d; font-size: 14px; margin: 0 0 10px; font-weight: 600;">
                                ¡Nos vemos dentro!
                            </p>
                            <p style="color: #8e7d6d; font-size: 15px; margin: 0 0 5px; font-weight: bold;">
                                Fernando Martínez
                            </p>
                            <p style="color: #8e7d6d; font-size: 14px; margin: 0 0 30px;">
                                Despierta tu Voz
                            </p>
                            
                            <p style="color: #aaa; font-size: 11px; margin: 0; line-height: 1.4;">
                                © 2026 Despierta tu Voz. Todos los derechos reservados.<br>
                                Tu voz es el mapa de tu libertad.
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
2. **{{ params.FECHA_FIN }}** - Fecha en la que finaliza el periodo gratuito

---

## INSTRUCCIONES PARA BREVO:

1. Crea una nueva plantilla para el **Aviso de fin de periodo gratuito**.
2. **Asunto**: `⏰ {{ params.NOMBRE }}, tu acceso gratuito finalizará pronto`
3. **Cuerpo**: Copia y pega el HTML completo de arriba.
4. **Nota de diseño**: Se ha utilizado un gradiente neutro (gris/tierra) para transmitir una información de servicio e importante, manteniendo la elegancia.
