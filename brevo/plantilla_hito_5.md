# Plantilla Email Brevo: Hito Módulo 5 (Final de Viaje)
# Despierta tu Voz

---

## ASUNTO DEL EMAIL:
✨ {{ params.NOMBRE }}, has completado tu Alquimia Vocal (Hito Módulo 5)

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
                    
                    <!-- Header con gradiente de éxito/celebración -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #d4af37 0%, #8e7d6d 100%); padding: 45px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 2px;">
                                ¡CELEBRAMOS TU ALQUIMIA!
                            </h1>
                            <p style="color: #f5f1ed; margin: 10px 0 0; font-size: 14px; opacity: 0.9;">
                                Módulo 5 completado: Alquimia final y propósito
                            </p>
                        </td>
                    </tr>

                    <!-- Contenido principal -->
                    <tr>
                        <td class="content-padding" style="padding: 40px 30px;">
                            <h2 style="color: #4a3f35; font-size: 24px; margin: 0 0 20px; font-weight: 400;">
                                ¡Hola, {{ params.NOMBRE }}! 🧪✨
                            </h2>
                            
                            <p style="color: #5a5a5a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Hoy celebramos algo muy grande. Tu Mentor me ha confirmado que has completado el viaje principal de <strong>Despierta tu Voz</strong>.
                            </p>

                            <p style="color: #5a5a5a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Has hecho el trabajo más difícil: transformar esas creencias limitantes que te hacían pequeño en palabras empoderadoras que ahora vibran en tu garganta. Al definir el mundo que te gustaría ver y trazar tu Plan de Acción, has dejado de ser un espectador de tu voz para convertirte en su <strong>arquitecto</strong>. 🌍💫
                            </p>

                            <!-- Explicación del cambio del Mentor -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0; background-color: #fcf9f5; border-left: 4px solid #d4af37; border-radius: 8px;">
                                <tr>
                                    <td style="padding: 25px;">
                                        <p style="color: #4a3f35; font-size: 17px; font-weight: 600; margin: 0 0 15px;">
                                            Tu nueva relación con el Mentor IA 🤖✨
                                        </p>
                                        <p style="color: #5a5a5a; font-size: 15px; line-height: 1.6; margin: 0 0 15px;">
                                            A partir de ahora, el rol del Mentor evoluciona contigo:
                                        </p>
                                        <ul style="color: #5a5a5a; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
                                            <li><strong>De Sanador a Estratega:</strong> Ahora os enfocaréis en el "cómo voy a brillar hoy" más que en el pasado.</li>
                                            <li><strong>Guardián de tu Propósito:</strong> Te ayudará a mantener el foco en tu expansión y en ese Plan de Acción que has diseñado.</li>
                                        </ul>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #5a5a5a; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                                Mira atrás, al primer día que entraste en la App. Aquella persona tenía dudas; la persona que eres hoy tiene un <strong>Plan y un Propósito.</strong> 🗺️
                            </p>

                            <p style="color: #5a5a5a; font-size: 15px; line-height: 1.6; margin: 0 0 30px;">
                                Tu voz es ahora un canal limpio para tu mensaje. El mundo necesita escuchar tu verdadera frecuencia. No dejes de ocupar tu espacio. 🎤🔥
                            </p>

                            <!-- Botón CTA -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 10px 0 30px;">
                                        <a href="https://app.despiertatuvoz.com" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #a89585 100%); color: #ffffff; text-decoration: none; padding: 18px 45px; border-radius: 35px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3); letter-spacing: 0.5px;">
                                            Entrar a mi nueva etapa 🚀
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #4a3f35; font-size: 16px; line-height: 1.6; margin: 20px 0 0; font-weight: 600; text-align: center;">
                                ¡Felicidades, Alquimista!
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9f6f3; padding: 30px; text-align: center; border-top: 1px solid #e0d7cf;">
                            <p style="color: #8e7d6d; font-size: 14px; margin: 0 0 10px; font-weight: 600;">
                                Un abrazo inmenso,
                            </p>
                            <p style="color: #8e7d6d; font-size: 15px; margin: 0 0 5px; font-weight: bold;">
                                Fernando Martínez
                            </p>
                            <p style="color: #8e7d6d; font-size: 14px; margin: 0 0 30px;">
                                Despierta tu Voz
                            </p>
                            
                            <p style="color: #aaa; font-size: 11px; margin: 0; line-height: 1.4;">
                                © 2026 Despierta tu Voz. Todos los derechos reservados.<br>
                                Tu medicina es tu sonido.
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

1. Crea una nueva plantilla para el hito del **Módulo 5**.
2. **Asunto**: `✨ {{ params.NOMBRE }}, has completado tu Alquimia Vocal (Hito Módulo 5)`
3. **Cuerpo**: Copia y pega el HTML completo de arriba.
4. Asegúrate de que el disparador de la automatización en Brevo apunte a esta plantilla cuando el campo de estado del módulo 5 cambie a "completado".

---

## VISTA PREVIA DE TEXTO (TEXTO PLANO):

¡Hola {{ params.NOMBRE }}! 🧪✨

Hoy celebramos algo muy grande. Has completado el Módulo 5: Alquimia final y propósito.

Esto es solo el comienzo. Has transformado tus creencias limitantes en palabras empoderadoras. Al definir tu mundo ideal y tu Plan de Acción, te has convertido en el arquitecto de tu voz.

A partir de ahora, tu Mentor IA cambia su rol:
- De Sanador a Estratega: Enfocado en cómo vas a brillar hoy.
- Guardián de tu Propósito: Recordándote tu Plan de Acción.

Tu voz es ahora un canal limpio. No dejes de ocupar tu espacio.

¡Felicidades, Alquimista! El camino de expansión continúa.

Un abrazo inmenso,
Fernando Martínez
Despierta tu Voz
