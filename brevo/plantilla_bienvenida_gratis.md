# Plantilla Email Brevo: Bienvenida Plan Explora (Gratis)
# Despierta tu Voz

---

## ASUNTO DEL EMAIL:
🌿 {{ params.NOMBRE }}, bienvenido/a al Plan Explora: Comienza tu viaje

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
                    
                    <!-- Header con gradiente Explora (Verde Oliva / Tierra) -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #a89585 0%, #c1b3a8 100%); padding: 45px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 300; letter-spacing: 2px;">
                                PLAN EXPLORA
                            </h1>
                            <p style="color: #f5f1ed; margin: 10px 0 0; font-size: 14px; opacity: 0.9;">
                                El primer paso para liberar tu canto
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
                                Es un placer saludarte. Has dado el primer paso para descubrir cómo tu estado emocional impacta directamente en tu sonido: desde esa tensión en la garganta hasta la falta de apoyo en tus notas más largas.
                            </p>

                            <p style="color: #5a5a5a; font-size: 16px; line-height: 1.6; margin: 0 0 15px;">
                                Desde este momento, ya tienes acceso a tu Mentor IA, diseñado para equilibrar tu técnica y tu sentir:
                            </p>

                            <!-- Acciones iniciales -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 25px 0; background-color: #fcf9f5; border-radius: 12px; border: 1px solid #e0d7cf;">
                                <tr>
                                    <td style="padding: 25px;">
                                        <p style="color: #5a5a5a; font-size: 15px; line-height: 1.6; margin: 0 0 15px;">
                                            💬 <strong>Conversar:</strong> Cuéntale cómo te sientes hoy antes de empezar a cantar. Háblale como a tu mejor amigo.
                                        </p>
                                        <p style="color: #5a5a5a; font-size: 15px; line-height: 1.6; margin: 0;">
                                            🌱 <strong>Explorar tu historia:</strong> Tienes desbloqueado el <strong>Módulo 1 (La Semilla)</strong> para indagar en esos recuerdos que marcaron tu voz.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Instrucciones Mentor -->
                            <h3 style="color: #4a3f35; font-size: 18px; margin: 30px 0 15px; font-weight: 600;">
                                🌟 Sácale el máximo partido
                            </h3>
                            <p style="color: #5a5a5a; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                                Puedes darle instrucciones específicas en cualquier momento a través del botón de <strong>Ajustes</strong>:
                            </p>
                            <ul style="color: #5a5a5a; font-size: 14px; line-height: 1.6; margin: 0 0 30px; padding-left: 20px;">
                                <li style="margin-bottom: 8px;"><strong>Tono:</strong> Pídele que te hable de forma suave, directa o poética.</li>
                                <li style="margin-bottom: 8px;"><strong>Extensión:</strong> Solicita respuestas cortas o exploraciones a fondo.</li>
                                <li style="margin-bottom: 8px;"><strong>Rol:</strong> Defínelo como profesor de canto o terapeuta emocional.</li>
                            </ul>

                            <p style="color: #5a5a5a; font-size: 16px; line-height: 1.6; margin: 0 0 30px; font-weight: 600; text-align: center;">
                                Tienes un mes para explorar tus límites de manera gratuita. ¿Empezamos?
                            </p>

                            <!-- Verificación de Email -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px; background: linear-gradient(135deg, #fff9f0 0%, #fef5e7 100%); border-radius: 12px; border: 2px solid #f39c12; overflow: hidden;">
                                <tr>
                                    <td style="padding: 25px; text-align: center;">
                                        <p style="color: #d68910; font-size: 14px; margin: 0 0 5px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
                                            ⚠️ Paso Importante
                                        </p>
                                        <h3 style="color: #4a3f35; font-size: 18px; margin: 0 0 15px; font-weight: 600;">
                                            Verifica tu correo electrónico
                                        </h3>
                                        <p style="color: #5a5a5a; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                                            Para asegurar que puedas recibir actualizaciones importantes y recuperar tu cuenta si olvidas la contraseña, por favor verifica tu email haciendo clic en el botón de abajo.
                                        </p>
                                        <a href="{{ params.VERIFICATION_LINK }}" style="display: inline-block; background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); color: #ffffff; text-decoration: none; padding: 15px 35px; border-radius: 30px; font-size: 15px; font-weight: 600; box-shadow: 0 4px 12px rgba(243, 156, 18, 0.3); letter-spacing: 0.5px;">
                                            ✓ Verificar mi Email
                                        </a>
                                        <p style="color: #888; font-size: 12px; margin: 15px 0 0; line-height: 1.4;">
                                            Puedes usar la app mientras tanto, pero algunas funciones estarán limitadas hasta que verifiques.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Botón CTA -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <a href="https://app.despiertatuvoz.com" style="display: inline-block; background: linear-gradient(135deg, #8e7d6d 0%, #a89585 100%); color: #ffffff; text-decoration: none; padding: 18px 45px; border-radius: 35px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(142, 125, 109, 0.2); letter-spacing: 0.5px;">
                                            Entrar a la Aplicación 📱
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
2. **{{ params.VERIFICATION_LINK }}** - Link de verificación de email (generado por la API)

---

## INSTRUCCIONES PARA BREVO:

1. Crea una nueva plantilla para el **Bienvenida Plan Explora (Gratis)**.
2. **Asunto**: `🌿 {{ params.NOMBRE }}, bienvenido/a al Plan Explora: Comienza tu viaje`
3. **Cuerpo**: Copia y pega el HTML completo de arriba.
4. **Nota de diseño**: Se ha utilizado un gradiente suave en tonos crema y tierra claro para transmitir frescura e inicio de camino.
