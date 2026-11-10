// Auditoría del CSS de la app: duplicados, repeticiones y colores redundantes.
//
// Uso: node scripts/audit-css.js
//
// No modifica nada: solo informa.

const fs = require('fs');
const path = require('path');

const FICHEROS = ['css/style.css', 'css/modals.css', 'css/chat-extras.css'];

/* ── Parser mínimo de CSS ────────────────────────────────────────────────── */
function parsear(css) {
    css = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const reglas = [];
    let i = 0;
    let buffer = '';
    const pila = []; // contextos @media

    while (i < css.length) {
        const c = css[i];

        if (c === '{') {
            const sel = buffer.trim().replace(/\s+/g, ' ');
            buffer = '';

            if (sel.startsWith('@')) {
                pila.push(sel);
                i++;
                continue;
            }

            // cuerpo de la regla
            let j = i + 1;
            let depth = 1;
            let cuerpo = '';
            while (j < css.length && depth > 0) {
                if (css[j] === '{') depth++;
                else if (css[j] === '}') { depth--; if (depth === 0) break; }
                cuerpo += css[j];
                j++;
            }

            reglas.push({
                selector: sel,
                declaraciones: cuerpo.trim(),
                media: pila.length ? pila[pila.length - 1] : null
            });

            i = j + 1;
            continue;
        }

        if (c === '}') {
            pila.pop();
            buffer = '';
            i++;
            continue;
        }

        buffer += c;
        i++;
    }

    return reglas;
}

/** Propiedades de un bloque, ordenadas, para comparar cuerpos. */
function normalizar(cuerpo) {
    return cuerpo
        .split(';')
        .map(d => d.trim())
        .filter(Boolean)
        .map(d => d.replace(/\s*:\s*/, ':').replace(/\s+/g, ' '))
        .sort()
        .join(';');
}

/* ── Carga ───────────────────────────────────────────────────────────────── */
const reglas = [];
for (const f of FICHEROS) {
    if (!fs.existsSync(f)) continue;
    const css = fs.readFileSync(f, 'utf8');
    parsear(css).forEach(r => reglas.push({ ...r, archivo: f }));
}

const totalDeclaraciones = reglas.reduce(
    (n, r) => n + r.declaraciones.split(';').filter(d => d.trim()).length, 0
);
const important = (reglas.reduce((n, r) => n + (r.declaraciones.match(/!important/g) || []).length, 0));

console.log('\n══════════════════════════════════════════════════════════');
console.log(' AUDITORÍA CSS');
console.log('══════════════════════════════════════════════════════════\n');
console.log(`Ficheros analizados : ${FICHEROS.join(', ')}`);
console.log(`Reglas              : ${reglas.length}`);
console.log(`Declaraciones       : ${totalDeclaraciones}`);
console.log(`Selectores únicos   : ${new Set(reglas.map(r => r.selector)).size}`);
console.log(`!important          : ${important}`);

/* ── 1. Cuerpos duplicados (mismas declaraciones, distinto selector) ─────── */
const porCuerpo = new Map();
for (const r of reglas) {
    const norm = normalizar(r.declaraciones);
    if (!norm || norm.length < 25) continue; // ignorar bloques triviales
    if (!porCuerpo.has(norm)) porCuerpo.set(norm, []);
    porCuerpo.get(norm).push(r);
}

const duplicados = [...porCuerpo.entries()]
    .filter(([, rs]) => rs.length > 1 && new Set(rs.map(r => r.selector)).size > 1)
    .sort((a, b) => b[1].length - a[1].length);

console.log(`\n── 1. Bloques idénticos bajo selectores distintos: ${duplicados.length}\n`);
duplicados.slice(0, 12).forEach(([cuerpo, rs]) => {
    console.log(`  ● ${rs.length} selectores con las mismas ${cuerpo.split(';').length} declaraciones:`);
    rs.slice(0, 6).forEach(r => console.log(`      ${r.selector}   (${r.archivo}:${r.media ? ' @media' : ''})`));
    if (rs.length > 6) console.log(`      … y ${rs.length - 6} más`);
    console.log(`      → ${cuerpo.slice(0, 90)}${cuerpo.length > 90 ? '…' : ''}\n`);
});

/* ── 2. Selectores declarados varias veces ───────────────────────────────── */
const porSelector = new Map();
for (const r of reglas) {
    if (!porSelector.has(r.selector)) porSelector.set(r.selector, []);
    porSelector.get(r.selector).push(r);
}

const repetidos = [...porSelector.entries()]
    .filter(([, rs]) => rs.length > 1)
    .sort((a, b) => b[1].length - a[1].length);

console.log(`── 2. Selectores declarados más de una vez: ${repetidos.length}\n`);
repetidos.slice(0, 12).forEach(([sel, rs]) => {
    // Propiedades repetidas entre bloques del mismo selector
    const props = rs.map(r => r.declaraciones.split(';').map(d => d.split(':')[0].trim()).filter(Boolean));
    const todas = props.flat();
    const repetidas = todas.filter((p, idx) => todas.indexOf(p) !== idx);
    const conflicto = [...new Set(repetidas)];
    console.log(`  ● ${sel}  → ${rs.length} bloques (${rs.map(r => r.archivo.replace('css/', '')).join(', ')})`);
    if (conflicto.length) console.log(`      propiedades repetidas: ${conflicto.join(', ')}`);
    console.log('');
});

/* ── 3. Colores literales que ya existen como variable ───────────────────── */
const vars = {};
const raiz = fs.readFileSync('css/style.css', 'utf8').match(/html\[data-theme="dark"\]\s*\{([\s\S]*?)\}/);
if (raiz) {
    raiz[1].split(';').forEach(l => {
        const m = l.match(/--([\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8})/);
        if (m) vars[m[2].toLowerCase()] = `--${m[1]}`;
    });
}

const literales = new Map();
for (const r of reglas) {
    const m = r.declaraciones.match(/#[0-9a-fA-F]{6}\b/g) || [];
    m.forEach(c => {
        const key = c.toLowerCase();
        if (vars[key]) {
            if (!literales.has(key)) literales.set(key, { varName: vars[key], usos: [] });
            literales.get(key).usos.push(r.selector);
        }
    });
}

console.log(`── 3. Colores literales que duplican una variable del tema oscuro: ${literales.size}\n`);
[...literales.entries()].forEach(([color, info]) => {
    console.log(`  ● ${color} = var(${info.varName})  → ${info.usos.length} usos`);
});

/* ── 4. Reglas de modo oscuro con fondo y color ──────────────────────────── */
console.log('\n── 4. Fondos de contenedores en modo oscuro (para unificar) ──\n');
const contenedores = reglas.filter(r =>
    /data-theme="dark"/.test(r.selector) &&
    /(modal-content|card|panel|box|modal)/i.test(r.selector) &&
    /background/.test(r.declaraciones)
);
contenedores.forEach(r => {
    const bg = (r.declaraciones.match(/background[^;]*/) || [''])[0];
    const color = (r.declaraciones.match(/(?:^|;)\s*color[^;]*/) || [''])[0];
    console.log(`  ${r.selector}`);
    console.log(`      ${bg}${color ? ' | ' + color.trim() : ''}`);
});

console.log('\n══════════════════════════════════════════════════════════\n');
