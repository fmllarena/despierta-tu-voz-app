const https = require('https');
const path = require('path');
const fs = require('fs');

const envPath = path.join('c:', 'Projects', 'appDTV', 'despierta-tu-voz-app', '.agent', 'skills', 'dtv_marketing_manager', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const metaTokenMatch = envContent.match(/META_USER_ACCESS_TOKEN=([^\s]+)/);
const token = metaTokenMatch ? metaTokenMatch[1] : null;

const REQUIRED_PERMS = [
    'instagram_content_publish',
    'instagram_basic',
    'pages_read_engagement',
    'pages_manage_posts',
    'pages_show_list'
];

const options = {
    hostname: 'graph.facebook.com',
    path: `/v18.0/me/permissions?access_token=${token}`,
    method: 'GET'
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const perms = JSON.parse(data);
            const granted = perms.data ? perms.data.filter(p => p.status === 'granted').map(p => p.permission) : [];

            console.log('--- PERMISSION CHECK ---');
            REQUIRED_PERMS.forEach(p => {
                console.log(`${p}: ${granted.includes(p) ? '✅ GRANTED' : '❌ MISSING'}`);
            });
            console.log('--- OTHER GRANTED ---');
            granted.filter(p => !REQUIRED_PERMS.includes(p)).forEach(p => console.log(p));
        } catch (e) {
            console.error('Error:', e);
        }
    });
});

req.on('error', (e) => { console.error(e); });
req.end();
