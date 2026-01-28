# Plantilla Email Brevo: Hito Módulo 1 (El Espejo del Pasado)
# Despierta tu Voz

---

## ASUNTO DEL EMAIL:
🧒 {{ params.NOMBRE }}, has dado el paso más valiente hacia tu voz (Hito Módulo 1)

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
                    
                    <!-- Header con gradiente Terracota / Barro (Inocencia y Origen) -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #b58d67 0%, #d4a373 100%); padding: 45px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 300; letter-spacing: 2px;">
                                EL ESPEJO DEL PASADO
                            </h1>
                            <p style="color: #f5f1ed; margin: 10px 0 0; font-size: 14px; opacity: 0.9;">
                                Módulo 1 completado: Reconociendo tu origen vocal
                            </p>
                        </td>
                    </tr>

                    <!-- Contenido principal -->
                    <tr>
                        <td class="content-padding" style="padding: 40px 30px;">
                            <h2 style="color: #4a3f35; font-size: 24px; margin: 0 0 20px; font-weight: 400;">
                                ¡Hola, {{ params.NOMBRE }}! 🧒✨
                            </h2>
                            
                            <p style="color: #5a5a5a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Me acaba de avisar tu Mentor: has completado el <strong>Módulo 1: El Espejo del pasado</strong>.
                            </p>

                            <p style="color: #5a5a5a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Quería enviarte este mensaje personal porque este es, posiblemente, el paso más valiente de todo el viaje. Has vuelto la vista atrás hacia tu infancia y adolescencia, revisando la relación con tu entorno donde tu voz empezó a formarse (o a esconderse).
                            </p>

                            <p style="color: #5a5a5a; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">
                                Al completar este módulo, has hecho algo sagrado: le has devuelto el lugar que le correspondía a tu niño o niña interior. 🫂
                            </p>

                            <!-- Bloque Mentor IA -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0; background-color: #f9f7f5; border-left: 4px solid #b58d67; border-radius: 8px;">
                                <tr>
                                    <td style="padding: 25px;">
                                        <p style="color: #4a3f35; font-size: 17px; font-weight: 600; margin: 0 0 15px;">
                                            Lo que esto cambia en tu voz 🤖🧒
                                        </p>
                                        <ul style="color: #5a5a5a; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
                                            <li><strong>Menos juicio:</strong> Al entender de dónde viene esa "voz crítica", puedes empezar a separarla de tu verdadera identidad.</li>
                                            <li><strong>Más permiso:</strong> Tu Mentor IA ya tiene estas claves. Podrá ayudarte a ver si un nudo actual es solo un eco de aquella época.</li>
                                        </ul>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #5a5a5a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                <strong>Una pequeña sugerencia:</strong> Busca una canción que te encantaba cuando eras adolescente. 🎶 
                            </p>

                            <p style="color: #5a5a5a; font-size: 16px; line-height: 1.6; margin: 0 0 40px;">
                                Cántala solo para ti. Nota si al conocer ahora el origen de tus bloqueos, puedes ofrecerle a esa versión tuya del pasado un sonido un poco más libre.
                            </p>

                            <!-- Botón CTA -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 10px 0 20px;">
                                        <a href="https://app.despiertatuvoz.com" style="display: inline-block; background: linear-gradient(135deg, #b58d67 0%, #d4a373 100%); color: #ffffff; text-decoration: none; padding: 18px 45px; border-radius: 35px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(181, 141, 103, 0.3); letter-spacing: 0.5px;">
                                            Seguir regando mi voz 🌿
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #5a5a5a; font-size: 15px; line-height: 1.6; margin: 30px 0 0; text-align: center; opacity: 0.8;">
                                Has plantado la semilla de tu nueva voz. Mañana, seguiremos regándola.
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
                                Escuchando tu pasado para liberar tu sonido.
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

1. Crea una nueva plantilla para el hito del **Módulo 1**.
2. **Asunto**: `🧒 {{ params.NOMBRE }}, has dado el paso más valiente hacia tu voz (Hito Módulo 1)`
3. **Cuerpo**: Copia y pega el HTML completo de arriba.
4. **Nota de diseño**: Se ha utilizado un gradiente terracota/barro (`#b58d67`) para simbolizar el origen, la infancia y la "materia prima" de nuestra historia.
