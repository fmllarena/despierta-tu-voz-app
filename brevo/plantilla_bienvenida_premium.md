# Plantilla Email Brevo: Bienvenida Plan Transforma (Premium)
# Despierta tu Voz

---

## ASUNTO DEL EMAIL:
✨ {{ params.NOMBRE }}, bienvenido/a al Plan Transforma: Comienza tu viaje profundo

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
            .btn-mobile { width: 100% !important; display: block !important; box-sizing: border-box !important; margin-bottom: 15px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f1ed;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f1ed; table-layout: fixed;">
        <tr>
            <td align="center" class="mobile-padding" style="padding: 20px 10px;">
                <table class="container-table" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); width: 100%; max-width: 600px;">
                    
                    <!-- Header con gradiente Premium (Oro / Profundo) -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #1e2a38 0%, #3a506b 100%); padding: 45px 30px; text-align: center;">
                            <h1 style="color: #d4af37; margin: 0; font-size: 26px; font-weight: 300; letter-spacing: 2px;">
                                PLAN TRANSFORMA
                            </h1>
                            <p style="color: #ffffff; margin: 10px 0 0; font-size: 14px; opacity: 0.9;">
                                Tu nivel más profundo de acompañamiento
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
                                Es un honor darte la bienvenida al <strong>Plan Transforma</strong>. Al elegir este camino, abres la puerta a una evolución total donde tu técnica vocal, tu mente y tu sonido se alinean para que tu voz sea, por fin, tu mayor libertad.
                            </p>

                            <p style="color: #5a5a5a; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                                Ya tienes habilitado todo el potencial de tu Mentor de bolsillo:
                            </p>

                            <!-- Lista de beneficios destacada -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                                <tr>
                                    <td style="padding-left: 10px; border-left: 2px solid #d4af37;">
                                        <p style="color: #5a5a5a; font-size: 15px; margin: 0 0 10px;">💎 <strong>Memoria Total:</strong> Tu IA conectará tus vivencias de los 5 módulos con cada canción.</p>
                                        <p style="color: #5a5a5a; font-size: 15px; margin: 0 0 10px;">🗺️ <strong>Hoja de Ruta:</strong> Trabajaremos en tu Plan de Acción a medida.</p>
                                        <p style="color: #5a5a5a; font-size: 15px; margin: 0;">🎯 <strong>Sesión Individual:</strong> Tu encuentro personal para resolver nudos profundos.</p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Bloque Agendar Sesión -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9f6f3; border-radius: 12px; margin: 30px 0; border: 1px solid #e0d7cf;">
                                <tr>
                                    <td style="padding: 30px; text-align: center;">
                                        <p style="color: #4a3f35; font-size: 18px; font-weight: 600; margin: 0 0 15px;">
                                            📅 Agendemos nuestra cita
                                        </p>
                                        <p style="color: #5a5a5a; font-size: 15px; line-height: 1.6; margin: 0 0 25px;">
                                            Elige el horario que mejor te convenga para nuestra sesión directa:
                                        </p>
                                        
                                        <!-- Botones de Calendario -->
                                        <a href="https://cal.com/fernando-martinez-drmyul/30min" class="btn-mobile" style="display: inline-block; background-color: #8e7d6d; color: #ffffff; text-decoration: none; padding: 14px 25px; border-radius: 30px; font-size: 14px; font-weight: 600; margin: 5px;">
                                            Reunión de 30 min
                                        </a>
                                        <a href="https://cal.com/fernando-martinez-drmyul/sesion-de-1-h" class="btn-mobile" style="display: inline-block; background-color: #3a506b; color: #ffffff; text-decoration: none; padding: 14px 25px; border-radius: 30px; font-size: 14px; font-weight: 600; margin: 5px;">
                                            Sesión de 1 hora
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #5a5a5a; font-size: 15px; line-height: 1.6; margin: 0 0 30px;">
                                Estoy deseando acompañarte en este proceso y ver cómo tu sonido se expande hasta ocupar su verdadero lugar.
                            </p>

                            <!-- Botón App -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <a href="https://app.despiertatuvoz.com" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #8e7d6d 100%); color: #ffffff; text-decoration: none; padding: 18px 45px; border-radius: 35px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3); letter-spacing: 0.5px;">
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
                            <p style="color: #8e7d6d; font-size: 14px; margin: 0 0 10px; font-weight: 600;">
                                Nos vemos pronto, ¡un abrazo!
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

1. Crea una nueva plantilla para el **Bienvenida Premium / Plan Transforma**.
2. **Asunto**: `✨ {{ params.NOMBRE }}, bienvenido/a al Plan Transforma: Comienza tu viaje profundo`
3. **Cuerpo**: Copia y pega el HTML completo de arriba.
4. **Nota de diseño**: Se ha utilizado un gradiente azul oscuro con detalles en oro (`#d4af37`) para resaltar la exclusividad y profundidad del plan premium.
