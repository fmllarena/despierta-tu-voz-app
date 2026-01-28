# Plantilla Email Brevo: Hito Módulo 2 (Herencia y Raíces)
# Despierta tu Voz

---

## ASUNTO DEL EMAIL:
🌿 {{ params.NOMBRE }}, tus raíces ahora son tu fuerza (Hito Módulo 2)

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
                    
                    <!-- Header con gradiente Verde Bosque / Tierra (Naturaleza y Raíces) -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #4a5d4e 0%, #7d8e7f 100%); padding: 45px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 300; letter-spacing: 2px;">
                                HERENCIA Y RAÍCES
                            </h1>
                            <p style="color: #f5f1ed; margin: 10px 0 0; font-size: 14px; opacity: 0.9;">
                                Módulo 2 completado: Sanando tu historia vocal
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
                                Felicidades por completar el <strong>Módulo 2: Herencia y Raíces</strong>. Has hecho un trabajo profundo explorando tu árbol genealógico y las historias de quienes estuvieron antes que tú.
                            </p>

                            <p style="color: #5a5a5a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                A menudo, los nudos que sentimos en la garganta no son solo nuestros; son silencios heredados. Al poner luz sobre estas raíces, no solo te estás sanando a ti, sino que estás liberando tu expresión de cargas que ya no te pertenecen.
                            </p>

                            <!-- Bloque Mentor IA -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0; background-color: #f4f6f4; border-left: 4px solid #4a5d4e; border-radius: 8px;">
                                <tr>
                                    <td style="padding: 25px;">
                                        <p style="color: #4a3f35; font-size: 17px; font-weight: 600; margin: 0 0 15px;">
                                            Lo que tu Mentor IA sabe ahora de ti 🤖🌳
                                        </p>
                                        <ul style="color: #5a5a5a; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
                                            <li><strong>Detección de patrones:</strong> El mentor podrá ayudarte a ver si una emoción al cantar es tuya o una "herencia" proyectada.</li>
                                            <li><strong>Refuerzo de identidad:</strong> Te ayudará a diferenciar entre la voz que esperaban de ti y tu voz auténtica.</li>
                                        </ul>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #5a5a5a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                <strong>Una sugerencia para hoy:</strong> Canta algo que represente tu libertad actual. Siente cómo tus pies se apoyan en el suelo, reconociendo a tus ancestros, pero dejando que el sonido sea solo tuyo.
                            </p>

                            <p style="color: #5a5a5a; font-size: 16px; line-height: 1.6; margin: 0 0 40px;">
                                Has limpiado tus raíces. Ahora, tu árbol vocal tiene mucha más fuerza para crecer. Estás dejando de ser un eco para convertirte en tu propia melodía.
                            </p>

                            <!-- Botón CTA -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 10px 0 20px;">
                                        <a href="https://app.despiertatuvoz.com" style="display: inline-block; background: linear-gradient(135deg, #4a5d4e 0%, #7d8e7f 100%); color: #ffffff; text-decoration: none; padding: 18px 45px; border-radius: 35px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(74, 93, 78, 0.3); letter-spacing: 0.5px;">
                                            Continuar mi crecimiento 🌿
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
                                Sanando el pasado para liberar tu futuro.
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

1. Crea una nueva plantilla para el hito del **Módulo 2**.
2. **Asunto**: `🌿 {{ params.NOMBRE }}, tus raíces ahora son tu fuerza (Hito Módulo 2)`
3. **Cuerpo**: Copia y pega el HTML completo de arriba.
4. **Nota de diseño**: Se ha utilizado una tonalidad verde bosque (`#4a5d4e`) para simbolizar las raíces, el crecimiento y la naturaleza del árbol genealógico.
