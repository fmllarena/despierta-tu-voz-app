# Plantilla Email Brevo: Bienvenida Plan Profundiza (Pro)
# Despierta tu Voz

---

## ASUNTO DEL EMAIL:
🌟 {{ params.NOMBRE }}, bienvenido/a al Plan Profundiza: Tu voz, ahora con memoria

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
                    
                    <!-- Header con gradiente Profundiza (Ocre / Desierto) -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #a89585 0%, #8e7d6d 100%); padding: 45px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 300; letter-spacing: 2px;">
                                PLAN PROFUNDIZA
                            </h1>
                            <p style="color: #f5f1ed; margin: 10px 0 0; font-size: 14px; opacity: 0.9;">
                                Cantar desde tu verdad, no desde la técnica
                            </p>
                        </td>
                    </tr>

                    <!-- Contenido principal -->
                    <tr>
                        <td class="content-padding" style="padding: 40px 30px;">
                            <p style="color: #8e7d6d; font-size: 14px; font-weight: 700; text-transform: uppercase; margin: 0 0 10px; letter-spacing: 1px;">
                                ¡Felicidades!
                            </p>
                            <h2 style="color: #4a3f35; font-size: 24px; margin: 0 0 20px; font-weight: 400;">
                                Hola, {{ params.NOMBRE }} 🌟
                            </h2>
                            
                            <p style="color: #5a5a5a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Es una alegría darte la bienvenida al <strong>Plan Profundiza</strong>. Has tomado una decisión valiente: la de dejar de cantar desde la técnica para empezar a cantar desde tu verdad.
                            </p>

                            <p style="color: #5a5a5a; font-size: 16px; line-height: 1.6; margin: 0 0 15px;">
                                A partir de ahora, tu experiencia cambia por completo:
                            </p>

                            <!-- Beneficios Pro -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 25px 0; background-color: #fcf9f5; border-radius: 12px; border: 1px solid #e0d7cf;">
                                <tr>
                                    <td style="padding: 25px;">
                                        <ul style="color: #5a5a5a; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
                                            <li><strong>La Memoria de tu Mentor:</strong> Ya no empezarás de cero; el mentor recordará tus avances y tejerá contigo un hilo conductor. 🧠✨</li>
                                            <li><strong>Los 5 Módulos de Sanación:</strong> Acceso total a tu bitácora de vida, desde la infancia hasta tu propósito.</li>
                                            <li><strong>Conexión Profunda:</strong> Analizaremos tus canciones conectándolas con lo que has trabajado en tus módulos. 🎶</li>
                                        </ul>
                                    </td>
                                </tr>
                            </table>

                            <!-- Primeros Pasos / Ajustes -->
                            <h3 style="color: #4a3f35; font-size: 18px; margin: 30px 0 15px; font-weight: 600;">
                                🌱 Tu primer paso hoy:
                            </h3>
                            <p style="color: #5a5a5a; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                                Entra en la App y saluda a tu mentor. Recuerda que puedes personalizar tu experiencia en el botón de <strong>Ajustes</strong>:
                            </p>
                            <ul style="color: #5a5a5a; font-size: 14px; line-height: 1.6; margin: 0 0 30px; padding-left: 20px;">
                                <li style="margin-bottom: 8px;"><strong>Ajustar el tono:</strong> Suave, directo o poético.</li>
                                <li style="margin-bottom: 8px;"><strong>Controlar la extensión:</strong> Respuestas cortas o exploraciones profundas.</li>
                                <li style="margin-bottom: 8px;"><strong>Definir el rol:</strong> Profesor técnico o terapeuta emocional.</li>
                            </ul>

                            <!-- Botón CTA -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <a href="https://app.despiertatuvoz.com" style="display: inline-block; background: linear-gradient(135deg, #8e7d6d 0%, #a89585 100%); color: #ffffff; text-decoration: none; padding: 18px 45px; border-radius: 35px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(142, 125, 109, 0.3); letter-spacing: 0.5px;">
                                            Empezar a profundizar 🎤
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #5a5a5a; font-size: 15px; line-height: 1.6; margin: 30px 0 0; text-align: center; font-style: italic;">
                                "Tu voz ya no es solo sonido; ahora es el mapa de tu libertad."
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
                                Estamos felices de acompañarte en este proceso.
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

1. Crea una nueva plantilla para el **Bienvenida Plan Profundiza (Pro)**.
2. **Asunto**: `🌟 {{ params.NOMBRE }}, bienvenido/a al Plan Profundiza: Tu voz, ahora con memoria`
3. **Cuerpo**: Copia y pega el HTML completo de arriba.
4. **Nota de diseño**: Se ha utilizado el tono ocre/tierra característico de la marca para transmitir calidez y arraigo, diferenciándolo claramente del azul oscuro del Plan Transforma.
