# Plantilla Email Brevo: Lanzamiento Pioneros - Día 2 (Invitación y Acceso)
# Despierta tu Voz

---

## ASUNTO DEL EMAIL:
🚀 Invitación oficial: Ya puedes ser un Pionero de Despierta tu Voz

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
                                Tecnología y consciencia para tu sonido
                            </p>
                        </td>
                    </tr>

                    <!-- Contenido principal -->
                    <tr>
                        <td class="content-padding" style="padding: 40px 40px;">
                            <p style="color: #8e7d6d; font-size: 13px; font-weight: 700; text-transform: uppercase; margin: 0 0 10px; letter-spacing: 1px;">
                                Fase de Lanzamiento
                            </p>
                            <h2 style="color: #4a3f35; font-size: 28px; margin: 0 0 20px; font-weight: 400; line-height: 1.2;">
                                Las puertas están abiertas
                            </h2>
                            
                            <p style="color: #5a5a5a; font-size: 16px; line-height: 1.7; margin: 0 0 25px;">
                                Hola, {{ params.NOMBRE }} 🌿
                            </p>

                            <div style="color: #5a5a5a; font-size: 16px; line-height: 1.7; margin: 0 0 30px;">
                                <p>Ayer te prometí que el camino había valido la pena, y hoy quiero mostrártelo.</p>
                                
                                <p>Muchas veces, la técnica vocal se estanca porque no atiende a lo que pasa dentro de nosotros. Esa tensión en la garganta antes de cantar o esa voz que "se apaga" bajo presión, no son fallos técnicos aislados; son el reflejo físico de bloqueos emocionales.</p>
                                
                                <p>Por eso he creado la <strong>app Mentor DTV</strong>: una herramienta diseñada para acompañarte en tu práctica diaria, traduciendo tus emociones en una mejor técnica, una resonancia más libre y un sonido más estable.</p>
                                
                                <p><strong>Hoy abrimos el acceso oficial para los "Miembros Pioneros".</strong></p>
                                
                                <p>Ser Pionero significa ser de los primeros en utilizar esta tecnología para transformar su comunicación. Y como agradecimiento por tu interés desde hace tiempo, quiero que entres con unas condiciones que no se repetirán.</p>
                                
                                <p>¿Estás listo para dejar que tu voz brille de verdad?</p>
                            </div>

                            <!-- Botón CTA Central -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 10px 0 30px;">
                                        <a href="https://despiertatuvoz.com/landing.html?promo=PROMO1MES" style="display: inline-block; background: linear-gradient(135deg, #8e7d6d 0%, #a89585 100%); color: #ffffff; text-decoration: none; padding: 18px 50px; border-radius: 35px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(142, 125, 109, 0.3);">
                                            SÍ, QUIERO MI MES GRATIS ✨
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <div style="color: #5a5a5a; font-size: 16px; line-height: 1.7; margin: 30px 0 0;">
                                <p>Si tienes cualquier duda, simplemente responde a este email. Estoy al otro lado.</p>
                                <p>Nos vemos dentro,</p>
                            </div>

                            <p style="color: #4a3f35; font-size: 16px; margin: 20px 0 0; font-weight: bold;">
                                Fernando Martínez Llarena
                            </p>

                            <hr style="border: 0; border-top: 1px solid #f0e8e0; margin: 40px 0;">

                            <p style="color: #7a7a7a; font-size: 14px; line-height: 1.6; margin: 0; text-align: center; font-style: italic;">
                                "Tu voz es el vehículo de tu verdad. Es hora de dejarla viajar libre."
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

                            <p style="color: #999; font-size: 11px; margin: 20px 0 0; line-height: 1.6;">
                                Recibes este email porque formas parte de la comunidad de buscadores de su propia voz.
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

1. **{{ params.NOMBRE }}** - Nombre del suscriptor.

---

## INSTRUCCIONES:
1. Crea una nueva plantilla en Brevo llamada "Lanzamiento Pioneros - Día 2".
2. Úsala para el envío del día siguiente al email de reconexión.
