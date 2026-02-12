const fs = require('fs');
const path = require('path');

const KNOWLEDGE_PATH = path.join(__dirname, '..', 'resources', 'blog_knowledge.json');

const BLOG_POSTS = [
    {
        title: "Carta dirigida al solista corista",
        url: "https://despiertatuvoz.com/carta-dirigida-al-solista-corista/",
        category: "Coro / Psicología"
    },
    {
        title: "La creatividad es la manera que tiene la Vida de manifestar amor.",
        url: "https://despiertatuvoz.com/la-creatividad-es-la-manera-que-tiene-la-vida-de-manifestar-amor/",
        category: "Filosofía / Creatividad"
    },
    {
        title: "El amor es dar sin esperar nada a cambio.",
        url: "https://despiertatuvoz.com/el-amor-es-dar-sin-esperar-nada-a-cambio/",
        category: "Filosofía"
    },
    {
        title: "Nada ni nadie te está atacando y de nada te has de defender.",
        url: "https://despiertatuvoz.com/nada-ni-nadie-te-esta-atacando-y-de-nada-te-has-de-defender/",
        category: "Psicología / Paz Mental"
    },
    {
        title: "Patrones repetititvos vinculados a eventos pasados no resueltos.",
        url: "https://despiertatuvoz.com/patrones-repetitivos-vinculados-a-eventos-pasados-no-resueltos/",
        category: "Psicología / Trauma"
    },
    {
        title: "El reconocimiento externo y su origen en la infancia",
        url: "https://despiertatuvoz.com/el-reconocimiento-externo-y-su-origen-en-la-infancia/",
        category: "Psicología / Ego"
    },
    {
        title: "Me gusta escuchar el gorjeo del pájaro en la mañana.",
        url: "https://despiertatuvoz.com/me-gusta-escuchar-el-gorjeo-del-pajaro-en-la-manana/",
        category: "Naturaleza / Conexión"
    },
    {
        title: "El estado de alarma simbolizó el encierro de nuestro ego a nuestro ser.",
        url: "https://despiertatuvoz.com/el-estado-de-alarma-simbolizo-el-encierro-de-nuestro-ego-a-nuestro-ser/",
        category: "Filosofía / Ego"
    },
    {
        title: "La lógica de lo natural no entiende la lógica mental.",
        url: "https://despiertatuvoz.com/la-logica-de-lo-natural-no-entiende-la-logica-mental/",
        category: "Naturaleza / Mente"
    },
    {
        title: "Dejar de ver enemigos es el inicio para tener paz con uno mismo.",
        url: "https://despiertatuvoz.com/dejar-de-ver-enemigos-es-el-inicio-para-tener-paz-con-uno-mismo/",
        category: "Paz Mental / Relaciones"
    }
];

// Este script es un placeholder para que el agente rellene los contenidos
// El agente usará read_url_content para obtener el texto de cada URL y actualizar este JSON
fs.writeFileSync(KNOWLEDGE_PATH, JSON.stringify({ posts: BLOG_POSTS }, null, 2));
console.log(`Archivo de conocimiento creado en: ${KNOWLEDGE_PATH}`);
