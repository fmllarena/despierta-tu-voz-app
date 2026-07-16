>
        import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

        let sb;
        let studentId = null, studentName = null;
        let chatHistory = [];
        let currentSessionId = null;

        const EL = (id) => document.getElementById(id);

        async function init() {
            const configRes = await fetch('/api/config');
            const config = await configRes.json();
            sb = createClient(config.url, config.key, {
                auth: { storageKey: 'sb-roleplay-auth-token', autoRefreshToken: true, persistSession: true }
            });

            const { data: { session } } = await sb.auth.getSession();
            if (session) mostrarDashboard();

            EL('loginBtn').onclick = login;
            EL('loginPassword').onkeypress = (e) => { if (e.key === 'Enter') login(); };
            EL('logoutBtn').onclick = logout;
            EL('toggleDarkBtn').onclick = toggleDark;
            EL('selectBtn').onclick = seleccionar;
            EL('studentInput').onkeypress = (e) => { if (e.key === 'Enter') seleccionar(); };
            EL('sendBtn').onclick = enviarMensaje;
            EL('msgInput').onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensaje(); } };
            EL('msgInput').oninput = function() { this.style.height = 'auto'; this.style.height = Math.min(this.scrollHeight, 120) + 'px'; };
    EL('endSessionBtn').onclick = finalizarSesion;

            if (localStorage.getItem('rolesDarkMode') === 'true') {
                document.documentElement.setAttribute('data-theme', 'dark');
                EL('toggleDarkBtn').textContent = '☀️';
            }
        }

        async function login() {
            const email = EL('loginEmail').value.trim();
            const password = EL('loginPassword').value.trim();
            if (!email || !password) { EL('loginError').textContent = 'Introduce email y contraseña.'; return; }

            const { error } = await sb.auth.signInWithPassword({ email, password });
            if (error) { EL('loginError').textContent = error.message; return; }

            const { data: { session } } = await sb.auth.getSession();
            if (session) mostrarDashboard();
        }

        function mostrarDashboard() {
            EL('loginSection').style.display = 'none';
            EL('dashboard').style.display = 'block';
            EL('loginError').textContent = '';
            cargarListaAlumnos();
        }

        async function logout() {
            await sb.auth.signOut();
            EL('dashboard').style.display = 'none';
            EL('loginSection').style.display = 'block';
            studentId = null; studentName = null;
            chatHistory = [];
            currentSessionId = null;
            EL('chatBody').innerHTML = '<div class="chat-empty">Selecciona un alumno para conversar con él.</div>';
            EL('msgInput').disabled = true;
            EL('sendBtn').disabled = true;
            EL('endSessionBtn').disabled = true;
            EL('endSessionBtn').style.display = 'none';
            EL('chatHeader').textContent = 'Selecciona un alumno para empezar';
        }

        async function finalizarSesion() {
            if (!currentSessionId) return;
            EL('endSessionBtn').disabled = true;
            EL('endSessionBtn').textContent = '⏳ Finalizando...';
            try {
                await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        roleplayAction: 'session_end',
                        roleplayData: { sessionId: currentSessionId }
                    })
                });
            } catch (e) { console.warn('Error cerrando sesión roleplay:', e); }
            currentSessionId = null;
            EL('endSessionBtn').disabled = true;
            EL('endSessionBtn').style.display = 'none';
            EL('endSessionBtn').textContent = '⏹ Finalizar';
        }

        function toggleDark() {
            const html = document.documentElement;
            const isDark = html.getAttribute('data-theme') === 'dark';
            html.setAttribute('data-theme', isDark ? '' : 'dark');
            localStorage.setItem('rolesDarkMode', !isDark);
            EL('toggleDarkBtn').textContent = isDark ? '🌙' : '☀️';
        }

        async function cargarListaAlumnos() {
            const { data, error } = await sb
                .from('user_profiles')
                .select('email, nombre')
                .not('email', 'is', null)
                .order('nombre', { ascending: true });
            if (error) { console.error(error); return; }

            const list = EL('studentList');
            list.innerHTML = '';
            data.forEach(a => {
                const opt = document.createElement('option');
                opt.value = a.email;
                opt.textContent = a.nombre ? `${a.nombre} (${a.email})` : a.email;
                list.appendChild(opt);
            });
        }

        async function seleccionar() {
            const email = EL('studentInput').value.trim();
            if (!email) return;

            const { data, error } = await sb
                .from('user_profiles')
                .select('user_id, nombre')
                .eq('email', email.toLowerCase())
                .maybeSingle();

            if (error || !data) {
                EL('studentStatus').textContent = '❌ Alumno no encontrado.';
                return;
            }

            studentId = data.user_id;
            studentName = data.nombre || email;
            EL('studentStatus').textContent = `✅ ${studentName}`;
            EL('chatHeader').textContent = `Conversando con ${studentName}`;
            EL('msgInput').disabled = false;
            EL('sendBtn').disabled = false;
            EL('endSessionBtn').disabled = false;
            EL('endSessionBtn').style.display = 'inline-block';
            EL('msgInput').focus();
            chatHistory = [];
            currentSessionId = null;
            EL('chatBody').innerHTML = `<div class="chat-empty">Empieza a escribir para conversar con ${studentName}.</div>`;

            // Iniciar sesión de roleplay
            try {
                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ roleplayAction: 'start', roleplayData: { userId: (await sb.auth.getUser()).data.user?.id, studentId, topic: 'Conversación libre' } })
                });
                const data = await res.json();
                if (data.id) currentSessionId = data.id;
            } catch (e) { console.warn('No se pudo iniciar sesión roleplay:', e); }
        }

        function addMsg(cls, label, text) {
            const body = EL('chatBody');
            const empty = body.querySelector('.chat-empty');
            if (empty) empty.remove();
            const div = document.createElement('div');
            div.className = `msg ${cls}`;
            const html = text
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.+?)\*/g, '<em>$1</em>')
                .replace(/\n/g, '<br>');
            div.innerHTML = `<div class="msg-label">${label}</div><div>${html}</div>`;
            body.appendChild(div);
            div.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        function setLoading(on) {
            EL('loading').style.display = on ? 'block' : 'none';
            EL('sendBtn').disabled = on;
            EL('msgInput').disabled = on;
        }

        async function enviarMensaje() {
            const text = EL('msgInput').value.trim();
            if (!text || !studentId) return;

            EL('msgInput').value = '';
            EL('msgInput').style.height = 'auto';
            addMsg('yo', 'Yo', text);
            setLoading(true);

            try {
                const body = {
                    intent: 'roleplay_chat',
                    message: text,
                    history: chatHistory,
                    userId: studentId
                };
                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                const data = await res.json();
                if (data.error) throw new Error(data.error);

                const now = new Date().toISOString();
                chatHistory.push({ role: 'user', parts: [{ text }], created_at: now });

                const parsed = parseRespuesta(data.text);
                addMsg('alumno', studentName, parsed);
                chatHistory.push({ role: 'model', parts: [{ text: parsed }], created_at: now });

                // Guardar ambos mensajes en la sesión
                if (currentSessionId) {
                    try {
                        await fetch('/api/chat', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                roleplayAction: 'save_message',
                                roleplayData: {
                                    sessionId: currentSessionId,
                                    messages: [
                                        { role: 'mentor', content: text },
                                        { role: 'student', content: parsed }
                                    ]
                                }
                            }
                        });
                    } catch (e) { console.warn('No se guardó mensaje roleplay:', e); }
                }

            } catch (e) {
                addMsg('alumno', 'Error', `❌ ${e.message}`);
            } finally {
                setLoading(false);
                EL('msgInput').focus();
            }
        }

        function parseRespuesta(text) {
            return text.replace(/^(A|B|Alumno A|Alumno B|alumno a|alumno b):\s*/i, '').trim();
        }

        init();
    