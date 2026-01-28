#!/usr/bin/env node

/**
 * Test Script - Verifica que todos los módulos funcionen correctamente
 */

const fs = require('fs');
const path = require('path');

console.log('\n🧪 DTV Marketing Manager - Test Suite\n');
console.log('═'.repeat(50));

let testsPass = 0;
let testsFail = 0;

/**
 * Test helper
 */
function test(name, fn) {
    try {
        fn();
        console.log(`✅ ${name}`);
        testsPass++;
    } catch (error) {
        console.log(`❌ ${name}`);
        console.log(`   Error: ${error.message}`);
        testsFail++;
    }
}

// Test 1: Verificar estructura de archivos
test('Estructura de archivos', () => {
    const requiredFiles = [
        'SKILL.md',
        'README.md',
        '.env.example',
        '.gitignore',
        'resources/weekly_plan.json',
        'resources/prompts.json',
        'scripts/run.js',
        'scripts/calendar_logic.js',
        'scripts/content_generator.js',
        'scripts/image_generator.js',
        'scripts/bitly_shortener.js',
        'scripts/meta_publisher.js'
    ];

    requiredFiles.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        if (!fs.existsSync(filePath)) {
            throw new Error(`Archivo faltante: ${file}`);
        }
    });
});

// Test 2: Verificar JSON válido
test('JSON válido - weekly_plan.json', () => {
    const jsonPath = path.join(__dirname, '..', 'resources', 'weekly_plan.json');
    const data = fs.readFileSync(jsonPath, 'utf8');
    JSON.parse(data); // Lanzará error si no es válido
});

test('JSON válido - prompts.json', () => {
    const jsonPath = path.join(__dirname, '..', 'resources', 'prompts.json');
    const data = fs.readFileSync(jsonPath, 'utf8');
    JSON.parse(data);
});

// Test 3: Verificar módulos cargables
test('Módulo calendar_logic cargable', () => {
    const CalendarLogic = require('./calendar_logic.js');
    if (!CalendarLogic.getCurrentDay) {
        throw new Error('Método getCurrentDay no encontrado');
    }
});

test('Módulo content_generator cargable', () => {
    const ContentGenerator = require('./content_generator.js');
    if (!ContentGenerator.generateCopy) {
        throw new Error('Método generateCopy no encontrado');
    }
});

test('Módulo image_generator cargable', () => {
    const ImageGenerator = require('./image_generator.js');
    if (!ImageGenerator.generateImages) {
        throw new Error('Método generateImages no encontrado');
    }
});

test('Módulo link_manager cargable', () => {
    const LinkManager = require('./link_manager.js');
    if (!LinkManager.createShortLink) {
        throw new Error('Método createShortLink no encontrado');
    }
});

test('Módulo meta_publisher cargable', () => {
    const MetaPublisher = require('./meta_publisher.js');
    if (!MetaPublisher.publishAsDraft) {
        throw new Error('Método publishAsDraft no encontrado');
    }
});

// Test 4: Verificar lógica de calendario
test('Calendar Logic - Obtener día actual', () => {
    const CalendarLogic = require('./calendar_logic.js');
    const day = CalendarLogic.getCurrentDay();
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    if (!validDays.includes(day)) {
        throw new Error(`Día inválido: ${day}`);
    }
});

test('Calendar Logic - Obtener estrategia para lunes', () => {
    const CalendarLogic = require('./calendar_logic.js');
    const strategy = CalendarLogic.getStrategyForDay('monday');

    if (!strategy.type || !strategy.theme || !strategy.cta) {
        throw new Error('Estrategia incompleta');
    }
});

// Test 5: Verificar variables de entorno (opcional)
test('Variables de entorno - Verificar .env.example', () => {
    const envPath = path.join(__dirname, '..', '.env.example');
    const envContent = fs.readFileSync(envPath, 'utf8');

    const requiredVars = [
        'META_ACCESS_TOKEN',
        'META_PAGE_ID',
        'META_INSTAGRAM_ACCOUNT_ID',
        'DTV_BASE_URL',
        'DTV_PUBLISH_MODE'
    ];

    requiredVars.forEach(varName => {
        if (!envContent.includes(varName)) {
            throw new Error(`Variable faltante en .env.example: ${varName}`);
        }
    });
});

// Test 6: Verificar plan semanal completo
test('Plan semanal - Todos los días configurados', () => {
    const CalendarLogic = require('./calendar_logic.js');
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    days.forEach(day => {
        const strategy = CalendarLogic.getStrategyForDay(day);
        if (!strategy) {
            throw new Error(`Falta estrategia para ${day}`);
        }
    });
});

// Resumen
console.log('\n' + '═'.repeat(50));
console.log(`\n📊 Resultados:`);
console.log(`   ✅ Tests pasados: ${testsPass}`);
console.log(`   ❌ Tests fallidos: ${testsFail}`);
console.log(`   📈 Total: ${testsPass + testsFail}`);

if (testsFail === 0) {
    console.log('\n🎉 ¡Todos los tests pasaron! La Skill está lista para usar.\n');
    console.log('📝 Próximos pasos:');
    console.log('   1. Copia .env.example a .env');
    console.log('   2. Configura tus tokens en .env');
    console.log('   3. Ejecuta: node scripts/run.js --mode=assets_only\n');
    process.exit(0);
} else {
    console.log('\n⚠️  Algunos tests fallaron. Revisa los errores arriba.\n');
    process.exit(1);
}
