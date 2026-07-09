<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Despierta tu Voz — Próximamente</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Georgia', 'Times New Roman', serif;
            background: #fcfaf7;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .card {
            max-width: 540px;
            width: 100%;
            text-align: center;
            padding: 50px 40px;
            background: rgba(255,255,255,0.9);
            border-radius: 24px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.06);
            border: 1px solid rgba(142,125,109,0.15);
        }
        .logo {
            max-width: 120px;
            height: auto;
            margin-bottom: 24px;
        }
        h1 {
            font-size: 1.7rem;
            font-weight: 400;
            color: #8e7d6d;
            margin-bottom: 12px;
            letter-spacing: 0.5px;
        }
        .sub {
            font-size: 1rem;
            color: #888;
            margin-bottom: 30px;
            line-height: 1.5;
        }
        .frase {
            font-style: italic;
            color: #8e7d6d;
            font-size: 1.05rem;
            line-height: 1.6;
            padding: 20px 0;
            border-top: 1px solid #eee;
            border-bottom: 1px solid #eee;
            margin-bottom: 24px;
        }
        .frase::before { content: "\201C"; }
        .frase::after { content: "\201D"; }
        .contacto {
            font-size: 0.9rem;
            color: #999;
            margin-bottom: 6px;
        }
        .brand {
            font-size: 0.8rem;
            color: #bbb;
            line-height: 1.4;
        }
    </style>
</head>
<body>
    <div class="card">
        <img src="logo-appDTV2.png" alt="Despierta tu Voz" class="logo">
        <h1>Página temporalmente fuera de servicio</h1>
        <p class="sub">Estamos realizando mejoras para ofrecerte una experiencia más profunda. Volveremos en breve.</p>
        <p class="frase">El silencio también forma parte del proceso. En la pausa es donde la voz encuentra su verdadero tono.</p>
        <p class="contacto">Si quieres contactar: <strong id="email-placeholder"><em>Cargando...</em></strong></p>
        <p class="brand">Despierta tu Voz — inteligencia emocional y desarrollo personal aplicado al canto.</p>
    </div>
    <script>
        (function() {
            var user = 'contacto';
            var domain = 'despiertatuvoz.com';
            document.getElementById('email-placeholder').innerHTML =
                '<a href="mailto:' + user + '@' + domain + '" style="color:#8e7d6d;text-decoration:none;">' +
                user + '@' + domain + '</a>';
        })();
    </script>
</body>
</html>
