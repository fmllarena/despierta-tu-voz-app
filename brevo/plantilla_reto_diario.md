# Plantilla Email Brevo: Reto Vocal Diario
# Despierta tu Voz

---

## ASUNTO DEL EMAIL:
🎵 {{ params.NOMBRE }}, tu reto vocal de hoy: {{ params.RETO_TITULO }}

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
            .reto-card { padding: 20px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f1ed;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f1ed; table-layout: fixed;">
        <tr>
            <td align="center" class="mobile-padding" style="padding: 20px 10px;">
                <table class="container-table" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); width: 100%; max-width: 600px;">

                    <!-- Header con gradiente cálido -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #8e7d6d 0%, #a89585 50%, #c4b5a5 100%); padding: 40px 30px; text-align: center;">
                            <p style="color: #f5f1ed; margin: 0 0 5px; font-size: 12px; text-transform: uppercase; letter-spacing: 3px; opacity: 0.8;">
                                {{ params.FECHA }}
                            </p>
                            <h1 style="color: #ffffff; margin: 10px 0 0; font-size: 28px; font-weight: 300; letter-spacing: 1px;">
                                Tu Reto Vocal de Hoy
                            </h1>
                            <p style="color: #f5f1ed; margin: 10px 0 0; font-size: 14px; opacity: 0.9;">
                                5 minutos para conectar con tu voz
                            </p>
                        </td>
                    </tr>

                    <!-- Saludo personal -->
                    <tr>
                        <td class="content-padding" style="padding: 35px 30px 20px;">
                            <p style="color: #8e7d6d; font-size: 13px; font-weight: 700; text-transform: uppercase; margin: 0 0 10px; letter-spacing: 1px;">
                                Hola, {{ params.NOMBRE }} 🌟
                            </p>
                            <p style="color: #5a5a5a; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                                Cada día es una oportunidad para descubrir un nuevo matiz en tu voz. 
                                Aquí tienes tu reto de hoy — pequeño, concreto y transformador si lo haces con presencia.
                            </p>
                        </td>
                    </tr>

                    <!-- Tarjeta del Reto -->
                    <tr>
                        <td style="padding: 0 30px 25px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #fcf9f5 0%, #f8f4ef 100%); border-radius: 15px; border: 1px solid #e0d7cf;">
                                <tr>
                                    <td class="reto-card" style="padding: 30px;">
                                        <div style="text-align: center; margin-bottom: 15px;">
                                            <span style="font-size: 36px;">🎯</span>
                                        </div>
                                        <h2 style="color: #4a3f35; font-size: 22px; margin: 0 0 15px; text-align: center; font-weight: 500;">
                                            {{ params.RETO_TITULO }}
                                        </h2>
                                        <p style="color: #5a5a5a; font-size: 16px; line-height: 1.7; margin: 0 0 20px; text-align: center;">
                                            {{ params.RETO_DESCRIPCION }}
                                        </p>
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td align="center">
                                                    <span style="display: inline-block; background-color: #e8e0d8; color: #6a5d50; padding: 8px 20px; border-radius: 20px; font-size: 13px; font-weight: 600;">
                                                        ⏱ {{ params.RETO_TIEMPO }}
                                                    </span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Beneficio / Reflexión -->
                    <tr>
                        <td style="padding: 0 30px 30px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff8f0; border-radius: 12px; border-left: 4px solid #c4b5a5;">
                                <tr>
                                    <td style="padding: 20px 25px;">
                                        <p style="color: #6a5d50; font-size: 14px; line-height: 1.6; margin: 0; font-style: italic;">
                                            "{{ params.RETO_REFLEXION }}"
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- CTA: Ir a la App -->
                    <tr>
                        <td style="padding: 0 30px 35px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <a href="{{ params.LINK_APP }}" style="display: inline-block; background: linear-gradient(135deg, #8e7d6d 0%, #a89585 100%); color: #ffffff; text-decoration: none; padding: 16px 45px; border-radius: 35px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(142, 125, 109, 0.3); letter-spacing: 0.5px;">
                                            Ir a la App y practicar 🎤
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="color: #999; font-size: 12px; margin: 15px 0 0; text-align: center; line-height: 1.4;">
                                O responde a este email contándome cómo te ha ido con el reto.
                            </p>
                        </td>
                    </tr>

                    <!-- Racha / Estadísticas -->
                    <tr>
                        <td style="padding: 0 30px 35px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9f6f3; border-radius: 12px;">
                                <tr>
                                    <td style="padding: 20px; text-align: center;">
                                        <p style="color: #8e7d6d; font-size: 14px; margin: 0; font-weight: 600;">
                                            🔥 {{ params.RACHA_DIAS }} días seguidos practicando
                                        </p>
                                        <p style="color: #a89585; font-size: 12px; margin: 5px 0 0;">
                                            {{ params.TOTAL_RETOS }} retos completados hasta ahora
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9f6f3; padding: 30px; text-align: center; border-top: 1px solid #e0d7cf;">
                            <p style="color: #8e7d6d; font-size: 14px; margin: 0 0 5px; font-weight: bold;">
                                Fernando Martínez
                            </p>
                            <p style="color: #8e7d6d; font-size: 13px; margin: 0 0 25px;">
                                Despierta tu Voz
                            </p>

                            <div style="margin-bottom: 20px;">
                                <a href="https://www.instagram.com/derpierta_tu_voz/" style="text-decoration: none; margin: 0 8px; color: #8e7d6d; font-size: 16px;">📸</a>
                                <a href="https://app.despiertatuvoz.com" style="text-decoration: none; margin: 0 8px; color: #8e7d6d; font-size: 16px;">🌐</a>
                            </div>

                            <p style="color: #999; font-size: 11px; margin: 0; line-height: 1.6;">
                                Recibes este reto porque formas parte de la comunidad Despierta tu Voz.<br>
                                <a href="{{ unsubscribe }}" style="color: #8e7d6d; text-decoration: underline;">Dejar de recibir retos diarios</a>
                            </p>

                            <p style="color: #aaa; font-size: 10px; margin: 20px 0 0; line-height: 1.4; text-transform: uppercase; letter-spacing: 1px;">
                                © 2026 Despierta tu Voz. Todos los derechos reservados.
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

1. **{{ params.NOMBRE }}** — Nombre del usuario
2. **{{ params.FECHA }}** — Fecha del día (ej: "Martes 16 de Junio, 2026")
3. **{{ params.RETO_TITULO }}** — Título del reto (ej: "Resonancia en la Máscara")
4. **{{ params.RETO_DESCRIPCION }}** — Descripción del ejercicio (1-3 párrafos)
5. **{{ params.RETO_TIEMPO }}** — Duración estimada (ej: "5 minutos")
6. **{{ params.RETO_REFLEXION }}** — Frase de reflexión inspiradora
7. **{{ params.LINK_APP }}** — URL directa a la app
8. **{{ params.RACHA_DIAS }}** — Días consecutivos practicando
9. **{{ params.TOTAL_RETOS }}** — Total de retos completados

---

## EJEMPLOS DE RETOS:

| Título | Descripción | Tiempo | Reflexión |
|--------|-------------|--------|-----------|
| Resonancia en la Máscara | Coloca las manos sobre los pómulos y tararea sintiendo las vibraciones. Sube y baja medio tono lentamente. | 5 min | "Tu voz resuena donde pones tu atención." |
| El Suspiro del Diafragma | Inspira profundamente y suelta con un suspiro sonoro en "Ahhh". Repite 10 veces, cada vez más largo. | 3 min | "El suspiro es el masaje del alma a tu voz." |
| Vocalizaciones con intención | Canta una escala ascendente en "Mmm" imaginando que tu voz acaricia el cielo del paladar. | 7 min | "Cada nota es un acto de amor hacia ti mismo." |

---

## INSTRUCCIONES PARA BREVO:

1. Crear una plantilla llamada **Reto Vocal Diario**.
2. **Asunto**: `🎵 {{ params.NOMBRE }}, tu reto vocal de hoy: {{ params.RETO_TITULO }}`
3. **Cuerpo**: Copiar y pegar el código HTML completo.
4. **Categoría**: Automatización / Retos diarios.
5. Para enviar retos automáticos, usa una función Edge de Supabase o un cron job que seleccione un reto aleatorio de la biblioteca y lo envíe con los parámetros correctos.
