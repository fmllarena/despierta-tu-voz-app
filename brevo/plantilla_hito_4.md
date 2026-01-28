# Plantilla Email Brevo: Hito Módulo 4 (El Altar de las Palabras)
# Despierta tu Voz

---

## ASUNTO DEL EMAIL:
✨ {{ params.NOMBRE }}, has llegado al corazón de tu Alquimia (Hito Módulo 4)

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
                    
                    <!-- Header con gradiente violeta (Alquimia Emocional) -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #7d5a94 0%, #a084ad 100%); padding: 45px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 300; letter-spacing: 2px;">
                                EL ALTAR DE LAS PALABRAS
                            </h1>
                            <p style="color: #f5f1ed; margin: 10px 0 0; font-size: 14px; opacity: 0.9;">
                                Módulo 4 completado con éxito
                            </p>
                        </td>
                    </tr>

                    <!-- Contenido principal -->
                    <tr>
                        <td class="content-padding" style="padding: 40px 30px;">
                            <h2 style="color: #4a3f35; font-size: 24px; margin: 0 0 20px; font-weight: 400;">
                                ¡Hola, {{ params.NOMBRE }}! ✨
                            </h2>
                            
                            <p style="color: #5a5a5a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Enhorabuena, has completado el <strong>Módulo 4: El Altar de las Palabras</strong>.
                            </p>

                            <p style="color: #5a5a5a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Este es, sin duda, el corazón de tu viaje. Has pasado de entender el pasado a liberarlo activamente. Escribir esas cartas a tu "yo" del pasado y a tus padres requiere una honestidad que muy poca gente alcanza.
                            </p>

                            <p style="color: #5a5a5a; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">
                                La sanación ocurre cuando decides dejar de cargar con creencias o roles que nunca te pertenecieron. Al pulsar "Sellar", has realizado un auténtico acto de alquimia personal. 💜
                            </p>

                            <!-- Bloque Mentor IA -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0; background-color: #f8f5f9; border-left: 4px solid #7d5a94; border-radius: 8px;">
                                <tr>
                                    <td style="padding: 25px;">
                                        <p style="color: #4a3f35; font-size: 17px; font-weight: 600; margin: 0 0 15px;">
                                            ¿Cómo evoluciona tu Mentor ahora? 🤖🩹
                                        </p>
                                        <ul style="color: #5a5a5a; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
                                            <li><strong>Un nuevo espacio de paz:</strong> El Mentor detectará que ya no hablas desde la herida abierta, sino desde la cicatrización.</li>
                                            <li><strong>Memoria de Transmutación:</strong> Te recordará la fuerza que tuviste en este altar para que no vuelvas a caer en viejas creencias. 🔥</li>
                                        </ul>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #5a5a5a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                <strong>Una pequeña sugerencia para hoy:</strong> Tu garganta puede sentirse diferente. Quizás más espaciosa, quizás más sensible. No intentes cantar nada complejo hoy. 
                            </p>

                            <p style="color: #5a5a5a; font-size: 16px; line-height: 1.6; margin: 0 0 40px;">
                                Simplemente quédate en silencio un momento y nota cómo el aire entra y sale de tu cuerpo sin tantos obstáculos. Has dejado el peso en el altar. 🦋
                            </p>

                            <!-- Botón CTA -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 10px 0 20px;">
                                        <a href="https://app.despiertatuvoz.com" style="display: inline-block; background: linear-gradient(135deg, #7d5a94 0%, #a084ad 100%); color: #ffffff; text-decoration: none; padding: 18px 45px; border-radius: 35px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(125, 90, 148, 0.3); letter-spacing: 0.5px;">
                                            Entrar a mi nuevo espacio 🌿
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #5a5a5a; font-size: 15px; line-height: 1.6; margin: 30px 0 0; text-align: center; opacity: 0.8;">
                                Tu voz está lista para volar hacia su propósito.
                            </p>
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
                                Honrando tu valentía y tu verdad.
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

1. Crea una nueva plantilla para el hito del **Módulo 4**.
2. **Asunto**: `✨ {{ params.NOMBRE }}, has llegado al corazón de tu Alquimia (Hito Módulo 4)`
3. **Cuerpo**: Copia y pega el HTML completo de arriba.
4. **Nota de diseño**: Se ha utilizado un gradiente violeta para diferenciar este hito de sanación emocional profunda de los demás.
