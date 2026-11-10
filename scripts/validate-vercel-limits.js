// Guardián del límite de Serverless Functions de Vercel.
//
// El plan Hobby permite 12 funciones por deployment. Al superarlo, el
// deployment falla y no se publica nada. Este script lo detecta antes de
// hacer push.
//
// Reglas de Vercel para el runtime Node:
//   - Cada .js/.ts/.mjs de primer nivel en /api es una función (ruta /api/<nombre>).
//   - Las subcarpetas SÍ generan rutas anidadas (api/foo/bar.js → /api/foo/bar).
//   - Los ficheros y carpetas que empiezan por "_" se ignoran
//     (por eso api/_lib/*.js no cuenta).
//
// Uso: node scripts/validate-vercel-limits.js

const fs = require('fs');
const path = require('path');

const LIMITE_HOBBY = 12;
const API_DIR = 'api';

function listarFunciones() {
    const funciones = [];

    if (!fs.existsSync(API_DIR)) return funciones;

    const walk = (dir) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            // Vercel ignora lo que empieza por "_"
            if (entry.name.startsWith('_')) continue;

            const full = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                walk(full);
                continue;
            }

            if (/\.(js|mjs|cjs|ts|mts|cts|jsx|tsx)$/i.test(entry.name)) {
                // .d.ts no genera función
                if (/\.d\.ts$/i.test(entry.name)) continue;
                funciones.push(full.replace(/\\/g, '/'));
            }
        }
    };

    walk(API_DIR);
    return funciones.sort();
}

const funciones = listarFunciones();
// Índices y otros ficheros de configuración no cuentan como función.
const exclusiones = [/\/index\.(js|ts|mjs)$/i];
const reales = funciones.filter(f => !exclusiones.some(re => re.test(f)));

console.log('\n=== Límite de Serverless Functions de Vercel ===\n');
reales.forEach(f => console.log(`   · ${f}`));
console.log(`\nFunciones detectadas: ${reales.length} / ${LIMITE_HOBBY}`);

let error = false;

if (reales.length > LIMITE_HOBBY) {
    console.error(
        `\n❌ Te has pasado del límite: ${reales.length} funciones frente a ${LIMITE_HOBBY}.\n` +
        `   Vercel Hobby no desplegará nada. Fusiona o elimina alguna, o mueve la lógica\n` +
        `   a api/_lib/ (las rutas con "_" no generan función).\n`
    );
    error = true;
} else if (reales.length === LIMITE_HOBBY) {
    console.log(`\n⚠️  Estás justo en el límite. La próxima función hará fallar el deployment.\n`);
} else {
    console.log(`\n✅ Dentro del límite (quedan ${LIMITE_HOBBY - reales.length} libres).\n`);
}

// Aviso si hay tests o utilidades dentro de /api que pudieran exponerse.
const sospechosos = funciones.filter(f => /test|spec|fixture|mock/i.test(f));
if (sospechosos.length) {
    console.log('⚠️  Hay ficheros de test/utilidades dentro de api/ y podrían contarse o publicarse:');
    sospechosos.forEach(f => console.log(`   · ${f}`));
    console.log('');
}

// Comprobación del vercel.json: el glob de "functions" no debería afectar al
// recuento, pero avisamos si incluye rutas con "_" por claridad.
try {
    const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
    const globs = Object.keys(vercel.functions || {});
    if (globs.length) {
        console.log(`vercel.json → functions: ${globs.join(', ')}`);
    }
} catch (e) {
    console.log('⚠️  No se pudo leer vercel.json:', e.message);
}

process.exit(error ? 1 : 0);
