#!/usr/bin/env node

/**
 * Verify Tokens - Verifica que todos los tokens estén configurados correctamente
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const https = require('https');

console.log('\n🔍 DTV Marketing Manager - Verificación de Tokens\n');
console.log('═'.repeat(60));

const tokens = {
    'META_ACCESS_TOKEN': process.env.META_ACCESS_TOKEN || process.env.META_USER_ACCESS_TOKEN,
    'META_PAGE_ID': process.env.META_PAGE_ID,
    'META_INSTAGRAM_ACCOUNT_ID': process.env.META_INSTAGRAM_ACCOUNT_ID,
    'GEMINI_API_KEY': process.env.GEMINI_API_KEY,
    'DTV_BASE_URL': process.env.DTV_BASE_URL,
    'DTV_PUBLISH_MODE': process.env.DTV_PUBLISH_MODE,
};

let allConfigured = true;

// Verificar presencia de tokens
console.log('\n📋 Verificando presencia de variables...\n');

Object.entries(tokens).forEach(([name, value]) => {
    if (!value || value.includes('your_') || value.includes('_here')) {
        console.log(`❌ ${name}: NO CONFIGURADO`);
        allConfigured = false;
    } else {
        const preview = value.length > 20
            ? value.substring(0, 10) + '...' + value.substring(value.length - 4)
            : value;
        console.log(`✅ ${name}: ${preview}`);
    }
});

if (!allConfigured) {
    console.log('\n⚠️  Algunas variables no están configuradas.');
    console.log('   Consulta TOKENS_GUIDE.md para obtener los tokens.\n');
    process.exit(1);
}

console.log('\n' + '═'.repeat(60));
console.log('\n🧪 Verificando validez de tokens...\n');

// Verificar Meta Access Token
async function verifyMetaToken() {
    return new Promise((resolve) => {
        if (!tokens.META_ACCESS_TOKEN || tokens.META_ACCESS_TOKEN.includes('your_')) {
            console.log('⏭️  META_ACCESS_TOKEN: Saltando verificación (no configurado)');
            resolve(false);
            return;
        }

        const options = {
            hostname: 'graph.facebook.com',
            path: `/v18.0/me?access_token=${tokens.META_ACCESS_TOKEN}`,
            method: 'GET'
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const response = JSON.parse(data);
                    console.log(`✅ META_ACCESS_TOKEN: Válido (User: ${response.name || 'Unknown'})`);
                    resolve(true);
                } else {
                    console.log(`❌ META_ACCESS_TOKEN: Inválido (${res.statusCode})`);
                    console.log(`   Error: ${data}`);
                    resolve(false);
                }
            });
        });

        req.on('error', (error) => {
            console.log(`❌ META_ACCESS_TOKEN: Error de conexión (${error.message})`);
            resolve(false);
        });

        req.end();
    });
}

// Verificar Gemini API Key
async function verifyGeminiKey() {
    return new Promise((resolve) => {
        if (!tokens.GEMINI_API_KEY || tokens.GEMINI_API_KEY.includes('your_')) {
            console.log('⏭️  GEMINI_API_KEY: Saltando verificación (no configurado)');
            resolve(false);
            return;
        }

        const postData = JSON.stringify({
            contents: [{
                parts: [{ text: 'Test' }]
            }]
        });

        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${tokens.GEMINI_API_KEY}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log(`✅ GEMINI_API_KEY: Válido`);
                    resolve(true);
                } else {
                    console.log(`❌ GEMINI_API_KEY: Inválido (${res.statusCode})`);
                    console.log(`   Error: ${data.substring(0, 200)}`);
                    resolve(false);
                }
            });
        });

        req.on('error', (error) => {
            console.log(`❌ GEMINI_API_KEY: Error de conexión (${error.message})`);
            resolve(false);
        });

        req.write(postData);
        req.end();
    });
}

// Ejecutar verificaciones
async function runVerifications() {
    const metaValid = await verifyMetaToken();
    const geminiValid = await verifyGeminiKey();

    console.log('\n' + '═'.repeat(60));
    console.log('\n📊 Resumen de Verificación:\n');

    const results = {
        'Meta Graph API': metaValid,
        'Gemini API': geminiValid,
    };

    Object.entries(results).forEach(([name, valid]) => {
        console.log(`   ${valid ? '✅' : '❌'} ${name}`);
    });

    const allValid = Object.values(results).every(v => v);

    console.log('\n' + '═'.repeat(60));

    if (allValid) {
        console.log('\n🎉 ¡Todos los tokens están configurados y son válidos!\n');
        console.log('✅ Próximos pasos:');
        console.log('   1. Ejecuta: node scripts/test.js');
        console.log('   2. Prueba: node scripts/run.js --mode=assets_only\n');
        process.exit(0);
    } else {
        console.log('\n⚠️  Algunos tokens no son válidos o no están configurados.\n');
        console.log('📚 Consulta TOKENS_GUIDE.md para obtener ayuda.\n');
        process.exit(1);
    }
}

runVerifications();
