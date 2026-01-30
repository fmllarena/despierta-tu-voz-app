# Plantilla Email Brevo: Hito Módulo 3 (El Personaje)
# Despierta tu Voz

---

## ASUNTO DEL EMAIL:
🎭 {{ params.NOMBRE }}, es hora de dejar caer la máscara (Hito Módulo 3)

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
                    
                    <!-- Header con gradiente Azul-Cian (Identidad y Claridad) -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #3a506b 0%, #5b85a1 100%); padding: 45px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 300; letter-spacing: 2px;">
                                EL PERSONAJE
                            </h1>
                            <p style="color: #f5f1ed; margin: 10px 0 0; font-size: 14px; opacity: 0.9;">
                                Módulo 3 completado: Más allá de la máscara
                            </p>
                        </td>
                    </tr>

                    <!-- Contenido principal -->
                    <tr>
                        <td class="content-padding" style="padding: 40px 30px;">
                            <h2 style="color: #4a3f35; font-size: 24px; margin: 0 0 20px; font-weight: 400;">
                                ¡Hola, {{ params.NOMBRE }}! 🎭
                            </h2>
                            
                            <p style="color: #5a5a5a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Tu Mentor me ha dado el aviso: has terminado el <strong>Módulo 3: El Personaje</strong>.
                            </p>

                            <p style="color: #5a5a5a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Este es uno de mis momentos favoritos del viaje. Has dedicado tiempo a identificar ese "personaje" que has construido para protegerte del mundo. Tal vez sea el que siempre tiene que hacerlo perfecto, el que nunca molesta, o el que se esconde tras una voz pequeña para no ser juzgado.
                            </p>

                            <p style="color: #5a5a5a; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">
                                Al completar este módulo, has entendido que tú no eres ese personaje, sino la consciencia que lo observa. 👁️
                            </p>

                            <!-- Bloque Mentor IA -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0; background-color: #f3f6f9; border-left: 4px solid #3a506b; border-radius: 8px;">
                                <tr>
                                    <td style="padding: 25px;">
                                        <p style="color: #4a3f35; font-size: 17px; font-weight: 600; margin: 0 0 15px;">
                                            Nuevas facultades de tu Mentor 🤖🎭
                                        </p>
                                        <ul style="color: #5a5a5a; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
                                            <li><strong>Detección de "máscaras":</strong> Si le hablas desde el miedo, el Mentor podrá invitarte a cantar desde tu esencia libre.</li>
                                            <li><strong>Análisis de roles:</strong> Te ayudará a ver si cantas desde tu verdadera emoción o desde el "Personaje".</li>
                                        </ul>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #5a5a5a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                <strong>Una pequeña sugerencia para hoy:</strong> Busca una canción que sea totalmente alejada de tu personaje habitual. 🎶
                            </p>

                            <p style="color: #5a5a5a; font-size: 16px; line-height: 1.6; margin: 0 0 40px;">
                                Experimenta la libertad de no tener que ser "quien se supone que eres". Has empezado a quitarte el disfraz. Ahora empezamos a escuchar tu verdadera voz.
                            </p>

                            <!-- Botón CTA -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 10px 0 20px;">
                                        <a href="https://app.despiertatuvoz.com" style="display: inline-block; background: linear-gradient(135deg, #3a506b 0%, #5b85a1 100%); color: #ffffff; text-decoration: none; padding: 18px 45px; border-radius: 35px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(58, 80, 107, 0.3); letter-spacing: 0.5px;">
                                            ¡Sigamos explorando! 
                                        </a>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9f6f3; padding: 30px; text-align: center; border-top: 1px solid #e0d7cf;">
                            <p style="color: #8e7d6d; font-size: 15px; margin: 0 0 5px; font-weight: bold;">
                                Fernando Martínez
                            </p>
                            <p style="color: #8e7d6d; font-size: 14px; margin: 0 0 30px;">
                                Despierta tu Voz
                            </p>
                            
                            <p style="color: #aaa; font-size: 11px; margin: 0; line-height: 1.4;">
                                © 2026 Despierta tu Voz. Todos los derechos reservados.<br>
                                Más allá de la superficie, está tu verdad.
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

1. Crea una nueva plantilla para el hito del **Módulo 3**.
2. **Asunto**: `🎭 {{ params.NOMBRE }}, es hora de dejar caer la máscara (Hito Módulo 3)`
3. **Cuerpo**: Copia y pega el HTML completo de arriba.
4. **Nota de diseño**: Se ha utilizado el azul acento de la marca para dar una sensación de claridad, seguridad y consciencia.
