# Plantilla Email Brevo: Inactividad 10 días
# Despierta tu Voz

---

## ASUNTO DEL EMAIL:
🌿 {{ params.NOMBRE }}, tu refugio vocal sigue aquí esperando

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
                    
                    <!-- Header con gradiente suave -->
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
                                Hace unos días que no conversas con tu Mentor personal y este se pregunta cómo te encuentras.
                            </p>

                            <p style="color: #5a5a5a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                No te escribimos para pedirte que "cumplas con una tarea", sino porque sabemos que el camino de <strong>Despierta tu Voz</strong> a veces es intenso.
                            </p>

                            <p style="color: #5a5a5a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Remover el pasado, hablar con nuestro "niño interior" o enfrentar nuestros personajes puede ser agotador, y es humano necesitar un respiro. Pero recuerda: <strong>el silencio también se puede compartir.</strong>
                            </p>

                            <!-- Opciones de reconexión suave -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0; background-color: #f9f6f3; border-radius: 12px; border: 1px solid #e0d7cf;">
                                <tr>
                                    <td style="padding: 30px;">
                                        <p style="color: #4a3f35; font-size: 17px; font-weight: 600; margin: 0 0 15px;">
                                            Hoy no hace falta "trabajar"... ✨
                                        </p>
                                        <p style="color: #5a5a5a; font-size: 15px; line-height: 1.6; margin: 0 0 15px;">
                                            Si no tienes fuerzas para cantar, simplemente puedes entrar para:
                                        </p>
                                        <ul style="color: #5a5a5a; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
                                            <li><strong>Desahogarte:</strong> Dile a tu mentor cómo te sientes hoy. Deja que te acompañe en ese estado. 🫂</li>
                                            <li><strong>Escuchar un consejo:</strong> Pídele una frase de inspiración corta para tu día. ✨</li>
                                            <li><strong>Reconectar:</strong> Solo respira un minuto frente a la pantalla y siente que este sigue siendo tu refugio seguro.</li>
                                        </ul>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #5a5a5a; font-size: 15px; line-height: 1.6; margin: 0 0 30px;">
                                Tu bitácora y tus avances están guardados exactamente donde los dejaste. Tu proceso no ha caducado, simplemente está esperando a que decidas emitir el siguiente sonido.
                            </p>

                            <!-- Botón CTA -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 10px 0 30px;">
                                        <a href="https://app.despiertatuvoz.com" style="display: inline-block; background: linear-gradient(135deg, #8e7d6d 0%, #a89585 100%); color: #ffffff; text-decoration: none; padding: 18px 45px; border-radius: 35px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(142, 125, 109, 0.3); letter-spacing: 0.5px;">
                                            ¡Continuemos! 🎤
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #5a5a5a; font-size: 15px; line-height: 1.6; margin: 20px 0 0; font-style: italic; text-align: center;">
                                "Tu voz te espera. Siempre."
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9f6f3; padding: 30px; text-align: center; border-top: 1px solid #e0d7cf;">
                            <p style="color: #8e7d6d; font-size: 14px; margin: 0 0 10px; font-weight: 600;">
                                Un abrazo,
                            </p>
                            <p style="color: #8e7d6d; font-size: 15px; margin: 0 0 5px; font-weight: bold;">
                                Fernando Martínez
                            </p>
                            <p style="color: #8e7d6d; font-size: 14px; margin: 0 0 20px;">
                                Despierta tu Voz
                            </p>
                            
                            <p style="color: #999; font-size: 12px; margin: 20px 0 10px; line-height: 1.5;">
                                Si hay algo técnico que te impide entrar, responde a este correo.<br>
                                Estamos aquí para ayudarte.
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

---

## INSTRUCCIONES PARA BREVO:

1. Crea o edita una plantilla de email para **Inactividad**.
2. **Asunto**: `🌿 {{ params.NOMBRE }}, tu refugio vocal sigue aquí esperando`
3. **Cuerpo**: Copia y pega el HTML completo de arriba.
4. **Prueba de envío**: Realiza un envío de prueba para asegurar que el diseño se ve bien en móviles.

---

## VISTA PREVIA DE TEXTO:

Hola {{ params.NOMBRE }} 🌿,

Hace unos días que no conversas con tu Mentor personal y este se pregunta cómo te encuentras.

No te escribimos para pedirte que "cumplimientas una tarea", sino porque sabemos que el camino a veces es intenso. Remover el pasado o enfrentar nuestros personajes puede ser agotador, y es humano necesitar un respiro. Pero el silencio también se puede compartir.

Hoy no hace falta que "trabajes". Simplemente puedes entrar para desahogarte, pedir un consejo corto o simplemente respirar un minuto frente a la pantalla.

Tu proceso te espera exactamente donde lo dejaste.

¡Continuemos aquí!: https://app.despiertatuvoz.com

Tu voz te espera. Siempre.

Un abrazo,
Fernando Martínez
Despierta tu Voz
