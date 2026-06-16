import { state } from './state.js';

export const PROGRESO = window.PROGRESO = {
    chartInstance: null,

    async abrir() {
        const modal = document.getElementById('progresoModal');
        if (!modal) return;
        modal.style.display = 'flex';

        const content = document.getElementById('progresoContent');
        if (!content) return;
        content.innerHTML = '<div class="ia thinking">Cargando tu progreso...</div>';

        try {
            const { data: { user } } = await state.supabase.auth.getUser();
            if (!user) {
                content.innerHTML = '<p style="text-align:center;color:#999;">Debes iniciar sesión para ver tu progreso.</p>';
                return;
            }

            const response = await fetch('/api/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id })
            });

            if (!response.ok) throw new Error('Error al cargar datos de progreso');
            const data = await response.json();

            this.render(content, data);
        } catch (e) {
            console.error('Error en progreso:', e);
            content.innerHTML = `<p style="text-align:center;color:#e74c3c;">Error al cargar tu progreso: ${e.message}</p>`;
        }
    },

    render(container, data) {
        container.innerHTML = `
            <div class="progreso-header">
                <div class="progreso-greeting">
                    <h2>${data.perfil.nombre ? 'Hola, ' + data.perfil.nombre : 'Mi Progreso'}</h2>
                    <span class="progreso-tier tier-${data.perfil.tier}">${data.perfil.tierLabel}</span>
                </div>
                <p class="progreso-subtitle">${data.racha.accountAgeDays} días desde que empezaste este viaje</p>
            </div>

            <div class="progreso-stats">
                <div class="stat-card">
                    <div class="stat-value">${data.mensajes.total}</div>
                    <div class="stat-label">Mensajes enviados</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${data.viaje.hitoProgress}/5</div>
                    <div class="stat-label">Módulos completados</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${data.sesiones.tier === 'free' || data.sesiones.tier === 'pro' ? '—' : data.sesiones.minutesConsumed + '/' + data.sesiones.minutesAvailable}</div>
                    <div class="stat-label">Minutos de sesión</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${data.viaje.journeyCompleted ? '✅' : (data.racha.daysSinceActive !== null ? (data.racha.daysSinceActive === 0 ? 'Hoy' : data.racha.daysSinceActive + ' días') : '—')}</div>
                    <div class="stat-label">Última actividad</div>
                </div>
            </div>

            <div class="progreso-section">
                <h3>Actividad mensual</h3>
                <div class="chart-container">
                    <canvas id="progresoChart"></canvas>
                </div>
            </div>

            <div class="progreso-section">
                <h3>Módulos de Mi Viaje</h3>
                <div class="progreso-modulos">
                    ${data.viaje.modulesCompleted.map(mod => `
                        <div class="modulo-row ${mod.completed ? 'completed' : ''}">
                            <span class="modulo-check">${mod.completed ? '✓' : '○'}</span>
                            <span class="modulo-name">${mod.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            ${data.sesiones.tier === 'premium' ? `
            <div class="progreso-section">
                <h3>Sesiones 1/1 este mes</h3>
                <div class="sesiones-bar-container">
                    <div class="sesiones-bar">
                        <div class="sesiones-bar-fill" style="width: ${Math.min(100, (data.sesiones.minutesConsumed / data.sesiones.minutesAvailable) * 100)}%"></div>
                    </div>
                    <p class="sesiones-label">${data.sesiones.minutesConsumed} de ${data.sesiones.minutesAvailable} minutos usados</p>
                </div>
            </div>
            ` : `
            <div class="progreso-section progreso-upgrade">
                <p>⛰️ Las sesiones 1/1 con Fernando están disponibles en el plan Transforma.</p>
                <button class="upgrade-btn" onclick="window.location.href='landing.html'">Conocer Transforma</button>
            </div>
            `}

            <div class="progreso-section">
                <button id="openBitacoraBtn" class="save-btn">📖 Abrir Bitácora de Sesiones</button>
            </div>
        `;

        this.initChart(data.mensajes.porMes);

        const bitacoraBtn = document.getElementById('openBitacoraBtn');
        if (bitacoraBtn) {
            bitacoraBtn.addEventListener('click', () => {
                document.getElementById('progresoModal').style.display = 'none';
                if (window.MODULOS) window.MODULOS.toggleProgreso();
            });
        }
    },

    initChart(porMes) {
        const canvas = document.getElementById('progresoChart');
        if (!canvas) return;

        if (this.chartInstance) this.chartInstance.destroy();

        const ctx = canvas.getContext('2d');
        const labels = porMes.map(m => {
            const parts = m.mes.split('-');
            const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            return meses[parseInt(parts[1]) - 1] + ' ' + parts[0];
        });

        this.chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Tú',
                        data: porMes.map(m => m.usuario),
                        backgroundColor: '#8e7d6d',
                        borderRadius: 4
                    },
                    {
                        label: 'Mentor IA',
                        data: porMes.map(m => m.ia),
                        backgroundColor: '#c4b5a5',
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { font: { size: 12 }, color: '#5a5a5a' }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#8e7d6d' }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1, color: '#8e7d6d' },
                        grid: { color: '#f0e8e0' }
                    }
                }
            }
        });
    }
};
