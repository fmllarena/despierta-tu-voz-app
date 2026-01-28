/**
 * Despierta tu Voz - AI Support Agent (Web Version)
 * Only AI, minimal UI.
 */
(function () {
    const SUPPORT_STYLE = `
        .dtv-support-bubble {
            position: fixed;
            bottom: 25px;
            right: 25px;
            padding: 0 20px;
            height: 45px;
            background: #8e7d6d;
            border-radius: 25px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 9999;
            transition: transform 0.3s;
            color: white;
            font-weight: bold;
            font-size: 0.9em;
            text-transform: none;
        }
        .dtv-support-bubble:hover { transform: scale(1.1); }
        .dtv-support-bubble img { width: 35px; height: 35px; }

        .dtv-support-window {
            position: fixed;
            bottom: 95px;
            right: 25px;
            width: 350px;
            height: 500px;
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            display: none;
            flex-direction: column;
            overflow: hidden;
            z-index: 9999;
            font-family: 'Outfit', sans-serif;
            border: 1px solid #eee;
        }
        .dtv-support-window.active { display: flex; animation: fadeInUp 0.3s ease; }

        .dtv-support-header {
            background: #8e7d6d;
            color: white;
            padding: 15px;
            text-align: center;
        }
        .dtv-support-header h4 { margin: 0; font-size: 1.1em; }

        .dtv-support-messages {
            flex-grow: 1;
            padding: 15px;
            overflow-y: auto;
            background: #fdfaf7;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .dtv-msg {
            padding: 10px 15px;
            border-radius: 15px;
            max-width: 85%;
            font-size: 0.9em;
            line-height: 1.4;
        }
        .dtv-msg.ia { background: #fff; align-self: flex-start; border: 1px solid #eee; }
        .dtv-msg.user { background: #8e7d6d; color: white; align-self: flex-end; }

        .dtv-support-input {
            padding: 15px;
            display: flex;
            gap: 10px;
            border-top: 1px solid #eee;
        }
        .dtv-support-input input {
            flex-grow: 1;
            border: 1px solid #ddd;
            border-radius: 20px;
            padding: 8px 15px;
            outline: none;
        }
        .dtv-support-input button {
            background: #8e7d6d;
            color: white;
            border: none;
            width: 35px;
            height: 35px;
            border-radius: 50%;
            cursor: pointer;
        }

        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 480px) {
            .dtv-support-window {
                width: calc(100% - 40px);
                height: 70vh;
                right: 20px;
            }
        }
    `;

    function init() {
        const style = document.createElement('style');
        style.innerHTML = SUPPORT_STYLE;
        document.head.appendChild(style);

        const bubble = document.createElement('div');
        bubble.className = 'dtv-support-bubble';
        bubble.innerText = '¿Hablamos? ✨';
        document.body.appendChild(bubble);

        const win = document.createElement('div');
        win.className = 'dtv-support-window';
        win.innerHTML = `
            <div class="dtv-support-header">
                <h4>Asistente Despierta tu Voz</h4>
            </div>
            <div class="dtv-support-messages">
                <div class="dtv-msg ia">¡Hola! ✨ Bienvenido a Despierta tu Voz. Soy tu asistente IA. ¿En qué puedo ayudarte hoy sobre nuestra metodología, planes o la App?</div>
            </div>
            <div class="dtv-support-input">
                <input type="text" placeholder="Escribe tu duda...">
                <button>▶</button>
            </div>
        `;
        document.body.appendChild(win);

        const input = win.querySelector('input');
        const btn = win.querySelector('button');
        const msgBox = win.querySelector('.dtv-support-messages');
        let history = [];

        bubble.addEventListener('click', () => win.classList.toggle('active'));

        async function send() {
            const text = input.value.trim();
            if (!text) return;
            input.value = '';

            appendMsg(text, 'user');
            history.push({ role: 'user', parts: [{ text }] });

            const typingId = 'dtv-typing-' + Date.now();
            appendMsg('...', 'ia', typingId);

            try {
                const response = await fetch('https://app.despiertatuvoz.com/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        intent: 'web_assistant',
                        message: text,
                        history: history
                    })
                });

                const rawText = await response.text();
                let data;
                try {
                    data = JSON.parse(rawText);
                } catch (jsonErr) {
                    console.error("Respuesta no es JSON:", rawText);
                    throw new Error(`Error del servidor (No JSON): ${rawText.substring(0, 50)}...`);
                }

                if (data.error) throw new Error(data.error);

                const typingElement = document.getElementById(typingId);
                if (typingElement) typingElement.remove();

                appendMsg(data.text, 'ia');
                history.push({ role: 'model', parts: [{ text: data.text }] });
            } catch (e) {
                const typingElement = document.getElementById(typingId);
                if (typingElement) typingElement.remove();
                appendMsg("Vaya, parece que hay un nudo en la conexión. Por favor, inténtalo de nuevo en un momento.", 'ia');
            }
        }

        function appendMsg(text, role, id = null) {
            const m = document.createElement('div');
            m.className = `dtv-msg ${role}`;
            if (id) m.id = id;
            m.innerText = text;
            msgBox.appendChild(m);
            msgBox.scrollTop = msgBox.scrollHeight;
            return m;
        }

        btn.addEventListener('click', send);
        input.addEventListener('keypress', (e) => { if (e.key === 'Enter') send(); });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
